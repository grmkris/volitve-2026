import type { Metadata } from "next"

import { StatCard } from "@/components/cards/stat-card"
import { PageHeader } from "@/components/layout/page-header"
import { PromiseList } from "@/components/promises/promise-list"
import { PromiseSummaryBar } from "@/components/promises/promise-summary-bar"
import { PROMISE_STATUS_COLORS } from "@/lib/data/constants"
import { getNationalResults, getPromiseData } from "@/lib/data/fetchers"
import type { PartyId } from "@/lib/data/ids"
import { countByStatus } from "@/lib/data/transforms"
import type { TrackedPromise } from "@/lib/data/types"

export async function generateStaticParams() {
  const { categories } = getPromiseData()
  return categories.map((c) => ({ categorySlug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}): Promise<Metadata> {
  const { categorySlug } = await params
  const { categories } = getPromiseData()
  const cat = categories.find((c) => c.slug === categorySlug)
  if (!cat) return { title: "Tema ni najdena" }
  return {
    title: `${cat.name} — Obveze strank | Volitve 2026`,
    description: `Predvolilne obveze strank na področju: ${cat.name}.`,
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ categorySlug: string }>
}) {
  const { categorySlug } = await params

  const national = await getNationalResults()
  const promiseData = getPromiseData()

  const { promises, categories } = promiseData
  const category = categories.find((c) => c.slug === categorySlug)

  if (!category) {
    return <div className="p-8 text-center">Tema ni najdena.</div>
  }

  const categoryPromises = promises.filter((p) => p.categoryId === category.id)
  const counts = countByStatus(categoryPromises)

  const categoryMap = new Map(categories.map((c) => [c.id, c]))

  // Group by party for display
  const byParty = new Map<PartyId, TrackedPromise[]>()
  for (const p of categoryPromises) {
    const list = byParty.get(p.partyId) ?? []
    list.push(p)
    byParty.set(p.partyId, list)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <PageHeader
        title={category.name}
        breadcrumbs={[
          { label: "Obveze", href: "/obveze" },
          { label: category.name },
        ]}
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Skupaj" value={String(categoryPromises.length)} />
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

      <div className="mt-4">
        <PromiseSummaryBar counts={counts} />
      </div>

      {/* Promises grouped by party */}
      <div className="mt-8 flex flex-col gap-6">
        {national.parliamentaryParties
          .filter((party) => byParty.has(party.id))
          .map((party) => {
            const partyPromises = byParty.get(party.id)!
            return (
              <section key={party.id}>
                <div className="mb-3 flex items-center gap-3">
                  <div
                    className="h-6 w-1 rounded-full"
                    style={{ backgroundColor: party.color }}
                  />
                  <h2 className="font-heading text-sm font-semibold">
                    {party.abbrev}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {partyPromises.length}
                  </span>
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
    </div>
  )
}
