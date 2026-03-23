"use client"

import { useMemo, useState } from "react"
import {
  computeHemicycleLayout,
  assignSeats,
  type AssignedSeat,
} from "@/lib/parliament-layout"
import type { Party } from "@/lib/data/types"

interface ParliamentChartProps {
  parties: Party[]
  /** Total seats in parliament */
  totalSeats?: number
  className?: string
}

/** Political spectrum order for seat assignment (left → right) */
const SPECTRUM_ORDER: Record<number, number> = {
  107760: 1, // LEVICA IN VESNA
  107753: 2, // SD
  107754: 3, // SVOBODA
  107755: 4, // DEMOKRATI
  107752: 5, // RESNI.CA
  107749: 6, // NSi, SLS, FOKUS
  107757: 7, // SDS
}

export function ParliamentChart({
  parties,
  totalSeats = 90,
  className,
}: ParliamentChartProps) {
  const [hoveredParty, setHoveredParty] = useState<number | null>(null)

  const seats = useMemo(() => {
    const layout = computeHemicycleLayout(totalSeats, 5, 100, 200)

    // Sort parties by political spectrum for seat assignment
    const parliamentary = parties
      .filter((p) => p.seats > 0)
      .sort(
        (a, b) => (SPECTRUM_ORDER[a.id] ?? 99) - (SPECTRUM_ORDER[b.id] ?? 99)
      )

    return assignSeats(
      layout,
      parliamentary.map((p) => ({
        id: p.id,
        color: p.color,
        abbrev: p.abbrev,
        seats: p.seats,
      }))
    )
  }, [parties, totalSeats])

  // SVG viewBox: center the hemicycle
  // x ranges from about -200 to 200, y from about -200 to 0
  const viewBox = "-220 -215 440 230"

  return (
    <div className={className}>
      <svg
        viewBox={viewBox}
        className="w-full"
        role="img"
        aria-label={`Državni zbor: ${totalSeats} sedežev`}
      >
        {seats.map((seat) => (
          <SeatDot
            key={seat.index}
            seat={seat}
            isHovered={hoveredParty === seat.partyId}
            isDimmed={hoveredParty !== null && hoveredParty !== seat.partyId}
            onHover={setHoveredParty}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
        {parties
          .filter((p) => p.seats > 0)
          .sort((a, b) => b.seats - a.seats)
          .map((party) => (
            <button
              key={party.id}
              type="button"
              className="flex items-center gap-1.5 text-xs transition-opacity"
              style={{
                opacity:
                  hoveredParty !== null && hoveredParty !== party.id ? 0.4 : 1,
              }}
              onMouseEnter={() => setHoveredParty(party.id)}
              onMouseLeave={() => setHoveredParty(null)}
              onTouchStart={() =>
                setHoveredParty((prev) =>
                  prev === party.id ? null : party.id
                )
              }
            >
              <span
                className="inline-block size-2.5 rounded-full"
                style={{ backgroundColor: party.color }}
              />
              <span className="text-muted-foreground">
                {party.abbrev}{" "}
                <span className="font-mono tabular-nums font-medium text-foreground">
                  {party.seats}
                </span>
              </span>
            </button>
          ))}
      </div>
    </div>
  )
}

function SeatDot({
  seat,
  isHovered,
  isDimmed,
  onHover,
}: {
  seat: AssignedSeat
  isHovered: boolean
  isDimmed: boolean
  onHover: (id: number | null) => void
}) {
  const r = isHovered ? 9 : 7.5

  return (
    <circle
      cx={seat.x}
      cy={seat.y}
      r={r}
      fill={seat.partyColor}
      opacity={isDimmed ? 0.2 : 1}
      className="transition-all duration-150"
      onMouseEnter={() => onHover(seat.partyId)}
      onMouseLeave={() => onHover(null)}
    >
      <title>
        {seat.partyAbbrev}
      </title>
    </circle>
  )
}
