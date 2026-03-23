import {
  fetchRezultati,
  fetchUdelezba,
  fetchKandidati,
} from "@/lib/data/fetchers"
import { buildNationalResults } from "@/lib/data/transforms"
import { formatNumber, formatPercent, formatDate } from "@/lib/data/format"
import { WinnerBanner } from "@/components/cards/winner-banner"
import { ParliamentChart } from "@/components/parliament/parliament-chart"
import { PartyBarChart } from "@/components/charts/party-bar-chart"
import { StatCard } from "@/components/cards/stat-card"

export default async function HomePage() {
  const [rezultati, udelezba, kandidati] = await Promise.all([
    fetchRezultati(),
    fetchUdelezba(),
    fetchKandidati(),
  ])

  const data = buildNationalResults(rezultati, udelezba, kandidati)
  const winner = data.parties[0]

  // Serialize parties for client components (Map can't be serialized)
  const partiesForClient = data.parliamentaryParties.map((p) => ({
    id: p.id,
    name: p.name,
    abbrev: p.abbrev,
    color: p.color,
    votes: p.votes,
    percentage: p.percentage,
    seats: p.seats,
  }))

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* Winner Banner */}
      <WinnerBanner winner={winner} totalSeats={90} />

      {/* Parliament + Stats */}
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_280px]">
        {/* Parliament chart */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Državni zbor
          </h2>
          <ParliamentChart parties={partiesForClient} totalSeats={90} />
        </section>

        {/* Key stats */}
        <aside className="grid grid-cols-2 content-start gap-3 md:grid-cols-1">
          <StatCard
            label="Udeležba"
            value={formatPercent(data.turnout.percentage)}
            sublabel={`${formatNumber(data.turnout.voted)} glasovalcev`}
          />
          <StatCard
            label="Oddane glasovnice"
            value={formatNumber(data.totalVotes)}
            sublabel={`${formatNumber(data.invalidVotes)} neveljavnih`}
          />
          <StatCard
            label="Strank v DZ"
            value={String(data.parliamentaryParties.length)}
            sublabel={`od ${data.parties.length} kandidiranih`}
          />
          <StatCard
            label="Datum volitev"
            value="22. 3. 2026"
            sublabel={`Podatki: ${formatDate(data.timestamp)}`}
          />
        </aside>
      </div>

      {/* Party Results */}
      <section className="mt-10">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Rezultati po strankah
        </h2>
        <PartyBarChart parties={data.parties} />
      </section>

      {/* Enote overview */}
      <section className="mt-10">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Rezultati po volilnih enotah
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.enote.map((enota) => {
            const winnerParty = data.partyMap.get(enota.winnerId)
            return (
              <div
                key={enota.rpeid}
                className="relative overflow-hidden rounded-lg bg-card p-4 ring-1 ring-foreground/10"
              >
                <div
                  className="absolute inset-y-0 left-0 w-1"
                  style={{
                    backgroundColor: winnerParty?.color ?? "#888",
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Volilna enota {enota.st}
                </p>
                <p className="font-heading text-sm font-semibold">
                  {enota.name}
                </p>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className="text-xs">
                    <span
                      className="font-medium"
                      style={{ color: winnerParty?.color }}
                    >
                      {winnerParty?.abbrev}
                    </span>
                  </span>
                  <span className="font-mono text-xs tabular-nums text-muted-foreground">
                    {formatPercent(enota.turnout.percentage)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Elected candidates preview */}
      <section className="mt-10">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Izvoljeni poslanci
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          {data.electedCandidates.length} izvoljenih poslancev, razvrščenih po
          številu glasov
        </p>
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
              {data.electedCandidates.slice(0, 20).map((c) => {
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
        {data.electedCandidates.length > 20 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Prikazanih prvih 20 od {data.electedCandidates.length} poslancev.
          </p>
        )}
      </section>
    </div>
  )
}
