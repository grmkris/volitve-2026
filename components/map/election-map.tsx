"use client"

import { useCallback, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import type { ExpressionSpecification } from "maplibre-gl"
import { Map, MapControls } from "@/components/ui/map"
import { MapGeoJSONLayer } from "./map-geojson-layer"
import { loadTopoJSON } from "@/lib/geo/loader"
import type { EnotaResult, OkrajResult, PartyInfo } from "@/lib/data/types"

export interface SelectedRegion {
  type: "enota" | "okraj"
  rpeid: string
  name: string
  st: number
  enotaSt?: number
  winnerId: number
  turnoutPct: number
  parties: { partyId: number; votes: number; percentage: number }[]
}

interface ElectionMapProps {
  enote: EnotaResult[]
  partyMap: Record<number, PartyInfo>
  onRegionSelect?: (region: SelectedRegion | null) => void
  className?: string
}

export function ElectionMap({
  enote,
  partyMap,
  onRegionSelect,
  className,
}: ElectionMapProps) {
  const [zoom, setZoom] = useState(7.5)

  const { data: enoteGeo } = useQuery({
    queryKey: ["geo", "enote"],
    queryFn: () => loadTopoJSON("/geo/enote.topojson"),
    staleTime: Infinity,
  })

  const { data: okrajiGeo } = useQuery({
    queryKey: ["geo", "okraji"],
    queryFn: () => loadTopoJSON("/geo/okraji.topojson"),
    enabled: zoom >= 7.5,
    staleTime: Infinity,
  })

  // Build okraj lookup: rpeid → OkrajResult
  const okrajLookup = useMemo(() => {
    const lookup = new globalThis.Map<string, OkrajResult & { enotaSt: number }>()
    for (const enota of enote) {
      for (const okraj of enota.okraji) {
        lookup.set(okraj.rpeid, { ...okraj, enotaSt: enota.st })
      }
    }
    return lookup
  }, [enote])

  // Build color expression for enote layer
  const enoteColorExpr = useMemo((): ExpressionSpecification => {
    const entries: (string | number)[] = []
    for (const enota of enote) {
      const party = partyMap[enota.winnerId]
      if (party) {
        entries.push(Number(enota.rpeid), party.color)
      }
    }
    return ["match", ["get", "VDV_ID"], ...entries, "#cccccc"] as unknown as ExpressionSpecification
  }, [enote, partyMap])

  // Build color expression for okraji layer
  const okrajiColorExpr = useMemo((): ExpressionSpecification => {
    const entries: (string | number)[] = []
    for (const enota of enote) {
      for (const okraj of enota.okraji) {
        const party = partyMap[okraj.winnerId]
        if (party) {
          entries.push(Number(okraj.rpeid), party.color)
        }
      }
    }
    return ["match", ["get", "VDV_ID"], ...entries, "#cccccc"] as unknown as ExpressionSpecification
  }, [enote, partyMap])

  const showOkraji = zoom >= 8

  // Handle enota click
  const handleEnoteClick = useCallback(
    (feature: GeoJSON.Feature) => {
      const vdvId = feature.properties?.VDV_ID
      if (vdvId == null) return
      const rpeid = String(vdvId)
      const enota = enote.find((e) => e.rpeid === rpeid)
      if (!enota) return
      onRegionSelect?.({
        type: "enota",
        rpeid,
        name: enota.name,
        st: enota.st,
        winnerId: enota.winnerId,
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
          fillColor={enoteColorExpr}
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
          fillColor={okrajiColorExpr}
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
