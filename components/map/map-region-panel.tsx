"use client"

import Link from "next/link"
import { X, ArrowRight } from "@phosphor-icons/react"
import type { SelectedRegion } from "./election-map"
import type { PartyInfo } from "@/lib/data/types"
import { formatPercent, formatNumber } from "@/lib/data/format"
import { cn } from "@/lib/utils"

interface MapRegionPanelProps {
  region: SelectedRegion | null
  partyMap: Record<number, PartyInfo>
  onClose: () => void
  className?: string
}

export function MapRegionPanel({
  region,
  partyMap,
  onClose,
  className,
}: MapRegionPanelProps) {
  if (!region) return null

  const winner = partyMap[region.winnerId]
  const sortedParties = [...region.parties]
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 7)
  const maxVotes = sortedParties[0]?.votes ?? 1

  const detailHref =
    region.type === "enota"
      ? `/enota/${region.st}`
      : `/okraj/${region.enotaSt}/${region.st}`

  return (
    <div
      className={cn(
        // Mobile: bottom panel
        "fixed inset-x-0 bottom-14 z-40 mx-auto max-w-lg rounded-t-xl bg-card p-4 shadow-lg ring-1 ring-foreground/10 md:bottom-0",
        // Desktop: side panel
        "md:static md:inset-auto md:mx-0 md:max-w-none md:rounded-none md:shadow-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {region.type === "enota" ? "Volilna enota" : "Volilni okraj"}
          </p>
          <h3 className="font-heading text-base font-semibold">{region.name}</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
          aria-label="Zapri"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Winner + turnout */}
      <div className="mt-3 flex items-center gap-4 text-xs">
        {winner && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ backgroundColor: winner.color }}
            />
            <span className="font-medium">{winner.abbrev}</span>
          </span>
        )}
        <span className="text-muted-foreground">
          Udeležba:{" "}
          <span className="font-mono tabular-nums font-medium text-foreground">
            {formatPercent(region.turnoutPct)}
          </span>
        </span>
      </div>

      {/* Compact party bars */}
      <div className="mt-4 space-y-1.5">
        {sortedParties.map((p) => {
          const party = partyMap[p.partyId]
          if (!party) return null
          const widthPct = (p.votes / maxVotes) * 100
          return (
            <div key={p.partyId} className="flex items-center gap-2 text-xs">
              <span className="w-16 shrink-0 text-right text-muted-foreground">
                {party.abbrev}
              </span>
              <div className="relative h-4 flex-1">
                <div
                  className="absolute inset-y-0 left-0 rounded-r-sm"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: party.color,
                    opacity: 0.8,
                  }}
                />
              </div>
              <span className="w-14 shrink-0 text-right font-mono tabular-nums">
                {formatPercent(p.percentage)}
              </span>
            </div>
          )
        })}
      </div>

      {/* Detail link */}
      <Link
        href={detailHref}
        className="mt-4 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        Več podrobnosti
        <ArrowRight className="size-3" />
      </Link>
    </div>
  )
}
