import { getNationalResults } from "@/lib/data/fetchers"
import { PageHeader } from "@/components/layout/page-header"
import { PartyCard } from "@/components/cards/party-card"

export default async function StrankePage() {
  const data = await getNationalResults()

  const parliamentary = data.parties.filter((p) => p.seats > 0)
  const nonParliamentary = data.parties.filter((p) => p.seats === 0)

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <PageHeader title="Stranke" />

      <section>
        <h2 className="mb-3 font-heading text-base font-semibold">
          V Državnem zboru ({parliamentary.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {parliamentary.map((party) => (
            <PartyCard key={party.id} party={party} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-heading text-base font-semibold text-muted-foreground">
          Pod pragom ({nonParliamentary.length})
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {nonParliamentary.map((party) => (
            <PartyCard key={party.id} party={party} />
          ))}
        </div>
      </section>
    </div>
  )
}
