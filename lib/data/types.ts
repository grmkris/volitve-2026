// =============================================================================
// Raw DVK API types (1:1 mirror of JSON responses)
// =============================================================================

/** Party result at any geographic level */
export interface RawPartyResult {
  naz: string // full name: "GIBANJE SVOBODA"
  knaz: string // abbreviation: "SVOBODA"
  hcol: string // hex color without #: "0063a6"
  st: number // party list ID: 107754
  gl: number // votes received
  prc: number // proportion: 0.2862 = 28.62%
  man: number // mandates/seats won
}

/** Result entry at enota/okraj level (no name/color, just ID + votes) */
export interface RawRegionPartyResult {
  st: number // party list ID (matches RawPartyResult.st)
  gl: number // votes
  prc: number // proportion
  man?: number // seats (only at enota level)
}

export interface RawOkraj {
  st: number // ordinal within enota (1-11)
  rpeid: string // "1001"
  naz: string // "VO 1001 - JESENICE"
  rez: RawRegionPartyResult[]
  glas: number // total ballots cast
  velj: number // valid ballots
  nev: number // invalid ballots
}

export interface RawEnota {
  st: number // 1-8
  rpeid: string // "1000"
  naz: string // "VE 1000 - KRANJ"
  okraji: RawOkraj[]
  rez: RawRegionPartyResult[]
  glas: number
  velj: number
  nev: number
}

export interface RawRezultati {
  datum: string // ISO 8601: "2026-03-23T12:20:00Z"
  slovenija: RawPartyResult[]
  enote: RawEnota[]
  posebna_volisca: unknown
  glas: number // total ballots nationally
  velj: number // valid nationally
  nev: number // invalid nationally
}

// Udelezba (turnout)
export interface RawUdelezbaSlovenija {
  upr_red: number // registered voters (regular)
  upr_pos: number // registered voters (special)
  gl_ime: number // voters by name
  gl_pot: number // voters with DVK certificate
  gl_pos: number // voters (special)
  gl_inv: number // voters (invalid register entries)
  gl_vol_omnia: number // OMNIA polling station voters
  gl_vol_inv: number | null
  upr: number // total registered
  gl: number // total voted
  prc: number // turnout proportion
}

export interface RawUdelezbaRegion {
  st: number
  rpeid: string
  naz: string
  upr: number // registered
  gl: number // voted
  prc: number // turnout proportion
}

export interface RawUdelezbaEnota extends RawUdelezbaRegion {
  okraji: RawUdelezbaRegion[]
}

export interface RawUdelezba {
  datum: string
  cas_udelezba: string // "19:00"
  slovenija: RawUdelezbaSlovenija
  enote: RawUdelezbaEnota[]
  posebna_volisca: {
    tip: number
    naz: string
    upr: number | null
    gl: number
    prc: number | null
  }[]
}

// Kandidati (candidates)
export interface RawKandidat {
  st: number // party list ID (matches RawPartyResult.st)
  id: number // candidate ID
  naziv: string // full name
  gl: number // votes
  prc: number // proportion in their okraj
  man: boolean // elected?
  enota: number // electoral unit (1-8)
  enrpeid: string // unit rpeid: "7000"
  okraji: number[] // district ordinals within enota
  okrpeids: string[] // district rpeids: ["7009"]
  tip_izv: 0 | 1 // 0=regular, 1=mandate holder
}

export interface RawKandidatiRezultat {
  datum: string
  kandidati: RawKandidat[]
}

// Volisca (polling station detail per okraj)
export interface RawVolisceResult {
  st: number // party list ID
  gl: number // votes
  prc: number // proportion
}

export interface RawVolisce {
  st: number // polling station number
  rpeid: string
  naz: string // name/address
  rez: {
    rez: RawVolisceResult[]
    glas: number
    velj: number
    nev: number
  }
  udel: {
    upr: number // registered
    gl: number // voted
    prc: number // turnout
  }
  prestetih_glasov: number // 0.0-1.0 counting progress
}

export interface RawLista {
  naz: string // party name
  knaz: string // abbreviation
  hcol: string // hex color
  st: number // party list ID
  ime: string // candidate first name
  pri: string // candidate last name
}

export interface RawVolisca {
  en_rpeid: string
  en_st: number
  en_naz: string
  rpeid: string
  st: number
  naz: string
  vol: RawVolisce[]
  liste: RawLista[]
  nastavitve: {
    timestamp: string
    datum: string
    cas_udelezba: string
    has_udelezba: boolean
    has_rezultat: boolean
    is_final: boolean
  }
}

// =============================================================================
// Domain types (transformed, ready for rendering)
// =============================================================================

import type {
  PartyId,
  EnotaSt,
  OkrajSt,
  Rpeid,
  CandidateId,
} from "./ids"

export interface Party {
  id: PartyId
  name: string
  abbrev: string
  color: string // "#0063a6"
  votes: number
  percentage: number // 0-1
  seats: number
}

export interface Turnout {
  registered: number
  voted: number
  percentage: number // 0-1
}

export interface RegionPartyResult {
  partyId: PartyId
  votes: number
  percentage: number // 0-1
  seats: number
}

export interface OkrajResult {
  st: OkrajSt
  rpeid: Rpeid
  name: string
  parties: RegionPartyResult[]
  winnerId: PartyId
  runnerUpId: PartyId
  margin: number // winner.prc - runnerUp.prc
  turnout: Turnout
  totalVotes: number
  validVotes: number
  invalidVotes: number
}

export interface EnotaResult {
  st: EnotaSt
  rpeid: Rpeid
  name: string
  okraji: OkrajResult[]
  parties: RegionPartyResult[]
  winnerId: PartyId
  turnout: Turnout
  totalVotes: number
  validVotes: number
  invalidVotes: number
}

export interface CandidateResult {
  id: CandidateId
  name: string
  partyId: PartyId
  votes: number
  percentage: number // 0-1
  elected: boolean
  enotaSt: EnotaSt
  enotaRpeid: Rpeid
  okrajOrdinals: OkrajSt[]
  okrajRpeids: Rpeid[]
}

/** Lightweight party reference for map/panel components */
export interface PartyInfo {
  color: string
  abbrev: string
}

// =============================================================================
// Swing analysis types (2022 vs 2026 comparison)
// =============================================================================

export interface PartySwing {
  partyId2026: PartyId
  partyLabel: string
  color: string
  pct2022: number
  pct2026: number
  swing: number // pct2026 - pct2022 (percentage points)
}

export interface BlocSwing {
  bloc: string
  label: string
  color: string
  pct2022: number
  pct2026: number
  swing: number
}

export interface OkrajSwing {
  rpeid: Rpeid
  name: string
  enotaSt: EnotaSt
  partySwings: PartySwing[]
  blocSwings: BlocSwing[]
  biggestGainer: { partyId: PartyId; swing: number }
  turnoutChange: number // 2026 turnout - 2022 turnout
}

export interface SwingAnalysis {
  okraji: OkrajSwing[]
  /** National-level party swings */
  nationalSwings: PartySwing[]
  nationalBlocSwings: BlocSwing[]
  /** Total votes to sub-threshold parties */
  wastedVotes2022: number
  wastedVotes2026: number
}

// =============================================================================
// Demographics types (SURS data aggregated to okraj level)
// =============================================================================

export interface OkrajDemographics {
  rpeid: string
  vdvId: number
  avgWage: number | null
  population: number | null
  pctYoung: number | null // 0-14 years
  pctWorking: number | null // 15-64 years
  pctElderly: number | null // 65+ years
  pctHigherEd: number | null // tertiary+ education
  employed: number | null
  pctEmployedHigherEd: number | null
  obcineCount: number
  obcineNames: string[]
}

export interface NationalResults {
  timestamp: Date
  parties: Party[]
  parliamentaryParties: Party[]
  enote: EnotaResult[]
  turnout: Turnout
  totalVotes: number
  validVotes: number
  invalidVotes: number
  candidates: CandidateResult[]
  electedCandidates: CandidateResult[]
  partyMap: Map<PartyId, Party>
}
