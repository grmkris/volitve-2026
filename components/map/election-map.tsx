"use client"

import { useQuery } from "@tanstack/react-query"
import type { ExpressionSpecification } from "maplibre-gl"
import { useCallback, useMemo, useState } from "react"

import { Map, MapControls } from "@/components/ui/map"
import type {
  EnotaResult,
  OkrajResult,
  PartyInfo,
  MapMode,
} from "@/lib/data/types"
import { loadTopoJSON } from "@/lib/geo/loader"
import { cn } from "@/lib/utils"

import { MapGeoJSONLayer } from "./map-geojson-layer"

// ── Color scales ──────────────────────────────────────────────────────

type RGB = [number, number, number]
type ColorStop = [number, RGB]

export const MARGIN_SCALE: ColorStop[] = [
  [0.0, [239, 237, 245]],
  [0.02, [218, 218, 235]],
  [0.05, [188, 189, 220]],
  [0.1, [158, 154, 200]],
  [0.15, [128, 125, 186]],
  [0.2, [106, 81, 163]],
  [0.3, [74, 20, 134]],
]

export const TURNOUT_SCALE: ColorStop[] = [
  [0.4, [239, 243, 255]],
  [0.5, [198, 219, 239]],
  [0.55, [158, 202, 225]],
  [0.6, [107, 174, 214]],
  [0.65, [66, 146, 198]],
  [0.7, [33, 113, 181]],
  [0.8, [8, 69, 148]],
]

export const OVERPERF_SCALE: ColorStop[] = [
  [-0.15, [178, 24, 43]],
  [-0.08, [239, 138, 98]],
  [-0.03, [253, 219, 199]],
  [0.0, [247, 247, 247]],
  [0.03, [209, 229, 240]],
  [0.08, [103, 169, 207]],
  [0.15, [33, 102, 172]],
]

function interpolateScale(value: number, stops: ColorStop[]): string {
  const first = stops[0]
  const last = stops.at(-1)
  if (!first || !last) return "#f7f7f7"

  if (value <= first[0]) return rgbHex(first[1])
  if (value >= last[0]) return rgbHex(last[1])

  for (let i = 0; i < stops.length - 1; i++) {
    const curr = stops[i]
    const next = stops[i + 1]
    if (!curr || !next) continue
    if (value <= next[0]) {
      const t = (value - curr[0]) / (next[0] - curr[0])
      const [r1, g1, b1] = curr[1]
      const [r2, g2, b2] = next[1]
      return rgbHex([
        Math.round(r1 + (r2 - r1) * t),
        Math.round(g1 + (g2 - g1) * t),
        Math.round(b1 + (b2 - b1) * t),
      ])
    }
  }
  return rgbHex(last[1])
}

function rgbHex([r, g, b]: RGB): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
}

// ── Types ─────────────────────────────────────────────────────────────

export interface SelectedRegion {
  type: "enota" | "okraj"
  rpeid: string
  name: string
  st: number
  enotaSt?: number
  winnerId: number
  runnerUpId?: number
  margin?: number
  turnoutPct: number
  parties: { partyId: number; votes: number; percentage: number }[]
}

interface ElectionMapProps {
  enote: EnotaResult[]
  partyMap: Record<number, PartyInfo>
  mapMode?: MapMode
  selectedPartyId?: number | null
  nationalPcts?: Record<number, number>
  onRegionSelect?: (region: SelectedRegion | null) => void
  className?: string
}

// ── Component ─────────────────────────────────────────────────────────

export function ElectionMap({
  enote,
  partyMap,
  mapMode = "winner",
  selectedPartyId = null,
  nationalPcts = {},
  onRegionSelect,
  className,
}: ElectionMapProps) {
  const [zoom, setZoom] = useState(7.5)

  const { data: enoteGeo, error: enoteError } = useQuery({
    queryKey: ["geo", "enote"],
    queryFn: () => loadTopoJSON("/geo/enote.topojson"),
    staleTime: Infinity,
    retry: 2,
  })

  const { data: okrajiGeo } = useQuery({
    queryKey: ["geo", "okraji"],
    queryFn: () => loadTopoJSON("/geo/okraji.topojson"),
    enabled: zoom >= 7.5,
    staleTime: Infinity,
    retry: 2,
  })

  // Build okraj lookup: rpeid → OkrajResult
  const okrajLookup = useMemo(() => {
    const lookup = new globalThis.Map<
      string,
      OkrajResult & { enotaSt: number }
    >()
    for (const enota of enote) {
      for (const okraj of enota.okraji) {
        lookup.set(okraj.rpeid, { ...okraj, enotaSt: enota.st })
      }
    }
    return lookup
  }, [enote])

  // Build color expressions based on active map mode
  const { enoteExpr, okrajiExpr } = useMemo(() => {
    function colorForRegion(
      winnerId: number,
      runnerUpId: number | undefined,
      margin: number,
      turnoutPct: number,
      parties: { partyId: number; percentage: number }[]
    ): string {
      switch (mapMode) {
        case "winner":
          return partyMap[winnerId]?.color ?? "#cccccc"
        case "secondPlace":
          return runnerUpId != null
            ? (partyMap[runnerUpId]?.color ?? "#cccccc")
            : "#cccccc"
        case "margin":
          return interpolateScale(margin, MARGIN_SCALE)
        case "turnout":
          return interpolateScale(turnoutPct, TURNOUT_SCALE)
        case "overperformance": {
          if (selectedPartyId == null) return "#f7f7f7"
          const localPct =
            parties.find((p) => p.partyId === selectedPartyId)?.percentage ?? 0
          const natPct = nationalPcts[selectedPartyId] ?? 0
          return interpolateScale(localPct - natPct, OVERPERF_SCALE)
        }
        default:
          return "#cccccc"
      }
    }

    // Enote entries
    const enoteEntries: (string | number)[] = []
    for (const enota of enote) {
      const sorted = [...enota.parties].sort(
        (a, b) => b.percentage - a.percentage
      )
      const runnerUpId = sorted[1]?.partyId
      const margin = (sorted[0]?.percentage ?? 0) - (sorted[1]?.percentage ?? 0)
      const color = colorForRegion(
        enota.winnerId,
        runnerUpId,
        margin,
        enota.turnout.percentage,
        enota.parties
      )
      enoteEntries.push(Number(enota.rpeid), color)
    }

    // Okraji entries
    const okrajiEntries: (string | number)[] = []
    for (const enota of enote) {
      for (const okraj of enota.okraji) {
        const color = colorForRegion(
          okraj.winnerId,
          okraj.runnerUpId,
          okraj.margin,
          okraj.turnout.percentage,
          okraj.parties
        )
        okrajiEntries.push(Number(okraj.rpeid), color)
      }
    }

    const buildExpr = (entries: (string | number)[]): ExpressionSpecification =>
      [
        "match",
        ["get", "VDV_ID"],
        ...entries,
        "#cccccc",
      ] as unknown as ExpressionSpecification

    return {
      enoteExpr: buildExpr(enoteEntries),
      okrajiExpr: buildExpr(okrajiEntries),
    }
  }, [enote, partyMap, mapMode, selectedPartyId, nationalPcts])

  const showOkraji = zoom >= 8

  // Handle enota click
  const handleEnoteClick = useCallback(
    (feature: GeoJSON.Feature) => {
      const vdvId = feature.properties?.VDV_ID
      if (vdvId == null) return
      const rpeid = String(vdvId)
      const enota = enote.find((e) => e.rpeid === rpeid)
      if (!enota) return
      const sorted = [...enota.parties].sort(
        (a, b) => b.percentage - a.percentage
      )
      onRegionSelect?.({
        type: "enota",
        rpeid,
        name: enota.name,
        st: enota.st,
        winnerId: enota.winnerId,
        runnerUpId: sorted[1]?.partyId,
        margin: (sorted[0]?.percentage ?? 0) - (sorted[1]?.percentage ?? 0),
        turnoutPct: enota.turnout.percentage,
        parties: enota.parties.map((p) => ({
          partyId: p.partyId,
          votes: p.votes,
          percentage: p.percentage,
        })),
      })
    },
    [enote, onRegionSelect]
  )

  // Handle okraj click
  const handleOkrajiClick = useCallback(
    (feature: GeoJSON.Feature) => {
      const vdvId = feature.properties?.VDV_ID
      if (vdvId == null) return
      const rpeid = String(vdvId)
      const okraj = okrajLookup.get(rpeid)
      if (!okraj) return
      onRegionSelect?.({
        type: "okraj",
        rpeid,
        name: okraj.name,
        st: okraj.st,
        enotaSt: okraj.enotaSt,
        winnerId: okraj.winnerId,
        runnerUpId: okraj.runnerUpId,
        margin: okraj.margin,
        turnoutPct: okraj.turnout.percentage,
        parties: okraj.parties.map((p) => ({
          partyId: p.partyId,
          votes: p.votes,
          percentage: p.percentage,
        })),
      })
    },
    [okrajLookup, onRegionSelect]
  )

  // Error state — rendered after all hooks
  if (enoteError) {
    return (
      <div
        className={cn("flex items-center justify-center bg-card", className)}
      >
        <div className="text-center text-sm text-muted-foreground">
          <p>Zemljevid ni na voljo.</p>
          <p className="mt-1 text-xs">Napaka pri nalaganju podatkov.</p>
        </div>
      </div>
    )
  }

  return (
    <Map
      className={className}
      center={[14.5058, 46.0569]}
      zoom={7.5}
      maxBounds={[
        [13.2, 45.3],
        [16.7, 47.0],
      ]}
      onViewportChange={(vp) => setZoom(vp.zoom)}
    >
      {/* Enote layer (visible at lower zoom) */}
      {enoteGeo && (
        <MapGeoJSONLayer
          id="enote"
          data={enoteGeo}
          fillColor={enoteExpr}
          fillOpacity={0.65}
          lineColor="rgba(255,255,255,0.8)"
          lineWidth={2}
          visible={!showOkraji}
          onClick={handleEnoteClick}
        />
      )}

      {/* Okraji layer (visible at higher zoom) */}
      {okrajiGeo && (
        <MapGeoJSONLayer
          id="okraji"
          data={okrajiGeo}
          fillColor={okrajiExpr}
          fillOpacity={0.7}
          lineColor="rgba(255,255,255,0.6)"
          lineWidth={1}
          visible={showOkraji}
          onClick={handleOkrajiClick}
        />
      )}

      <MapControls showZoom showFullscreen position="bottom-right" />
    </Map>
  )
}
