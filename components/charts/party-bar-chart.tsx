import type { Party } from "@/lib/data/types"
import { formatPercent } from "@/lib/data/format"
import { cn } from "@/lib/utils"

interface PartyBarChartProps {
  parties: Party[]
  /** Only show parties with seats in parliament */
  parliamentaryOnly?: boolean
  className?: string
}

export function PartyBarChart({
  parties,
  parliamentaryOnly = false,
  className,
}: PartyBarChartProps) {
  const filtered = parliamentaryOnly
    ? parties.filter((p) => p.seats > 0)
    : parties

  const sorted = [...filtered].sort((a, b) => b.votes - a.votes)
  const maxPrc = sorted[0]?.percentage ?? 1

  return (
    <div className={cn("space-y-2", className)}>
      {sorted.map((party) => (
        <PartyBar key={party.id} party={party} maxPrc={maxPrc} />
      ))}
    </div>
  )
}

function PartyBar({ party, maxPrc }: { party: Party; maxPrc: number }) {
  const widthPct = (party.percentage / maxPrc) * 100
  const isParliamentary = party.seats > 0

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
            <span className="font-heading text-xs font-bold text-white drop-shadow-sm">
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
