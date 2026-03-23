import Link from "next/link"
import type { Party } from "@/lib/data/types"
import { formatNumber, formatPercent } from "@/lib/data/format"
import { partySlug } from "@/lib/data/constants"

interface PartyCardProps {
  party: Party
}

export function PartyCard({ party }: PartyCardProps) {
  const isParliamentary = party.seats > 0

  return (
    <Link
      href={`/stranka/${partySlug(party.abbrev)}`}
      className="group relative overflow-hidden rounded-lg bg-card p-4 ring-1 ring-foreground/10 transition-shadow hover:shadow-md"
    >
      {/* Color accent */}
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: party.color }}
      />

      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate font-heading text-sm font-semibold">
            {party.abbrev}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {party.name}
          </p>
        </div>
        {isParliamentary && (
          <span className="shrink-0 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
            V DZ
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-4">
        <div>
          <span className="font-heading text-lg font-bold">
            {formatPercent(party.percentage)}
          </span>
        </div>
        {isParliamentary && (
          <div className="text-xs text-muted-foreground">
            <span className="font-mono font-medium text-foreground tabular-nums">
              {party.seats}
            </span>{" "}
            sedežev
          </div>
        )}
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        {formatNumber(party.votes)} glasov
      </p>
    </Link>
  )
}
