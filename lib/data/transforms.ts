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
