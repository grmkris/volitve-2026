import { cache } from "react"
import type {
  RawRezultati,
  RawUdelezba,
  RawKandidatiRezultat,
  RawVolisca,
  NationalResults,
} from "./types"
import { DVK_BASE_URL } from "./constants"
import { buildNationalResults } from "./transforms"

// Static fallback imports (committed JSON files)
import staticRezultati from "./static/rezultati.json"
import staticUdelezba from "./static/udelezba.json"
import staticKandidati from "./static/kandidati_rezultat.json"

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
    })
    if (!res.ok) {
      console.warn(`[fetcher] ${url} returned ${res.status}`)
      return null
    }
    return (await res.json()) as T
  } catch (error) {
    console.warn(`[fetcher] Failed to fetch ${url}, using static fallback`, error)
    return null
  }
}

/** Fetch party results (national → enota → okraj) */
export async function fetchRezultati(): Promise<RawRezultati> {
  const live = await fetchJSON<RawRezultati>(
    `${DVK_BASE_URL}/rezultati.json`
  )
  return live ?? (staticRezultati as RawRezultati)
}

/** Fetch turnout data */
export async function fetchUdelezba(): Promise<RawUdelezba> {
  const live = await fetchJSON<RawUdelezba>(
    `${DVK_BASE_URL}/udelezba.json`
  )
  return live ?? (staticUdelezba as RawUdelezba)
}

/** Fetch candidate results */
export async function fetchKandidati(): Promise<RawKandidatiRezultat> {
  const live = await fetchJSON<RawKandidatiRezultat>(
    `${DVK_BASE_URL}/kandidati_rezultat.json`
  )
  return live ?? (staticKandidati as RawKandidatiRezultat)
}

/** Fetch + transform all data, deduplicated per request via React.cache */
export const getNationalResults = cache(
  async (): Promise<NationalResults> => {
    const [rezultati, udelezba, kandidati] = await Promise.all([
      fetchRezultati(),
      fetchUdelezba(),
      fetchKandidati(),
    ])
    return buildNationalResults({ rezultati, udelezba, kandidati })
  }
)

/** Fetch polling station data for a specific okraj */
export async function fetchVolisca(
  enotaSt: number,
  okrajSt: number
): Promise<RawVolisca | null> {
  const xx = String(enotaSt).padStart(2, "0")
  const yy = String(okrajSt).padStart(2, "0")
  return fetchJSON<RawVolisca>(`${DVK_BASE_URL}/volisca_${xx}_${yy}.json`)
}
