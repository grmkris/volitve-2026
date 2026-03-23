"use client"

import { useState } from "react"
import Link from "next/link"
import { formatNumber, formatPercent } from "@/lib/data/format"

interface OkrajData {
  rpeid: string
  st: number
  name: string
  enotaName: string
  enotaSt: number
  turnout: { registered: number; voted: number; percentage: number }
}

interface OkrajiTurnoutTableProps {
  okraji: OkrajData[]
  initialCount?: number
}

export function OkrajiTurnoutTable({
  okraji,
  initialCount = 20,
}: OkrajiTurnoutTableProps) {
  const [showAll, setShowAll] = useState(false)
  const visible = showAll ? okraji : okraji.slice(0, initialCount)
  const hasMore = okraji.length > initialCount

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/50 text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">#</th>
              <th className="pb-2 pr-4 font-medium">Okraj</th>
              <th className="pb-2 pr-4 font-medium">Enota</th>
              <th className="pb-2 pr-4 text-right font-medium">Glasovalo</th>
              <th className="pb-2 pr-4 text-right font-medium">Vpisanih</th>
              <th className="pb-2 text-right font-medium">Udeležba</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((okraj, i) => (
              <tr
                key={okraj.rpeid}
                className="border-b border-border/30 transition-colors last:border-0 hover:bg-muted/30"
              >
                <td className="py-1.5 pr-4 text-muted-foreground">{i + 1}</td>
                <td className="py-1.5 pr-4">
                  <Link
                    href={`/okraj/${okraj.enotaSt}/${okraj.st}`}
                    className="font-medium hover:underline"
                  >
                    {okraj.name}
                  </Link>
                </td>
                <td className="py-1.5 pr-4 text-muted-foreground">
                  {okraj.enotaName}
                </td>
                <td className="py-1.5 pr-4 text-right font-mono tabular-nums">
                  {formatNumber(okraj.turnout.voted)}
                </td>
                <td className="py-1.5 pr-4 text-right font-mono tabular-nums text-muted-foreground">
                  {formatNumber(okraj.turnout.registered)}
                </td>
                <td className="py-1.5 text-right font-mono tabular-nums font-medium">
                  {formatPercent(okraj.turnout.percentage)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {showAll
            ? "Pokaži manj"
            : `Pokaži vse okraje (${okraji.length})`}
        </button>
      )}
    </div>
  )
}
