import { fetchVolisca, getNationalResults } from "@/lib/data/fetchers"
import { toPartyList } from "@/lib/data/transforms"
import { formatNumber, formatPercent } from "@/lib/data/format"
import { NUM_ENOTE, MAX_OKRAJI_PER_ENOTA } from "@/lib/data/constants"
import { PageHeader } from "@/components/layout/page-header"
import { PartyBarChart } from "@/components/charts/party-bar-chart"
import { StatCard } from "@/components/cards/stat-card"

export async function generateStaticParams() {
  const params: { enotaId: string; okrajId: string }[] = []
  for (let e = 1; e <= NUM_ENOTE; e++) {
    for (let o = 1; o <= MAX_OKRAJI_PER_ENOTA; o++) {
      params.push({ enotaId: String(e), okrajId: String(o) })
    }
  }
  return params
}

export default async function OkrajPage({
  params,
}: {
  params: Promise<{ enotaId: string; okrajId: string }>
}) {
  const { enotaId, okrajId } = await params
  const enotaSt = Number(enotaId)
  const okrajSt = Number(okrajId)

  const [data, volisca] = await Promise.all([
    getNationalResults(),
    fetchVolisca(enotaSt, okrajSt),
  ])
  const enota = data.enote.find((e) => e.st === enotaSt)
  const okraj = enota?.okraji.find((o) => o.st === okrajSt)

  if (!enota || !okraj) {
    return <div className="p-8 text-center">Okraj ni najden.</div>
  }

  const winnerParty = data.partyMap.get(okraj.winnerId)
  const runnerUpParty = data.partyMap.get(okraj.runnerUpId)

  // Build party objects for bar chart
  const okrajParties = toPartyList({
    regionParties: okraj.parties,
    partyMap: data.partyMap,
  })

  // Candidates in this okraj
  const okrajCandidates = data.candidates
    .filter(
      (c) =>
        c.enotaSt === enotaSt &&
        c.okrajOrdinals.includes(okrajSt)
    )
    .sort((a, b) => b.votes - a.votes)

  const electedCandidate = okrajCandidates.find((c) => c.elected)

  // Polling station results
  const stations = volisca?.vol ?? []

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <PageHeader
        title={okraj.name}
        breadcrumbs={[
          { label: enota.name, href: `/enota/${enotaSt}` },
          { label: okraj.name },
        ]}
      />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Zmagovalec" value={winnerParty?.abbrev ?? "–"} />
        <StatCard
          label="Razlika"
          value={`+${formatPercent(okraj.margin)}`}
          sublabel={`pred ${runnerUpParty?.abbrev ?? "–"}`}
        />
        <StatCard
          label="Udeležba"
          value={formatPercent(okraj.turnout.percentage)}
          sublabel={`${formatNumber(okraj.turnout.voted)} glasovalcev`}
        />
        <StatCard
          label="Glasovnice"
          value={formatNumber(okraj.totalVotes)}
        />
      </div>

      {/* Elected candidate highlight */}
      {electedCandidate && (
        <section className="mt-6">
          <div className="flex items-center gap-3 rounded-lg bg-card p-4 ring-1 ring-foreground/10">
            <span
              className="size-3 rounded-full"
              style={{
                backgroundColor:
                  data.partyMap.get(electedCandidate.partyId)?.color ?? "#888",
              }}
            />
            <div>
              <p className="text-xs text-muted-foreground">
                Izvoljen/a poslanec/ka
              </p>
              <p className="font-heading text-sm font-semibold">
                {electedCandidate.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {data.partyMap.get(electedCandidate.partyId)?.abbrev} ·{" "}
                {formatNumber(electedCandidate.votes)} glasov (
                {formatPercent(electedCandidate.percentage)})
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Party results */}
      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Rezultati po strankah
        </h2>
        <PartyBarChart parties={okrajParties} />
      </section>

      {/* All candidates */}
      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Kandidati ({okrajCandidates.length})
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Kandidat</th>
                <th className="pb-2 pr-4 font-medium">Stranka</th>
                <th className="pb-2 pr-4 text-right font-medium">Glasovi</th>
                <th className="pb-2 text-right font-medium">Delež</th>
              </tr>
            </thead>
            <tbody>
              {okrajCandidates.map((c) => {
                const party = data.partyMap.get(c.partyId)
                return (
                  <tr
                    key={c.id}
                    className={`border-b border-border/30 last:border-0 ${c.elected ? "bg-primary/5" : ""}`}
                  >
                    <td className="py-2 pr-4 font-medium">
                      {c.name}
                      {c.elected && (
                        <span className="ml-1.5 rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary">
                          izvoljen/a
                        </span>
                      )}
                    </td>
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

      {/* Polling stations */}
      {stations.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Volišča ({stations.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50 text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">#</th>
                  <th className="pb-2 pr-4 font-medium">Volišče</th>
                  <th className="pb-2 pr-4 text-right font-medium">
                    Glasovi
                  </th>
                  <th className="pb-2 text-right font-medium">Udeležba</th>
                </tr>
              </thead>
              <tbody>
                {stations.map((s) => (
                  <tr
                    key={s.st}
                    className="border-b border-border/30 last:border-0"
                  >
                    <td className="py-2 pr-4 text-muted-foreground">{s.st}</td>
                    <td className="py-2 pr-4">{s.naz}</td>
                    <td className="py-2 pr-4 text-right font-mono tabular-nums">
                      {formatNumber(s.rez?.glas ?? 0)}
                    </td>
                    <td className="py-2 text-right font-mono tabular-nums">
                      {s.udel?.prc != null
                        ? formatPercent(s.udel.prc)
                        : "–"}
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
