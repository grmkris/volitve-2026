"use client"

import { useCallback, useMemo, useState } from "react"

import {
  ElectionMap,
  MARGIN_SCALE,
  TURNOUT_SCALE,
  OVERPERF_SCALE,
  type SelectedRegion,
} from "@/components/map/election-map"
import { MapRegionPanel } from "@/components/map/map-region-panel"
import staticKandidati from "@/lib/data/static/kandidati_rezultat.json"
// Import static data directly for client component
import staticRezultati from "@/lib/data/static/rezultati.json"
import staticUdelezba from "@/lib/data/static/udelezba.json"
import { buildNationalResults } from "@/lib/data/transforms"
import type {
  RawRezultati,
  RawUdelezba,
  RawKandidatiRezultat,
  PartyInfo,
  MapMode,
} from "@/lib/data/types"
import { cn } from "@/lib/utils"

const MODES: { key: MapMode; label: string }[] = [
  { key: "winner", label: "Zmagovalec" },
  { key: "margin", label: "Razlika" },
  { key: "turnout", label: "Udeležba" },
  { key: "secondPlace", label: "2. mesto" },
  { key: "overperformance", label: "Nad/pod povp." },
]

function ScaleGradient({
  stops,
  leftLabel,
  rightLabel,
  centerLabel,
}: {
  stops: [number, [number, number, number]][]
  leftLabel: string
  rightLabel: string
  centerLabel?: string
}) {
  const colors = stops.map(([, [r, g, b]]) => `rgb(${r},${g},${b})`)
  const gradient = `linear-gradient(to right, ${colors.join(", ")})`
  return (
    <div className="w-40">
      <div
        className="h-2 w-full rounded-full"
        style={{ background: gradient }}
      />
      <div className="mt-0.5 flex justify-between text-[9px] text-muted-foreground">
        <span>{leftLabel}</span>
        {centerLabel && <span>{centerLabel}</span>}
        <span>{rightLabel}</span>
      </div>
    </div>
  )
}

export default function ZemljevidPage() {
  const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(
    null
  )
  const [mapMode, setMapMode] = useState<MapMode>("winner")
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null)

  const data = useMemo(() => {
    const results = buildNationalResults({
      rezultati: staticRezultati as RawRezultati,
      udelezba: staticUdelezba as RawUdelezba,
      kandidati: staticKandidati as RawKandidatiRezultat,
    })

    // Serialize partyMap to plain object
    const partyMapObj: Record<number, PartyInfo> = {}
    results.partyMap.forEach((party, id) => {
      partyMapObj[id] = { color: party.color, abbrev: party.abbrev }
    })

    // National percentages for overperformance
    const nationalPcts: Record<number, number> = {}
    for (const p of results.parties) {
      nationalPcts[p.id] = p.percentage
    }

    return {
      enote: results.enote,
      partyMap: partyMapObj,
      nationalPcts,
      parliamentaryParties: results.parliamentaryParties,
    }
  }, [])

  const handleClose = useCallback(() => setSelectedRegion(null), [])

  const handleModeChange = useCallback(
    (mode: MapMode) => {
      setMapMode(mode)
      if (mode === "overperformance") {
        setSelectedPartyId(
          (prev) => prev ?? (data.parliamentaryParties[0]?.id as number) ?? null
        )
      }
    },
    [data.parliamentaryParties]
  )

  const showLegend =
    mapMode === "margin" ||
    mapMode === "turnout" ||
    mapMode === "overperformance"

  return (
    <div className="flex h-[calc(100svh-56px)] flex-col md:h-svh md:flex-row">
      {/* Map */}
      <div className="relative flex-1">
        <ElectionMap
          enote={data.enote}
          partyMap={data.partyMap}
          mapMode={mapMode}
          selectedPartyId={selectedPartyId}
          nationalPcts={data.nationalPcts}
          onRegionSelect={setSelectedRegion}
          className="h-full w-full"
        />

        {/* Controls overlay */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-start gap-2 p-3">
          {/* Mode toggle */}
          <div className="pointer-events-auto rounded-lg bg-card/90 p-1 shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm">
            <div className="flex flex-wrap gap-0.5">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => handleModeChange(m.key)}
                  className={cn(
                    "rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                    mapMode === m.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Party selector for overperformance mode */}
          {mapMode === "overperformance" && (
            <div className="pointer-events-auto rounded-lg bg-card/90 p-1.5 shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm">
              <div className="flex flex-wrap gap-1">
                {data.parliamentaryParties.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPartyId(p.id as number)}
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
                      selectedPartyId === (p.id as number)
                        ? "text-white"
                        : "bg-muted text-muted-foreground"
                    )}
                    style={
                      selectedPartyId === (p.id as number)
                        ? { backgroundColor: p.color }
                        : undefined
                    }
                  >
                    {p.abbrev}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Legend for continuous scales */}
          {showLegend && (
            <div className="pointer-events-auto rounded-lg bg-card/90 px-3 py-2 shadow-lg ring-1 ring-foreground/10 backdrop-blur-sm">
              {mapMode === "margin" && (
                <ScaleGradient
                  stops={MARGIN_SCALE}
                  leftLabel="Tesno"
                  rightLabel="Premoč"
                />
              )}
              {mapMode === "turnout" && (
                <ScaleGradient
                  stops={TURNOUT_SCALE}
                  leftLabel="40 %"
                  rightLabel="80 %"
                />
              )}
              {mapMode === "overperformance" && (
                <ScaleGradient
                  stops={OVERPERF_SCALE}
                  leftLabel="−15 o.t."
                  centerLabel="0"
                  rightLabel="+15 o.t."
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Desktop side panel */}
      <div className="hidden w-80 shrink-0 overflow-y-auto border-l border-border/50 bg-background md:block">
        {selectedRegion ? (
          <MapRegionPanel
            region={selectedRegion}
            partyMap={data.partyMap}
            onClose={handleClose}
            className="relative"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-center text-xs text-muted-foreground">
            Kliknite na regijo na zemljevidu za prikaz podrobnosti.
          </div>
        )}
      </div>

      {/* Mobile bottom panel */}
      <div className="md:hidden">
        <MapRegionPanel
          region={selectedRegion}
          partyMap={data.partyMap}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}
