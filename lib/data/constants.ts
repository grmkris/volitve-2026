/** DVK data base URL */
export const DVK_BASE_URL = "https://volitve.dvk-rs.si/dz2026/data"

/** Party list IDs for parliamentary parties (in display order: left → right) */
export const PARLIAMENTARY_THRESHOLD = 0.04 // 4%

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
