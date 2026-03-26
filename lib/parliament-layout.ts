/**
 * Compute seat positions for a hemicycle (semicircle) parliament visualization.
 * Seats are arranged in concentric arcs from inner to outer.
 */

export interface SeatPosition {
  x: number
  y: number
  row: number
  index: number
}

/**
 * Distribute `totalSeats` across `numRows` concentric arcs.
 * Inner rows have fewer seats, outer rows have more.
 */
function distributeSeats(totalSeats: number, numRows: number): number[] {
  // Use a linear distribution: row i gets a proportional number
  const weights = Array.from({ length: numRows }, (_, i) => i + 1)
  const totalWeight = weights.reduce((a, b) => a + b, 0)

  const rows = weights.map((w) => Math.round((w / totalWeight) * totalSeats))

  // Adjust rounding errors
  let diff = totalSeats - rows.reduce((a, b) => a + b, 0)
  let i = numRows - 1
  while (diff !== 0) {
    rows[i] = (rows[i] ?? 0) + (diff > 0 ? 1 : -1)
    diff += diff > 0 ? -1 : 1
    i = (i - 1 + numRows) % numRows
  }

  return rows
}

interface HemicycleOptions {
  numRows?: number
  innerRadius?: number
  outerRadius?: number
}

/** Generate seat positions for a hemicycle (semicircle) layout. */
export function computeHemicycleLayout(
  totalSeats: number,
  options?: HemicycleOptions
): SeatPosition[] {
  const { numRows = 5, innerRadius = 100, outerRadius = 200 } = options ?? {}
  const seats: SeatPosition[] = []
  const rowDistribution = distributeSeats(totalSeats, numRows)
  const radiusStep =
    numRows > 1 ? (outerRadius - innerRadius) / (numRows - 1) : 0

  for (let row = 0; row < numRows; row++) {
    const numSeatsInRow = rowDistribution[row]
    if (!numSeatsInRow) continue
    const radius = innerRadius + row * radiusStep

    for (let i = 0; i < numSeatsInRow; i++) {
      // Distribute seats evenly along the semicircle (π radians)
      // Add padding at edges so seats don't sit at exact 0° and 180°
      const angle = Math.PI * ((i + 0.5) / numSeatsInRow)

      seats.push({
        x: radius * Math.cos(Math.PI - angle), // flip so left-to-right
        y: -radius * Math.sin(angle), // negative because SVG y is down
        row,
        index: seats.length,
      })
    }
  }

  return seats
}

export interface AssignedSeat extends SeatPosition {
  partyId: number
  partyColor: string
  partyAbbrev: string
}

/**
 * Assign parties to seats. Seats are filled left-to-right per row.
 * Parties are placed in the order provided (typically by political spectrum).
 */
export function assignSeats(
  seats: SeatPosition[],
  parties: { id: number; color: string; abbrev: string; seats: number }[]
): AssignedSeat[] {
  // Sort seats by row, then by x position (left to right)
  const sortedSeats = [...seats].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    return a.x - b.x
  })

  const assigned: AssignedSeat[] = []
  let seatIdx = 0

  for (const party of parties) {
    for (let i = 0; i < party.seats; i++) {
      const pos = sortedSeats[seatIdx]
      if (!pos) break
      assigned.push({
        ...pos,
        partyId: party.id,
        partyColor: party.color,
        partyAbbrev: party.abbrev,
      })
      seatIdx++
    }
  }

  return assigned
}
