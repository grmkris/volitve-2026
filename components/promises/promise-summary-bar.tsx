import {
  PROMISE_STATUS_COLORS,
  PROMISE_STATUS_ORDER,
} from "@/lib/data/constants"
import type { PromiseStatus } from "@/lib/data/types"

interface PromiseSummaryBarProps {
  counts: Record<PromiseStatus, number>
}

export function PromiseSummaryBar({ counts }: PromiseSummaryBarProps) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (total === 0) return null

  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
      {PROMISE_STATUS_ORDER.map((status) => {
        const pct = (counts[status] / total) * 100
        if (pct === 0) return null
        return (
          <div
            key={status}
            className="transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: PROMISE_STATUS_COLORS[status],
            }}
          />
        )
      })}
    </div>
  )
}
