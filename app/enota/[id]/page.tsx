import Link from "next/link"
import {
  fetchRezultati,
  fetchUdelezba,
  fetchKandidati,
} from "@/lib/data/fetchers"
import { buildNationalResults } from "@/lib/data/transforms"
import { formatNumber, formatPercent } from "@/lib/data/format"
import { PageHeader } from "@/components/layout/page-header"
import { PartyBarChart } from "@/components/charts/party-bar-chart"
import { StatCard } from "@/components/cards/stat-card"

export async function generateStaticParams() {
  return Array.from({ length: 8 }, (_, i) => ({ id: String(i + 1) }))
}

export default async function EnotaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const enotaSt = Number(id)

  const [rezultati, udelezba, kandidati] = await Promise.all([
    fetchRezultati(),
    fetchUdelezba(),
    fetchKandidati(),
  ])

  const data = buildNationalResults(rezultati, udelezba, kandidati)
  const enota = data.enote.find((e) => e.st === enotaSt)

  if (!enota) {
    return <div className="p-8 text-center">Enota ni najdena.</div>
  }

  const winnerParty = data.partyMap.get(enota.winnerId)

  // Build Party objects for bar chart from enota results
  const enotaParties = enota.parties
    .map((rp) => {
      const p = data.partyMap.get(rp.partyId)
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
    .filter(Boolean) as {
    id: number
    name: string
    abbrev: string
    color: string
    votes: number
    percentage: number
    seats: number
  }[]

  const electedHere = data.electedCandidates.filter(
    (c) => c.enotaSt === enotaSt
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <PageHeader
        title={`Volilna enota ${enota.name}`}
        breadcrumbs={[{ label: enota.name }]}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Zmagovalec"
          value={winnerParty?.abbrev ?? "–"}
        />
        <StatCard
          label="Udeležba"
          value={formatPercent(enota.turnout.percentage)}
          sublabel={`${formatNumber(enota.turnout.voted)} glasovalcev`}
        />
        <StatCard
          label="Glasovnice"
          value={formatNumber(enota.totalVotes)}
          sublabel={`${formatNumber(enota.invalidVotes)} neveljavnih`}
        />
        <StatCard
          label="Izvoljenih"
          value={String(electedHere.length)}
          sublabel="poslancev"
        />
      </div>

      {/* Party results */}
      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Rezultati po strankah
        </h2>
        <PartyBarChart parties={enotaParties} />
      </section>

      {/* Districts table */}
      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Volilni okraji
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Okraj</th>
                <th className="pb-2 pr-4 font-medium">Zmagovalec</th>
                <th className="pb-2 pr-4 text-right font-medium">Razlika</th>
                <th className="pb-2 text-right font-medium">Udeležba</th>
              </tr>
            </thead>
            <tbody>
              {enota.okraji.map((okraj) => {
                const okWinner = data.partyMap.get(okraj.winnerId)
                return (
                  <tr
                    key={okraj.rpeid}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="py-2 pr-4 text-muted-foreground">
                      {okraj.st}
                    </td>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/okraj/${enotaSt}/${okraj.st}`}
                        className="font-medium hover:underline"
                      >
                        {okraj.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{
                            backgroundColor: okWinner?.color ?? "#888",
                          }}
                        />
                        {okWinner?.abbrev}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right font-mono tabular-nums text-muted-foreground">
                      +{formatPercent(okraj.margin)}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {formatPercent(okraj.turnout.percentage)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Elected candidates */}
      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Izvoljeni poslanci
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Poslanec</th>
                <th className="pb-2 pr-4 font-medium">Stranka</th>
                <th className="pb-2 pr-4 text-right font-medium">Glasovi</th>
                <th className="pb-2 text-right font-medium">Delež</th>
              </tr>
            </thead>
            <tbody>
              {electedHere
                .sort((a, b) => b.votes - a.votes)
                .map((c) => {
                  const party = data.partyMap.get(c.partyId)
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-border/30 last:border-0"
                    >
                      <td className="py-2 pr-4 font-medium">{c.name}</td>
                      <td className="py-2 pr-4">
                        <span className="flex items-center gap-1.5">
                          <span
                            className="inline-block size-2 rounded-full"
                            style={{
                              backgroundColor: party?.color ?? "#888",
                            }}
                          />
                          <span className="text-muted-foreground">
                            {party?.abbrev}
                          </span>
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-right font-mono tabular-nums">
                        {formatNumber(c.votes)}
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                        {formatPercent(c.percentage)}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
