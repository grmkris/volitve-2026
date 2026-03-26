// =============================================================================
// Branded ID types — zero-cost nominal typing for compile-time safety
// Inspired by ai-stilist TypeID pattern, adapted for external API IDs
// =============================================================================

declare const __brand: unique symbol
type Brand<T, B extends string> = T & { readonly [__brand]: B }

/** DVK party list ID (e.g. 107754) */
export type PartyId = Brand<number, "PartyId">

/** Electoral unit ordinal 1-8 */
export type EnotaSt = Brand<number, "EnotaSt">

/** District ordinal within an enota 1-11 */
export type OkrajSt = Brand<number, "OkrajSt">

/** DVK geographic reference ID (e.g. "1000", "1001") */
export type Rpeid = Brand<string, "Rpeid">

/** DVK candidate ID */
export type CandidateId = Brand<number, "CandidateId">

/** Promise tracker ID (e.g. "svoboda-min-placa") */
export type PromiseId = Brand<string, "PromiseId">

/** Promise category ID (e.g. "zdravstvo") */
export type CategoryId = Brand<string, "CategoryId">

// ── Constructors (brand raw API values at the boundary) ──────────────

export const partyId = (n: number) => n as PartyId
export const enotaSt = (n: number) => n as EnotaSt
export const okrajSt = (n: number) => n as OkrajSt
export const rpeid = (s: string) => s as Rpeid
export const candidateId = (n: number) => n as CandidateId
export const promiseId = (s: string) => s as PromiseId
export const categoryId = (s: string) => s as CategoryId
