// =============================================================================
// Raw DVK API types (derived from Zod schemas — single source of truth)
// =============================================================================

export type {
  RawPartyResult,
  RawRegionPartyResult,
  RawOkraj,
  RawEnota,
  RawRezultati,
  RawUdelezbaSlovenija,
  RawUdelezbaRegion,
  RawUdelezbaEnota,
  RawUdelezba,
  RawKandidat,
  RawKandidatiRezultat,
  RawVolisceResult,
  RawVolisce,
  RawLista,
  RawVolisca,
} from "./dvk.schema"

// =============================================================================
// Domain types (transformed, ready for rendering)
// =============================================================================

import type {
  PartyId,
  EnotaSt,
  OkrajSt,
  Rpeid,
  CandidateId,
  PromiseId,
  CategoryId,
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

export type MapMode =
  | "winner"
  | "margin"
  | "turnout"
  | "secondPlace"
  | "overperformance"

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

// =============================================================================
// Promise tracker types
// =============================================================================

import { PROMISE_STATUSES, PROMISE_SOURCES } from "./promises.schema"

export type PromiseStatus = (typeof PROMISE_STATUSES)[number]
export type PromiseSource = (typeof PROMISE_SOURCES)[number]

export interface PromiseEvidence {
  url: string
  label: string // "Zakon o ...", "Vladno sporočilo"
  date: string // ISO 8601
}

export interface PromiseStatusChange {
  status: PromiseStatus
  date: string // ISO 8601
  note?: string
  evidence?: PromiseEvidence[]
}

export interface TrackedPromise {
  id: PromiseId
  partyId: PartyId
  categoryId: CategoryId
  source: PromiseSource
  title: string
  description?: string
  currentStatus: PromiseStatus
  history: PromiseStatusChange[] // newest first
  programRef?: string // "Volilni program, str. 12"
  coalitionRef?: string // "Koalicijska pogodba, čl. 14"
}

export interface PromiseCategory {
  id: CategoryId
  name: string // "Zdravstvo"
  slug: string // "zdravstvo"
}

export interface PromiseData {
  lastUpdated: string
  categories: PromiseCategory[]
  promises: TrackedPromise[]
}
