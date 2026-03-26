import type { PromiseStatus } from "./types"

/** Total seats in Državni zbor (88 proportional + 2 minority) */
export const TOTAL_SEATS = 90

/** Number of electoral units */
export const NUM_ENOTE = 8

/** Maximum okraji per enota */
export const MAX_OKRAJI_PER_ENOTA = 11

/** Minimum vote share to enter parliament */
export const PARLIAMENTARY_THRESHOLD = 0.04 // 4%

/** Political spectrum order for seat assignment in hemicycle (left → right) */
export const SPECTRUM_ORDER: Record<number, number> = {
  107760: 1, // LEVICA IN VESNA
  107753: 2, // SD
  107754: 3, // SVOBODA
  107755: 4, // DEMOKRATI
  107752: 5, // RESNI.CA
  107749: 6, // NSi, SLS, FOKUS
  107757: 7, // SDS
}

/** Clean enota name: "VE 1000 - KRANJ" → "Kranj" */
export function cleanEnotaName(raw: string): string {
  const captured = raw.match(/- (.+)$/)?.[1]
  if (!captured) return raw
  return captured.charAt(0) + captured.slice(1).toLowerCase()
}

/** Clean okraj name: "VO 1001 - JESENICE" → "Jesenice" */
export function cleanOkrajName(raw: string): string {
  const captured = raw.match(/- (.+)$/)?.[1]
  if (!captured) return raw
  // Title case: "JESENICE" → "Jesenice", "LJUBLJANA CENTER" → "Ljubljana Center"
  return captured
    .split(" ")
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(" ")
}

/** Map of enota rpeid → short Slovenian name */
export const ENOTA_NAMES: Record<string, string> = {
  "1000": "Kranj",
  "2000": "Postojna",
  "3000": "Ljubljana Center",
  "4000": "Ljubljana Bežigrad",
  "5000": "Celje",
  "6000": "Novo mesto",
  "7000": "Maribor",
  "8000": "Ptuj",
}

// =============================================================================
// 2022 ↔ 2026 Party Mapping (for swing analysis)
// =============================================================================

/** Map 2022 party st → 2026 party st (direct successors) */
export const PARTY_MAP_2022: Record<number, number> = {
  4: 107754, // SVOBODA → SVOBODA
  15: 107757, // SDS → SDS
  17: 107753, // SD → SD
  3: 107752, // Resni.ca → RESNI.CA
  16: 107751, // SNS → SNS
  13: 107756, // Pirati → PIRATI
}

/** Merged parties: sum these 2022 st values as 2022 baseline for the 2026 party */
export const PARTY_MERGERS_2022: Record<number, number[]> = {
  107760: [6, 19], // LEVICA IN VESNA = LEVICA + VESNA
  107749: [12], // NSi, SLS, FOKUS ≈ NSi (conservative baseline)
}

/** Ideological blocs for aggregate swing analysis */
export const BLOCS = {
  left: {
    label: "Levi blok",
    color: "#e53935",
    parties2022: [6, 19],
    parties2026: [107760, 107753],
  },
  centerLeft: {
    label: "Center-levi",
    color: "#1e88e5",
    parties2022: [4, 17, 8, 18],
    parties2026: [107754, 107755, 107761],
  },
  right: {
    label: "Desni blok",
    color: "#fdd835",
    parties2022: [15, 12, 14],
    parties2026: [107757, 107749],
  },
  populist: {
    label: "Populistični",
    color: "#7e57c2",
    parties2022: [3, 16],
    parties2026: [107752, 107751],
  },
} as const

// =============================================================================
// Promise tracker constants
// =============================================================================

export const PROMISE_STATUS_ORDER: PromiseStatus[] = [
  "fulfilled",
  "in_progress",
  "not_started",
  "broken",
]

export const PROMISE_STATUS_LABELS: Record<PromiseStatus, string> = {
  not_started: "Ni začeto",
  in_progress: "V izvajanju",
  fulfilled: "Izpolnjeno",
  broken: "Prelomljeno",
}

export const PROMISE_STATUS_COLORS: Record<PromiseStatus, string> = {
  not_started: "var(--color-muted-foreground)",
  in_progress: "oklch(0.75 0.15 230)",
  fulfilled: "oklch(0.72 0.17 150)",
  broken: "oklch(0.65 0.2 25)",
}

/** Generate a URL-safe slug from party abbreviation */
export function partySlug(knaz: string): string {
  return knaz
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (č→c, š→s, ž→z)
    .toLowerCase()
    .replace(/[,.\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
