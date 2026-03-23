"use client"

import { useState } from "react"
import type { Party } from "@/lib/data/types"
import { formatPercent } from "@/lib/data/format"
import { cn } from "@/lib/utils"

/** Returns dark or light text class based on background color luminance */
function getContrastText(hex: string): string {
  const c = hex.replace("#", "")
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? "text-gray-900" : "text-white"
}

interface PartyBarChartProps {
  parties: Party[]
  /** Only show parties with seats in parliament */
  parliamentaryOnly?: boolean
  /** Allow collapsing non-parliamentary parties */
  collapsible?: boolean
  className?: string
}

export function PartyBarChart({
  parties,
  parliamentaryOnly = false,
  collapsible = false,
  className,
}: PartyBarChartProps) {
  const [expanded, setExpanded] = useState(false)

  const sorted = [...parties].sort((a, b) => b.votes - a.votes)
  const parliamentary = sorted.filter((p) => p.seats > 0)
  const nonParliamentary = sorted.filter((p) => p.seats === 0)

  const visible = parliamentaryOnly
    ? parliamentary
    : collapsible && !expanded
      ? parliamentary
      : sorted

  const maxPrc = sorted[0]?.percentage ?? 1

  return (
    <div className={cn("space-y-2", className)}>
      {visible.map((party) => (
        <PartyBar key={party.id} party={party} maxPrc={maxPrc} />
      ))}
      {collapsible && !parliamentaryOnly && nonParliamentary.length > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded
            ? "Skrij stranke pod pragom"
            : `Pokaži vse stranke (+${nonParliamentary.length} pod pragom)`}
        </button>
      )}
    </div>
  )
}

function PartyBar({ party, maxPrc }: { party: Party; maxPrc: number }) {
  const widthPct = (party.percentage / maxPrc) * 100
  const isParliamentary = party.seats > 0
  const textClass = getContrastText(party.color)

  return (
    <div
      className={cn(
        "group flex items-center gap-3",
        !isParliamentary && "opacity-50"
      )}
    >
      {/* Party name */}
      <div className="w-24 shrink-0 text-right text-xs md:w-32">
        <span
          className={cn(
            "font-medium",
            isParliamentary ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {party.abbrev}
        </span>
      </div>

      {/* Bar */}
      <div className="relative flex h-7 min-w-0 flex-1 items-center md:h-8">
        <div
          className="absolute inset-y-0 left-0 rounded-r-sm transition-all duration-500"
          style={{
            width: `${widthPct}%`,
            backgroundColor: party.color,
            opacity: isParliamentary ? 1 : 0.5,
          }}
        />
        <div className="relative flex w-full items-center justify-between px-2">
          {/* Seats badge inside bar */}
          {party.seats > 0 && (
            <span
              className={cn(
                "font-heading text-xs font-bold drop-shadow-sm",
                textClass
              )}
            >
              {party.seats}
            </span>
          )}
          <span />
        </div>
      </div>

      {/* Percentage */}
      <div className="w-16 shrink-0 text-right font-mono text-xs tabular-nums md:w-20">
        {formatPercent(party.percentage)}
      </div>
    </div>
  )
}
