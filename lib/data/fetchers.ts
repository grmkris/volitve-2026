import type {
  RawRezultati,
  RawUdelezba,
  RawKandidatiRezultat,
  RawVolisca,
} from "./types"
import { DVK_BASE_URL } from "./constants"

// Static fallback imports (committed JSON files)
import staticRezultati from "./static/rezultati.json"
import staticUdelezba from "./static/udelezba.json"
import staticKandidati from "./static/kandidati_rezultat.json"

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
    })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Fetch party results (national → enota → okraj) */
export async function fetchRezultati(): Promise<RawRezultati> {
  const live = await fetchJSON<RawRezultati>(
    `${DVK_BASE_URL}/rezultati.json`
  )
  return live ?? (staticRezultati as unknown as RawRezultati)
}

/** Fetch turnout data */
export async function fetchUdelezba(): Promise<RawUdelezba> {
  const live = await fetchJSON<RawUdelezba>(
    `${DVK_BASE_URL}/udelezba.json`
  )
  return live ?? (staticUdelezba as unknown as RawUdelezba)
}

/** Fetch candidate results */
export async function fetchKandidati(): Promise<RawKandidatiRezultat> {
  const live = await fetchJSON<RawKandidatiRezultat>(
    `${DVK_BASE_URL}/kandidati_rezultat.json`
  )
  return live ?? (staticKandidati as unknown as RawKandidatiRezultat)
}

/** Fetch polling station data for a specific okraj */
export async function fetchVolisca(
  enotaSt: number,
  okrajSt: number
): Promise<RawVolisca | null> {
  const xx = String(enotaSt).padStart(2, "0")
  const yy = String(okrajSt).padStart(2, "0")
  return fetchJSON<RawVolisca>(`${DVK_BASE_URL}/volisca_${xx}_${yy}.json`)
}
