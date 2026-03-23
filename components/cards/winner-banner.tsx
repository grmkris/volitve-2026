import type { Party } from "@/lib/data/types"
import { formatPercent, formatNumber } from "@/lib/data/format"

interface WinnerBannerProps {
  winner: Party
  totalSeats: number
}

export function WinnerBanner({ winner, totalSeats }: WinnerBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-xl p-6 md:p-8">
      {/* Accent bar */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ backgroundColor: winner.color }}
      />

      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Volitve v Državni zbor 2026
      </p>

      <h1 className="mt-2 font-heading text-2xl font-bold md:text-4xl">
        {winner.name}
      </h1>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <div>
          <span className="font-heading text-3xl font-bold md:text-5xl">
            {winner.seats}
          </span>
          <span className="ml-1.5 text-sm text-muted-foreground">
            / {totalSeats} sedežev
          </span>
        </div>

        <div className="flex items-baseline gap-4 text-sm text-muted-foreground">
          <span>
            <span className="font-mono font-medium text-foreground tabular-nums">
              {formatPercent(winner.percentage)}
            </span>{" "}
            glasov
          </span>
          <span>
            <span className="font-mono font-medium text-foreground tabular-nums">
              {formatNumber(winner.votes)}
            </span>{" "}
            glasovnic
          </span>
        </div>
      </div>
    </div>
  )
}
