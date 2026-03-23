import { fetchRezultati, getNationalResults } from "@/lib/data/fetchers"
import { formatNumber, formatPercent } from "@/lib/data/format"
import { partySlug } from "@/lib/data/constants"
import { PageHeader } from "@/components/layout/page-header"
import { StatCard } from "@/components/cards/stat-card"

export async function generateStaticParams() {
  const rezultati = await fetchRezultati()
  return rezultati.slovenija.map((p) => ({
    slug: partySlug(p.knaz),
  }))
}

export default async function StrankaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const data = await getNationalResults()
  const party = data.parties.find((p) => partySlug(p.abbrev) === slug)

  if (!party) {
    return <div className="p-8 text-center">Stranka ni najdena.</div>
  }

  // Per-enota breakdown
  const enotaBreakdown = data.enote.map((enota) => {
    const result = enota.parties.find((rp) => rp.partyId === party.id)
    return {
      enotaSt: enota.st,
      enotaName: enota.name,
      votes: result?.votes ?? 0,
      percentage: result?.percentage ?? 0,
      seats: result?.seats ?? 0,
    }
  })

  const bestEnota = [...enotaBreakdown].sort(
    (a, b) => b.percentage - a.percentage
  )[0]
  const worstEnota = [...enotaBreakdown].sort(
    (a, b) => a.percentage - b.percentage
  )[0]

  // Elected candidates from this party
  const elected = data.electedCandidates
    .filter((c) => c.partyId === party.id)
    .sort((a, b) => b.votes - a.votes)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <PageHeader
        title={party.name}
        breadcrumbs={[
          { label: "Stranke", href: "/stranke" },
          { label: party.abbrev },
        ]}
      />

      {/* Party color bar */}
      <div
        className="mb-6 h-1 w-full rounded-full"
        style={{ backgroundColor: party.color }}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Glasovi"
          value={formatNumber(party.votes)}
          sublabel={formatPercent(party.percentage)}
        />
        <StatCard label="Sedeži" value={String(party.seats)} sublabel="v DZ" />
        <StatCard
          label="Najboljša enota"
          value={bestEnota?.enotaName ?? "–"}
          sublabel={
            bestEnota ? formatPercent(bestEnota.percentage) : undefined
          }
        />
        <StatCard
          label="Najslabša enota"
          value={worstEnota?.enotaName ?? "–"}
          sublabel={
            worstEnota ? formatPercent(worstEnota.percentage) : undefined
          }
        />
      </div>

      {/* Per-enota table */}
      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Rezultati po volilnih enotah
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Enota</th>
                <th className="pb-2 pr-4 text-right font-medium">Glasovi</th>
                <th className="pb-2 pr-4 text-right font-medium">Delež</th>
                <th className="pb-2 text-right font-medium">Sedeži</th>
              </tr>
            </thead>
            <tbody>
              {enotaBreakdown.map((eb) => (
                <tr
                  key={eb.enotaSt}
                  className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-2 pr-4 font-medium">{eb.enotaName}</td>
                  <td className="py-2 pr-4 text-right font-mono tabular-nums">
                    {formatNumber(eb.votes)}
                  </td>
                  <td className="py-2 pr-4 text-right font-mono tabular-nums">
                    <div className="flex items-center justify-end gap-2">
                      <div className="hidden w-20 md:block">
                        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(eb.percentage * 100 * 2, 100)}%`,
                              backgroundColor: party.color,
                            }}
                          />
                        </div>
                      </div>
                      {formatPercent(eb.percentage)}
                    </div>
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums">
                    {eb.seats}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Elected candidates */}
      {elected.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Izvoljeni poslanci ({elected.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Poslanec</th>
                  <th className="pb-2 pr-4 font-medium">Enota</th>
                  <th className="pb-2 pr-4 text-right font-medium">
                    Glasovi
                  </th>
                  <th className="pb-2 text-right font-medium">Delež</th>
                </tr>
              </thead>
              <tbody>
                {elected.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-2 pr-4 font-medium">{c.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">
                      {data.enote.find((e) => e.st === c.enotaSt)?.name ?? "–"}
                    </td>
                    <td className="py-2 pr-4 text-right font-mono tabular-nums">
                      {formatNumber(c.votes)}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums text-muted-foreground">
                      {formatPercent(c.percentage)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
