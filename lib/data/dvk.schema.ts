import { z } from "zod"

// =============================================================================
// DVK API response schemas (single source of truth for Raw types)
// =============================================================================

/** Party result at any geographic level */
export const RawPartyResultSchema = z.object({
  naz: z.string(), // full name
  knaz: z.string(), // abbreviation
  hcol: z.string(), // hex color without #
  st: z.number(), // party list ID
  gl: z.number(), // votes received
  prc: z.number(), // proportion 0-1
  man: z.number(), // mandates/seats won
})

/** Result entry at enota/okraj level (no name/color, just ID + votes) */
export const RawRegionPartyResultSchema = z.object({
  st: z.number(),
  gl: z.number(),
  prc: z.number(),
  man: z.number().optional(),
})

export const RawOkrajSchema = z.object({
  st: z.number(),
  rpeid: z.string(),
  naz: z.string(),
  rez: z.array(RawRegionPartyResultSchema),
  glas: z.number(),
  velj: z.number(),
  nev: z.number(),
})

export const RawEnotaSchema = z.object({
  st: z.number(),
  rpeid: z.string(),
  naz: z.string(),
  okraji: z.array(RawOkrajSchema),
  rez: z.array(RawRegionPartyResultSchema),
  glas: z.number(),
  velj: z.number(),
  nev: z.number(),
})

export const RawRezultatiSchema = z.object({
  datum: z.string(),
  slovenija: z.array(RawPartyResultSchema),
  enote: z.array(RawEnotaSchema),
  posebna_volisca: z.unknown(),
  glas: z.number(),
  velj: z.number(),
  nev: z.number(),
})

// ── Turnout ──────────────────────────────────────────────────────────

export const RawUdelezbaSlovenijaSchema = z.object({
  upr_red: z.number(),
  upr_pos: z.number(),
  gl_ime: z.number(),
  gl_pot: z.number(),
  gl_pos: z.number(),
  gl_inv: z.number(),
  gl_vol_omnia: z.number(),
  gl_vol_inv: z.number().nullable(),
  upr: z.number(),
  gl: z.number(),
  prc: z.number(),
})

export const RawUdelezbaRegionSchema = z.object({
  st: z.number(),
  rpeid: z.string(),
  naz: z.string(),
  upr: z.number(),
  gl: z.number(),
  prc: z.number(),
})

export const RawUdelezbaEnotaSchema = RawUdelezbaRegionSchema.extend({
  okraji: z.array(RawUdelezbaRegionSchema),
})

export const RawUdelezbaSchema = z.object({
  datum: z.string(),
  cas_udelezba: z.string(),
  slovenija: RawUdelezbaSlovenijaSchema,
  enote: z.array(RawUdelezbaEnotaSchema),
  posebna_volisca: z.array(
    z.object({
      tip: z.number(),
      naz: z.string(),
      upr: z.number().nullable(),
      gl: z.number(),
      prc: z.number().nullable(),
    })
  ),
})

// ── Candidates ───────────────────────────────────────────────────────

export const RawKandidatSchema = z.object({
  st: z.number(),
  id: z.number(),
  naziv: z.string(),
  gl: z.number(),
  prc: z.number(),
  man: z.boolean(),
  enota: z.number(),
  enrpeid: z.string(),
  okraji: z.array(z.number()),
  okrpeids: z.array(z.string()),
  tip_izv: z.union([z.literal(0), z.literal(1)]),
})

export const RawKandidatiRezultatSchema = z.object({
  datum: z.string(),
  kandidati: z.array(RawKandidatSchema),
})

// ── Polling stations ─────────────────────────────────────────────────

export const RawVolisceResultSchema = z.object({
  st: z.number(),
  gl: z.number(),
  prc: z.number(),
})

export const RawVolisceSchema = z.object({
  st: z.number(),
  rpeid: z.string(),
  naz: z.string(),
  rez: z.object({
    rez: z.array(RawVolisceResultSchema),
    glas: z.number(),
    velj: z.number(),
    nev: z.number(),
  }),
  udel: z.object({
    upr: z.number(),
    gl: z.number(),
    prc: z.number(),
  }),
  prestetih_glasov: z.number(),
})

export const RawListaSchema = z.object({
  naz: z.string(),
  knaz: z.string(),
  hcol: z.string(),
  st: z.number(),
  ime: z.string(),
  pri: z.string(),
})

export const RawVoliscaSchema = z.object({
  en_rpeid: z.string(),
  en_st: z.number(),
  en_naz: z.string(),
  rpeid: z.string(),
  st: z.number(),
  naz: z.string(),
  vol: z.array(RawVolisceSchema),
  liste: z.array(RawListaSchema),
  nastavitve: z.object({
    timestamp: z.string(),
    datum: z.string(),
    cas_udelezba: z.string(),
    has_udelezba: z.boolean(),
    has_rezultat: z.boolean(),
    is_final: z.boolean(),
  }),
})

// ── Inferred types ───────────────────────────────────────────────────

export type RawPartyResult = z.infer<typeof RawPartyResultSchema>
export type RawRegionPartyResult = z.infer<typeof RawRegionPartyResultSchema>
export type RawOkraj = z.infer<typeof RawOkrajSchema>
export type RawEnota = z.infer<typeof RawEnotaSchema>
export type RawRezultati = z.infer<typeof RawRezultatiSchema>
export type RawUdelezbaSlovenija = z.infer<typeof RawUdelezbaSlovenijaSchema>
export type RawUdelezbaRegion = z.infer<typeof RawUdelezbaRegionSchema>
export type RawUdelezbaEnota = z.infer<typeof RawUdelezbaEnotaSchema>
export type RawUdelezba = z.infer<typeof RawUdelezbaSchema>
export type RawKandidat = z.infer<typeof RawKandidatSchema>
export type RawKandidatiRezultat = z.infer<typeof RawKandidatiRezultatSchema>
export type RawVolisceResult = z.infer<typeof RawVolisceResultSchema>
export type RawVolisce = z.infer<typeof RawVolisceSchema>
export type RawLista = z.infer<typeof RawListaSchema>
export type RawVolisca = z.infer<typeof RawVoliscaSchema>
