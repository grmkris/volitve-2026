import { ArrowRight } from "@phosphor-icons/react/dist/ssr"
import Link from "next/link"

import { CandidatesPreview } from "@/components/cards/candidates-preview"
import { StatCard } from "@/components/cards/stat-card"
import { WinnerBanner } from "@/components/cards/winner-banner"
import { PartyBarChart } from "@/components/charts/party-bar-chart"
import { ParliamentChart } from "@/components/parliament/parliament-chart"
import { TOTAL_SEATS } from "@/lib/data/constants"
import { getNationalResults } from "@/lib/data/fetchers"
import { formatNumber, formatPercent, formatDate } from "@/lib/data/format"

export default async function HomePage() {
  const data = await getNationalResults()
  const winner = data.parties[0]

  if (!winner) return <div className="p-8 text-center">Ni rezultatov.</div>

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      {/* Winner Banner */}
      <WinnerBanner winner={winner} totalSeats={TOTAL_SEATS} />

      {/* Project info */}
      <div className="mt-6 rounded-lg border border-border/50 bg-card/50 px-4 py-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium">
              Odprtokodni projekt za vizualizacijo volilnih rezultatov
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Podatki:{" "}
              <a
                href="https://volitve.dvk-rs.si/dz2026/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                DVK
              </a>
              {" · "}
              Meje:{" "}
              <a
                href="https://github.com/stefanb/gurs-rpe"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                GURS RPE
              </a>{" "}
              (CC-BY 4.0)
            </p>
          </div>
          <Link
            href="/o-projektu"
            className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Več o projektu
            <ArrowRight className="size-3" />
          </Link>
        </div>
      </div>

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
            value={formatDate(new Date("2026-03-22"))}
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
