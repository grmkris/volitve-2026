import type {
  RawPartyResult,
  RawRezultati,
  RawUdelezba,
  RawKandidatiRezultat,
  RawRegionPartyResult,
  Party,
  Turnout,
  RegionPartyResult,
  OkrajResult,
  EnotaResult,
  CandidateResult,
  NationalResults,
  PartySwing,
  BlocSwing,
  OkrajSwing,
  SwingAnalysis,
} from "./types"
import type { PartyId } from "./ids"
import {
  partyId,
  enotaSt,
  okrajSt,
  rpeid,
  candidateId,
} from "./ids"
import { cleanEnotaName, cleanOkrajName } from "./constants"

function toParty(raw: RawPartyResult): Party {
  return {
    id: partyId(raw.st),
    name: raw.naz,
    abbrev: raw.knaz,
    color: `#${raw.hcol}`,
    votes: raw.gl,
    percentage: raw.prc,
    seats: raw.man,
  }
}

function toRegionPartyResults(
  rez: RawRegionPartyResult[]
): RegionPartyResult[] {
  return rez.map((r) => ({
    partyId: partyId(r.st),
    votes: r.gl,
    percentage: r.prc,
    seats: r.man ?? 0,
  }))
}

function findWinnerAndRunnerUp(rez: RawRegionPartyResult[]) {
  const sorted = [...rez].sort((a, b) => b.gl - a.gl)
  const winner = sorted[0]
  const runnerUp = sorted[1]
  return {
    winnerId: partyId(winner?.st ?? 0),
    runnerUpId: partyId(runnerUp?.st ?? 0),
    margin: (winner?.prc ?? 0) - (runnerUp?.prc ?? 0),
  }
}

/** Build Party[] from region-level results using a party lookup map */
export function toPartyList({
  regionParties,
  partyMap,
}: {
  regionParties: RegionPartyResult[]
  partyMap: Map<PartyId, Party>
}): Party[] {
  return regionParties
    .map((rp) => {
      const p = partyMap.get(rp.partyId)
      if (!p) return null
      return {
        id: rp.partyId,
        name: p.name,
        abbrev: p.abbrev,
        color: p.color,
        votes: rp.votes,
        percentage: rp.percentage,
        seats: rp.seats,
      }
    })
    .filter((p): p is Party => p !== null)
}

/** Build the complete NationalResults from raw API data */
export function buildNationalResults({
  rezultati,
  udelezba,
  kandidati,
}: {
  rezultati: RawRezultati
  udelezba: RawUdelezba
  kandidati: RawKandidatiRezultat
}): NationalResults {
  // Build party list
  const parties = rezultati.slovenija
    .map(toParty)
    .sort((a, b) => b.votes - a.votes)

  const partyMap = new Map<PartyId, Party>()
  for (const p of parties) {
    partyMap.set(p.id, p)
  }

  const parliamentaryParties = parties.filter((p) => p.seats > 0)

  // Build turnout lookup: rpeid → Turnout
  const turnoutMap = new Map<string, Turnout>()

  turnoutMap.set("SI", {
    registered: udelezba.slovenija.upr,
    voted: udelezba.slovenija.gl,
    percentage: udelezba.slovenija.prc,
  })

  for (const ue of udelezba.enote) {
    turnoutMap.set(ue.rpeid, {
      registered: ue.upr,
      voted: ue.gl,
      percentage: ue.prc,
    })
    for (const ok of ue.okraji) {
      turnoutMap.set(ok.rpeid, {
        registered: ok.upr,
        voted: ok.gl,
        percentage: ok.prc,
      })
    }
  }

  // Build enote
  const enote: EnotaResult[] = rezultati.enote.map((re) => {
    const enotaTurnout = turnoutMap.get(re.rpeid) ?? {
      registered: 0,
      voted: 0,
      percentage: 0,
    }

    const okraji: OkrajResult[] = re.okraji.map((ro) => {
      const okrajTurnout = turnoutMap.get(ro.rpeid) ?? {
        registered: 0,
        voted: 0,
        percentage: 0,
      }
      const { winnerId, runnerUpId, margin } = findWinnerAndRunnerUp(ro.rez)
      return {
        st: okrajSt(ro.st),
        rpeid: rpeid(ro.rpeid),
        name: cleanOkrajName(ro.naz),
        parties: toRegionPartyResults(ro.rez),
        winnerId,
        runnerUpId,
        margin,
        turnout: okrajTurnout,
        totalVotes: ro.glas,
        validVotes: ro.velj,
        invalidVotes: ro.nev,
      }
    })

    const { winnerId } = findWinnerAndRunnerUp(re.rez)

    return {
      st: enotaSt(re.st),
      rpeid: rpeid(re.rpeid),
      name: cleanEnotaName(re.naz),
      okraji,
      parties: toRegionPartyResults(re.rez),
      winnerId,
      turnout: enotaTurnout,
      totalVotes: re.glas,
      validVotes: re.velj,
      invalidVotes: re.nev,
    }
  })

  // Build candidates
  const candidates: CandidateResult[] = kandidati.kandidati.map((rk) => ({
    id: candidateId(rk.id),
    name: rk.naziv,
    partyId: partyId(rk.st),
    votes: rk.gl,
    percentage: rk.prc,
    elected: rk.man,
    enotaSt: enotaSt(rk.enota),
    enotaRpeid: rpeid(rk.enrpeid),
    okrajOrdinals: rk.okraji.map(okrajSt),
    okrajRpeids: rk.okrpeids.map(rpeid),
  }))

  const electedCandidates = candidates
    .filter((c) => c.elected)
    .sort((a, b) => b.votes - a.votes)

  return {
    timestamp: new Date(rezultati.datum),
    parties,
    parliamentaryParties,
    enote,
    turnout: turnoutMap.get("SI") ?? { registered: 0, voted: 0, percentage: 0 },
    totalVotes: rezultati.glas,
    validVotes: rezultati.velj,
    invalidVotes: rezultati.nev,
    candidates,
    electedCandidates,
    partyMap,
  }
}

// =============================================================================
// Swing analysis: 2022 vs 2026
// =============================================================================

import {
  PARTY_MAP_2022,
  PARTY_MERGERS_2022,
  BLOCS,
} from "./constants"

/** Build per-okraj swing data comparing 2022 and 2026 results */
export function buildSwingAnalysis({
  results2022,
  results2026,
  partyMap2026,
}: {
  results2022: RawRezultati
  results2026: RawRezultati
  partyMap2026: Map<PartyId, Party>
}): SwingAnalysis {
  // Build 2022 okraj lookup: okraj index "enotaSt-okrajSt" → rez[]
  const okraj2022Lookup = new Map<string, RawRegionPartyResult[]>()
  for (const enota of results2022.enote) {
    for (const okraj of enota.okraji) {
      okraj2022Lookup.set(`${enota.st}-${okraj.st}`, okraj.rez)
    }
  }

  // Build 2022 turnout lookup
  // 2022 udelezba is embedded in the same structure (we only have results, not separate turnout)
  // We'll compare vote totals instead

  const okrajSwings: OkrajSwing[] = []

  for (const enota of results2026.enote) {
    for (const okraj of enota.okraji) {
      const key = `${enota.st}-${okraj.st}`
      const rez2022 = okraj2022Lookup.get(key) ?? []

      // Build 2022 party pct lookup
      const pct2022Map = new Map<number, number>()
      for (const r of rez2022) {
        pct2022Map.set(r.st, r.prc)
      }

      // Party swings (direct successors + mergers)
      const partySwings: PartySwing[] = []

      // Direct successors
      for (const [st2022, st2026] of Object.entries(PARTY_MAP_2022)) {
        const pid = partyId(Number(st2026))
        const party = partyMap2026.get(pid)
        if (!party) continue

        const pct22 = pct2022Map.get(Number(st2022)) ?? 0
        const okrajResult = okraj.rez.find((r) => r.st === Number(st2026))
        const pct26 = okrajResult?.prc ?? 0

        partySwings.push({
          partyId2026: pid,
          partyLabel: party.abbrev,
          color: party.color,
          pct2022: pct22,
          pct2026: pct26,
          swing: pct26 - pct22,
        })
      }

      // Merged parties
      for (const [st2026Str, sources2022] of Object.entries(
        PARTY_MERGERS_2022
      )) {
        const pid = partyId(Number(st2026Str))
        const party = partyMap2026.get(pid)
        if (!party) continue

        const pct22 = sources2022.reduce(
          (sum, st) => sum + (pct2022Map.get(st) ?? 0),
          0
        )
        const okrajResult = okraj.rez.find(
          (r) => r.st === Number(st2026Str)
        )
        const pct26 = okrajResult?.prc ?? 0

        partySwings.push({
          partyId2026: pid,
          partyLabel: party.abbrev,
          color: party.color,
          pct2022: pct22,
          pct2026: pct26,
          swing: pct26 - pct22,
        })
      }

      // New parties (no 2022 baseline)
      for (const r of okraj.rez) {
        const alreadyMapped = partySwings.some(
          (ps) => ps.partyId2026 === partyId(r.st)
        )
        if (alreadyMapped) continue
        const party = partyMap2026.get(partyId(r.st))
        if (!party || r.prc < 0.01) continue

        partySwings.push({
          partyId2026: partyId(r.st),
          partyLabel: party.abbrev,
          color: party.color,
          pct2022: 0,
          pct2026: r.prc,
          swing: r.prc,
        })
      }

      // Bloc swings
      const blocSwings: BlocSwing[] = Object.entries(BLOCS).map(
        ([key, bloc]) => {
          const pct22 = bloc.parties2022.reduce(
            (sum, st) => sum + (pct2022Map.get(st) ?? 0),
            0
          )
          const pct26 = bloc.parties2026.reduce((sum, st) => {
            const r = okraj.rez.find((x) => x.st === st)
            return sum + (r?.prc ?? 0)
          }, 0)
          return {
            bloc: key,
            label: bloc.label,
            color: bloc.color,
            pct2022: pct22,
            pct2026: pct26,
            swing: pct26 - pct22,
          }
        }
      )

      // Find biggest gainer
      const sorted = [...partySwings].sort((a, b) => b.swing - a.swing)
      const biggest = sorted[0]

      okrajSwings.push({
        rpeid: rpeid(okraj.rpeid),
        name: cleanOkrajName(okraj.naz),
        enotaSt: enotaSt(enota.st),
        partySwings,
        blocSwings,
        biggestGainer: biggest
          ? { partyId: biggest.partyId2026, swing: biggest.swing }
          : { partyId: partyId(0), swing: 0 },
        turnoutChange: 0, // Will be filled if we have 2022 turnout data
      })
    }
  }

  // National swings
  const natPct2022 = new Map<number, number>()
  for (const p of results2022.slovenija) {
    natPct2022.set(p.st, p.prc)
  }

  const nationalSwings: PartySwing[] = []
  for (const [st2022, st2026] of Object.entries(PARTY_MAP_2022)) {
    const pid = partyId(Number(st2026))
    const party = partyMap2026.get(pid)
    if (!party) continue
    const pct22 = natPct2022.get(Number(st2022)) ?? 0
    const p2026 = results2026.slovenija.find((p) => p.st === Number(st2026))
    const pct26 = p2026?.prc ?? 0
    nationalSwings.push({
      partyId2026: pid,
      partyLabel: party.abbrev,
      color: party.color,
      pct2022: pct22,
      pct2026: pct26,
      swing: pct26 - pct22,
    })
  }
  // Add mergers
  for (const [st2026Str, sources] of Object.entries(PARTY_MERGERS_2022)) {
    const pid = partyId(Number(st2026Str))
    const party = partyMap2026.get(pid)
    if (!party) continue
    const pct22 = sources.reduce(
      (sum, st) => sum + (natPct2022.get(st) ?? 0),
      0
    )
    const p2026 = results2026.slovenija.find(
      (p) => p.st === Number(st2026Str)
    )
    nationalSwings.push({
      partyId2026: pid,
      partyLabel: party.abbrev,
      color: party.color,
      pct2022: pct22,
      pct2026: p2026?.prc ?? 0,
      swing: (p2026?.prc ?? 0) - pct22,
    })
  }

  // National bloc swings
  const nationalBlocSwings: BlocSwing[] = Object.entries(BLOCS).map(
    ([key, bloc]) => {
      const pct22 = bloc.parties2022.reduce(
        (sum, st) => sum + (natPct2022.get(st) ?? 0),
        0
      )
      const pct26 = bloc.parties2026.reduce((sum, st) => {
        const p = results2026.slovenija.find((x) => x.st === st)
        return sum + (p?.prc ?? 0)
      }, 0)
      return {
        bloc: key,
        label: bloc.label,
        color: bloc.color,
        pct2022: pct22,
        pct2026: pct26,
        swing: pct26 - pct22,
      }
    }
  )

  // Wasted votes (sub-threshold)
  const wastedVotes2022 = results2022.slovenija
    .filter((p) => p.man === 0)
    .reduce((sum, p) => sum + p.gl, 0)
  const wastedVotes2026 = results2026.slovenija
    .filter((p) => p.man === 0)
    .reduce((sum, p) => sum + p.gl, 0)

  return {
    okraji: okrajSwings,
    nationalSwings: nationalSwings.sort((a, b) => b.swing - a.swing),
    nationalBlocSwings,
    wastedVotes2022,
    wastedVotes2026,
  }
}
