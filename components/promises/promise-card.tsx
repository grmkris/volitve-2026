import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr"

import { PROMISE_STATUS_LABELS } from "@/lib/data/constants"
import { formatDateShort } from "@/lib/data/format"
import type { TrackedPromise, PromiseStatusChange } from "@/lib/data/types"

import { PromiseStatusBadge } from "./promise-status-badge"

interface PromiseCardProps {
  promise: TrackedPromise
  partyColor: string
  partyAbbrev: string
  categoryName: string
  showParty?: boolean
}

function HistoryItem({ change }: { change: PromiseStatusChange }) {
  return (
    <div className="flex gap-3 text-xs">
      <div className="flex flex-col items-center">
        <div className="mt-1 size-2 rounded-full bg-muted-foreground/50" />
        <div className="w-px flex-1 bg-border/50" />
      </div>
      <div className="pb-3">
        <p className="text-muted-foreground">
          {formatDateShort(change.date)} —{" "}
          {PROMISE_STATUS_LABELS[change.status]}
        </p>
        {change.note && <p className="mt-0.5">{change.note}</p>}
        {change.evidence && (
          <div className="mt-0.5 flex flex-col gap-0.5">
            {change.evidence.map((ev, i) => (
              <a
                key={i}
                href={ev.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
              >
                <ArrowSquareOut className="size-3 flex-shrink-0" />
                {ev.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function PromiseCard({
  promise,
  partyColor,
  partyAbbrev,
  categoryName,
  showParty = true,
}: PromiseCardProps) {
  return (
    <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
      <div className="flex items-start gap-3">
        {/* Party color accent */}
        <div
          className="mt-0.5 h-10 w-1 flex-shrink-0 rounded-full"
          style={{ backgroundColor: partyColor }}
        />
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex flex-wrap items-center gap-2">
            <PromiseStatusBadge status={promise.currentStatus} />
            {showParty && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  color: partyColor,
                  backgroundColor: `color-mix(in oklch, ${partyColor} 12%, transparent)`,
                }}
              >
                {partyAbbrev}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {categoryName}
            </span>
          </div>

          {/* Title */}
          <h3 className="mt-1.5 text-sm font-medium leading-snug">
            {promise.title}
          </h3>

          {/* Description */}
          {promise.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {promise.description}
            </p>
          )}

          {/* Program reference */}
          {promise.programRef && (
            <p className="mt-1.5 text-[10px] italic text-muted-foreground/70">
              {promise.programRef}
            </p>
          )}

          {/* History timeline */}
          {promise.history.length > 1 && (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Zgodovina ({promise.history.length})
              </summary>
              <div className="mt-2">
                {promise.history.map((change, i) => (
                  <HistoryItem key={i} change={change} />
                ))}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
