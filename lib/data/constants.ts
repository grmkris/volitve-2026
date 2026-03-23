/** DVK data base URL */
export const DVK_BASE_URL = "https://volitve.dvk-rs.si/dz2026/data"

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
  const match = raw.match(/- (.+)$/)
  if (!match) return raw
  return match[1].charAt(0) + match[1].slice(1).toLowerCase()
}

/** Clean okraj name: "VO 1001 - JESENICE" → "Jesenice" */
export function cleanOkrajName(raw: string): string {
  const match = raw.match(/- (.+)$/)
  if (!match) return raw
  // Title case: "JESENICE" → "Jesenice", "LJUBLJANA CENTER" → "Ljubljana Center"
  return match[1]
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

/** Generate a URL-safe slug from party abbreviation */
export function partySlug(knaz: string): string {
  return knaz
    .toLowerCase()
    .replace(/[,.\s]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
}
