import { cache } from "react"

import {
  RawKandidatiRezultatSchema,
  RawRezultatiSchema,
  RawUdelezbaSchema,
} from "./dvk.schema"
import { PromiseDataSchema } from "./promises.schema"
import staticKandidati from "./static/kandidati_rezultat.json"
import staticPromises from "./static/promises.json"
import staticRezultati from "./static/rezultati.json"
import staticUdelezba from "./static/udelezba.json"
import { buildNationalResults } from "./transforms"
import type { NationalResults, PromiseData, RawVolisca } from "./types"

/** Parse static party results (national → enota → okraj) */
export function fetchRezultati() {
  return RawRezultatiSchema.parse(staticRezultati)
}

/** Parse static turnout data */
export function fetchUdelezba() {
  return RawUdelezbaSchema.parse(staticUdelezba)
}

/** Parse static candidate results */
export function fetchKandidati() {
  return RawKandidatiRezultatSchema.parse(staticKandidati)
}

/** Build + cache all national results, deduplicated per request via React.cache */
export const getNationalResults = cache(async (): Promise<NationalResults> => {
  const rezultati = fetchRezultati()
  const udelezba = fetchUdelezba()
  const kandidati = fetchKandidati()
  return buildNationalResults({ rezultati, udelezba, kandidati })
})

/** Load promise tracker data (static JSON, validated via Zod) */
export function getPromiseData(): PromiseData {
  return PromiseDataSchema.parse(staticPromises) as PromiseData
}

/** Polling station data — no static fallback available, DVK API offline */
export async function fetchVolisca(
  _enotaSt: number,
  _okrajSt: number
): Promise<RawVolisca | null> {
  return null
}
