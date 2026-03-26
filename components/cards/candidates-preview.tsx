"use client"

import { useState } from "react"

import { formatNumber, formatPercent } from "@/lib/data/format"

interface CandidateData {
  id: number
  name: string
  partyId: number
  votes: number
  percentage: number
}

interface PartyData {
  color: string
  abbrev: string
}

interface CandidatesPreviewProps {
  candidates: CandidateData[]
  partyMap: Record<number, PartyData>
  initialCount?: number
}

export function CandidatesPreview({
  candidates,
  partyMap,
  initialCount = 20,
}: CandidatesPreviewProps) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? candidates : candidates.slice(0, initialCount)
  const hasMore = candidates.length > initialCount

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">Poslanec</th>
              <th className="pb-2 pr-4 font-medium">Stranka</th>
              <th className="pb-2 pr-4 text-right font-medium">Glasovi</th>
              <th className="pb-2 text-right font-medium">Delež</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const party = partyMap[c.partyId]
              return (
                <tr
                  key={c.id}
                  className="border-b border-border/30 transition-colors last:border-0 hover:bg-muted/30"
                >
                  <td className="py-2 pr-4 font-medium">{c.name}</td>
                  <td className="py-2 pr-4">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="inline-block size-2 rounded-full"
                        style={{
                          backgroundColor: party?.color ?? "#888",
                        }}
                      />
                      <span className="text-muted-foreground">
                        {party?.abbrev}
                      </span>
                    </span>
                  </td>
                  <td className="py-2 pr-4 text-right font-mono tabular-nums">
                    {formatNumber(c.votes)}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                    {formatPercent(c.percentage)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {showAll ? "Pokaži manj" : `Pokaži vse (${candidates.length})`}
        </button>
      )}
    </div>
  )
}
