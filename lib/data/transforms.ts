import type {
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
import { cleanEnotaName, cleanOkrajName } from "./constants"

function toParty(raw: {
  naz: string
  knaz: string
  hcol: string
  st: number
  gl: number
  prc: number
  man: number
}): Party {
  return {
    id: raw.st,
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
    partyId: r.st,
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
    winnerId: winner?.st ?? 0,
    runnerUpId: runnerUp?.st ?? 0,
    margin: (winner?.prc ?? 0) - (runnerUp?.prc ?? 0),
  }
}

/** Build the complete NationalResults from raw API data */
export function buildNationalResults(
  rezultati: RawRezultati,
  udelezba: RawUdelezba,
  kandidati: RawKandidatiRezultat
): NationalResults {
  // Build party list
  const parties = rezultati.slovenija
    .map(toParty)
    .sort((a, b) => b.votes - a.votes)

  const partyMap = new Map<number, Party>()
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
        st: ro.st,
        rpeid: ro.rpeid,
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
      st: re.st,
      rpeid: re.rpeid,
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
    id: rk.id,
    name: rk.naziv,
    partyId: rk.st,
    votes: rk.gl,
    percentage: rk.prc,
    elected: rk.man,
    enotaSt: rk.enota,
    enotaRpeid: rk.enrpeid,
    okrajOrdinals: rk.okraji,
    okrajRpeids: rk.okrpeids,
  }))

  const electedCandidates = candidates
    .filter((c) => c.elected)
    .sort((a, b) => b.votes - a.votes)

  return {
    timestamp: new Date(rezultati.datum),
    parties,
    parliamentaryParties,
    enote,
    turnout: turnoutMap.get("SI")!,
    totalVotes: rezultati.glas,
    validVotes: rezultati.velj,
    invalidVotes: rezultati.nev,
    candidates,
    electedCandidates,
    partyMap,
  }
}
