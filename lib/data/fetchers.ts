import { cache } from "react"
import type { z } from "zod"

import { DVK_BASE_URL } from "./constants"
import {
  RawRezultatiSchema,
  RawUdelezbaSchema,
  RawKandidatiRezultatSchema,
  RawVoliscaSchema,
} from "./dvk.schema"
import { PromiseDataSchema } from "./promises.schema"
import staticKandidati from "./static/kandidati_rezultat.json"
import staticPromises from "./static/promises.json"
// Static fallback imports (committed JSON files)
import staticRezultati from "./static/rezultati.json"
import staticUdelezba from "./static/udelezba.json"
import { buildNationalResults } from "./transforms"
import type { NationalResults, PromiseData, RawVolisca } from "./types"

async function fetchJSON<T>(
  url: string,
  schema: z.ZodType<T>
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
    })
    if (!res.ok) {
      console.warn(`[fetcher] ${url} returned ${res.status}`)
      return null
    }
    const data: unknown = await res.json()
    const parsed = schema.safeParse(data)
    if (!parsed.success) {
      console.warn(`[fetcher] ${url} validation failed:`, parsed.error.issues)
      return null
    }
    return parsed.data
  } catch (error) {
    console.warn(
      `[fetcher] Failed to fetch ${url}, using static fallback`,
      error
    )
    return null
  }
}

/** Fetch party results (national → enota → okraj) */
export async function fetchRezultati() {
  const live = await fetchJSON(
    `${DVK_BASE_URL}/rezultati.json`,
    RawRezultatiSchema
  )
  return live ?? RawRezultatiSchema.parse(staticRezultati)
}

/** Fetch turnout data */
export async function fetchUdelezba() {
  const live = await fetchJSON(
    `${DVK_BASE_URL}/udelezba.json`,
    RawUdelezbaSchema
  )
  return live ?? RawUdelezbaSchema.parse(staticUdelezba)
}

/** Fetch candidate results */
export async function fetchKandidati() {
  const live = await fetchJSON(
    `${DVK_BASE_URL}/kandidati_rezultat.json`,
    RawKandidatiRezultatSchema
  )
  return live ?? RawKandidatiRezultatSchema.parse(staticKandidati)
}

/** Fetch + transform all data, deduplicated per request via React.cache */
export const getNationalResults = cache(async (): Promise<NationalResults> => {
  const [rezultati, udelezba, kandidati] = await Promise.all([
    fetchRezultati(),
    fetchUdelezba(),
    fetchKandidati(),
  ])
  return buildNationalResults({ rezultati, udelezba, kandidati })
})

/** Load promise tracker data (static JSON, validated via Zod) */
export function getPromiseData(): PromiseData {
  return PromiseDataSchema.parse(staticPromises) as PromiseData
}

/** Fetch polling station data for a specific okraj */
export async function fetchVolisca(
  enotaSt: number,
  okrajSt: number
): Promise<RawVolisca | null> {
  const xx = String(enotaSt).padStart(2, "0")
  const yy = String(okrajSt).padStart(2, "0")
  return fetchJSON(`${DVK_BASE_URL}/volisca_${xx}_${yy}.json`, RawVoliscaSchema)
}
