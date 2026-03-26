import type { Metadata } from "next"
import Link from "next/link"

import { StatCard } from "@/components/cards/stat-card"
import { PageHeader } from "@/components/layout/page-header"
import { PromiseList } from "@/components/promises/promise-list"
import { PromiseStatusBadge } from "@/components/promises/promise-status-badge"
import { PromiseSummaryBar } from "@/components/promises/promise-summary-bar"
import {
  PROMISE_STATUS_COLORS,
  PROMISE_STATUS_ORDER,
} from "@/lib/data/constants"
import { getNationalResults, getPromiseData } from "@/lib/data/fetchers"
import { formatDate } from "@/lib/data/format"
import type { CategoryId, PartyId } from "@/lib/data/ids"
import { countByStatus } from "@/lib/data/transforms"
import type { TrackedPromise } from "@/lib/data/types"

export const metadata: Metadata = {
  title: "Obveze strank | Volitve 2026",
  description:
    "Spremljanje izpolnjevanja predvolilnih obljub parlamentarnih strank.",
}

export default async function ObvezePage({
  searchParams,
}: {
  searchParams: Promise<{ pogled?: string }>
}) {
  const { pogled } = await searchParams
  const view = pogled === "teme" ? "teme" : "stranke"

  const national = await getNationalResults()
  const promiseData = getPromiseData()

  const { promises, categories } = promiseData
  const counts = countByStatus(promises)

  // Build lookup maps
  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  // Group promises by party
  const byParty = new Map<PartyId, TrackedPromise[]>()
  for (const p of promises) {
    const list = byParty.get(p.partyId) ?? []
    list.push(p)
    byParty.set(p.partyId, list)
  }

  // Group promises by category
  const byCategory = new Map<CategoryId, TrackedPromise[]>()
  for (const p of promises) {
    const list = byCategory.get(p.categoryId) ?? []
    list.push(p)
    byCategory.set(p.categoryId, list)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <PageHeader title="Obveze strank" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Skupaj obvez" value={String(promises.length)} />
        <StatCard
          label="Izpolnjeno"
          value={String(counts.fulfilled)}
          accentColor={PROMISE_STATUS_COLORS.fulfilled}
        />
        <StatCard
          label="V izvajanju"
          value={String(counts.in_progress)}
          accentColor={PROMISE_STATUS_COLORS.in_progress}
        />
        <StatCard
          label="Prelomljeno"
          value={String(counts.broken)}
          accentColor={PROMISE_STATUS_COLORS.broken}
        />
      </div>

      {/* Overall progress bar */}
      <div className="mt-4">
        <PromiseSummaryBar counts={counts} />
      </div>

      {/* View toggle */}
      <div className="mt-8 flex gap-1">
        <Link
          href="/obveze?pogled=stranke"
          className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
            view === "stranke"
              ? "bg-foreground/10 font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Po strankah
        </Link>
        <Link
          href="/obveze?pogled=teme"
          className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
            view === "teme"
              ? "bg-foreground/10 font-semibold text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Po temah
        </Link>
      </div>

      {/* By party view */}
      {view === "stranke" && (
        <div className="mt-6 flex flex-col gap-6">
          {national.parliamentaryParties
            .filter((party) => byParty.has(party.id))
            .map((party) => {
              const partyPromises = byParty.get(party.id)!
              const partyCounts = countByStatus(partyPromises)
              return (
                <section key={party.id}>
                  <div className="mb-3 flex items-center gap-3">
                    <div
                      className="h-8 w-1 rounded-full"
                      style={{ backgroundColor: party.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <h2 className="font-heading text-base font-semibold">
                          {party.abbrev}
                        </h2>
                        <span className="text-xs text-muted-foreground">
                          {partyPromises.length} obvez
                        </span>
                      </div>
                      <div className="mt-1 max-w-xs">
                        <PromiseSummaryBar counts={partyCounts} />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {PROMISE_STATUS_ORDER.map(
                        (s) =>
                          partyCounts[s] > 0 && (
                            <PromiseStatusBadge key={s} status={s} size="sm" />
                          )
                      )}
                    </div>
                  </div>
                  <PromiseList
                    promises={partyPromises}
                    partyMap={national.partyMap}
                    categoryMap={categoryMap}
                    showParty={false}
                  />
                </section>
              )
            })}
        </div>
      )}

      {/* By topic view */}
      {view === "teme" && (
        <div className="mt-6 flex flex-col gap-6">
          {categories
            .filter((cat) => byCategory.has(cat.id))
            .map((cat) => {
              const catPromises = byCategory.get(cat.id)!
              const catCounts = countByStatus(catPromises)
              return (
                <section key={cat.id}>
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <Link
                          href={`/obveze/${cat.slug}`}
                          className="font-heading text-base font-semibold hover:underline"
                        >
                          {cat.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {catPromises.length} obvez
                        </span>
                      </div>
                      <div className="mt-1 max-w-xs">
                        <PromiseSummaryBar counts={catCounts} />
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {PROMISE_STATUS_ORDER.map(
                        (s) =>
                          catCounts[s] > 0 && (
                            <PromiseStatusBadge key={s} status={s} size="sm" />
                          )
                      )}
                    </div>
                  </div>
                  <PromiseList
                    promises={catPromises}
                    partyMap={national.partyMap}
                    categoryMap={categoryMap}
                    showParty={true}
                  />
                </section>
              )
            })}
        </div>
      )}

      {/* Last updated */}
      <p className="mt-8 text-[10px] text-muted-foreground">
        Zadnja posodobitev: {formatDate(new Date(promiseData.lastUpdated))}
      </p>
    </div>
  )
}
