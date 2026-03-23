import Link from "next/link"
import { getNationalResults } from "@/lib/data/fetchers"
import { formatNumber, formatPercent, formatDate } from "@/lib/data/format"
import { TOTAL_SEATS } from "@/lib/data/constants"
import { WinnerBanner } from "@/components/cards/winner-banner"
import { ParliamentChart } from "@/components/parliament/parliament-chart"
import { PartyBarChart } from "@/components/charts/party-bar-chart"
import { StatCard } from "@/components/cards/stat-card"
import { CandidatesPreview } from "@/components/cards/candidates-preview"

export default async function HomePage() {
  const data = await getNationalResults()
  const winner = data.parties[0]

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* Winner Banner */}
      <WinnerBanner winner={winner} totalSeats={TOTAL_SEATS} />

      {/* Parliament + Stats */}
      <div className="mt-10 grid gap-8 md:mt-12 md:grid-cols-[1fr_280px]">
        {/* Parliament chart */}
        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Državni zbor
          </h2>
          <ParliamentChart
            parties={data.parliamentaryParties}
            totalSeats={TOTAL_SEATS}
          />
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

      <hr className="my-12 border-border/30" />

      {/* Party Results */}
      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Rezultati po strankah
        </h2>
        <PartyBarChart parties={data.parties} collapsible />
      </section>

      <hr className="my-12 border-border/30" />

      {/* Enote overview */}
      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Rezultati po volilnih enotah
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.enote.map((enota) => {
            const winnerParty = data.partyMap.get(enota.winnerId)
            return (
              <Link
                key={enota.rpeid}
                href={`/enota/${enota.st}`}
                className="relative overflow-hidden rounded-lg bg-card p-4 ring-1 ring-foreground/10 transition-all hover:shadow-md hover:ring-foreground/20"
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
              </Link>
            )
          })}
        </div>
      </section>

      <hr className="my-12 border-border/30" />

      {/* Elected candidates preview */}
      <section>
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Izvoljeni poslanci
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          {data.electedCandidates.length} izvoljenih poslancev, razvrščenih po
          številu glasov
        </p>
        <CandidatesPreview
          candidates={data.electedCandidates.map((c) => ({
            id: c.id,
            name: c.name,
            partyId: c.partyId,
            votes: c.votes,
            percentage: c.percentage,
          }))}
          partyMap={Object.fromEntries(
            Array.from(data.partyMap.entries()).map(([id, p]) => [
              id,
              { color: p.color, abbrev: p.abbrev },
            ])
          )}
        />
      </section>
    </div>
  )
}
