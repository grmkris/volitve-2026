"use client"

import { useCallback, useMemo, useState } from "react"
import {
  ElectionMap,
  type SelectedRegion,
} from "@/components/map/election-map"
import { MapRegionPanel } from "@/components/map/map-region-panel"
import { buildNationalResults } from "@/lib/data/transforms"
import type { RawRezultati, RawUdelezba, RawKandidatiRezultat, PartyInfo } from "@/lib/data/types"

// Import static data directly for client component
import staticRezultati from "@/lib/data/static/rezultati.json"
import staticUdelezba from "@/lib/data/static/udelezba.json"
import staticKandidati from "@/lib/data/static/kandidati_rezultat.json"

export default function ZemljevidPage() {
  const [selectedRegion, setSelectedRegion] = useState<SelectedRegion | null>(
    null
  )

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

    return { enote: results.enote, partyMap: partyMapObj }
  }, [])

  const handleClose = useCallback(() => setSelectedRegion(null), [])

  return (
    <div className="flex h-[calc(100svh-56px)] flex-col md:h-svh md:flex-row">
      {/* Map */}
      <div className="relative flex-1">
        <ElectionMap
          enote={data.enote}
          partyMap={data.partyMap}
          onRegionSelect={setSelectedRegion}
          className="h-full w-full"
        />
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
