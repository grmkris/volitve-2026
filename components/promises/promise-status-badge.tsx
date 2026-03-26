import {
  PROMISE_STATUS_LABELS,
  PROMISE_STATUS_COLORS,
} from "@/lib/data/constants"
import type { PromiseStatus } from "@/lib/data/types"
import { cn } from "@/lib/utils"

interface PromiseStatusBadgeProps {
  status: PromiseStatus
  size?: "sm" | "default"
}

export function PromiseStatusBadge({
  status,
  size = "default",
}: PromiseStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
      style={{
        color: PROMISE_STATUS_COLORS[status],
        backgroundColor: `color-mix(in oklch, ${PROMISE_STATUS_COLORS[status]} 15%, transparent)`,
      }}
    >
      {PROMISE_STATUS_LABELS[status]}
    </span>
  )
}
