import { getNationalResults } from "@/lib/data/fetchers"
import { formatNumber, formatPercent } from "@/lib/data/format"
import { PageHeader } from "@/components/layout/page-header"
import { TurnoutGauge } from "@/components/charts/turnout-gauge"
import { StatCard } from "@/components/cards/stat-card"

export default async function UdelezbaPage() {
  const data = await getNationalResults()

  // Collect all okraji across all enote for ranking
  const allOkraji = data.enote.flatMap((enota) =>
    enota.okraji.map((okraj) => ({
      ...okraj,
      enotaName: enota.name,
      enotaSt: enota.st,
    }))
  )

  const enoteByTurnout = [...data.enote].sort(
    (a, b) => b.turnout.percentage - a.turnout.percentage
  )

  const okrajiByTurnout = [...allOkraji].sort(
    (a, b) => b.turnout.percentage - a.turnout.percentage
  )

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <PageHeader title="Volilna udeležba" />

      {/* Hero */}
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-start md:gap-10">
        <TurnoutGauge
          percentage={data.turnout.percentage}
          size={180}
        />
        <div className="grid flex-1 grid-cols-2 gap-3">
          <StatCard
            label="Glasovalo"
            value={formatNumber(data.turnout.voted)}
          />
          <StatCard
            label="Vpisanih"
            value={formatNumber(data.turnout.registered)}
          />
          <StatCard
            label="Najvišja (enota)"
            value={formatPercent(enoteByTurnout[0].turnout.percentage)}
            sublabel={enoteByTurnout[0].name}
          />
          <StatCard
            label="Najnižja (enota)"
            value={formatPercent(
              enoteByTurnout[enoteByTurnout.length - 1].turnout.percentage
            )}
            sublabel={enoteByTurnout[enoteByTurnout.length - 1].name}
          />
        </div>
      </div>

      {/* Enote ranking */}
      <section className="mt-10">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Udeležba po volilnih enotah
        </h2>
        <div className="space-y-2">
          {enoteByTurnout.map((enota, i) => {
            const pct = enota.turnout.percentage
            return (
              <div key={enota.rpeid} className="flex items-center gap-3">
                <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">
                  {i + 1}.
                </span>
                <span className="w-32 shrink-0 text-xs font-medium md:w-44">
                  {enota.name}
                </span>
                <div className="relative h-5 flex-1">
                  <div
                    className="absolute inset-y-0 left-0 rounded-r-sm bg-primary/70"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums">
                  {formatPercent(pct)}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Okraji ranking */}
      <section className="mt-10">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Udeležba po volilnih okrajih
        </h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Vseh {okrajiByTurnout.length} okrajev, razvrščenih po udeležbi
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">#</th>
                <th className="pb-2 pr-4 font-medium">Okraj</th>
                <th className="pb-2 pr-4 font-medium">Enota</th>
                <th className="pb-2 pr-4 text-right font-medium">
                  Glasovalo
                </th>
                <th className="pb-2 pr-4 text-right font-medium">
                  Vpisanih
                </th>
                <th className="pb-2 text-right font-medium">Udeležba</th>
              </tr>
            </thead>
            <tbody>
              {okrajiByTurnout.map((okraj, i) => (
                <tr
                  key={okraj.rpeid}
                  className="border-b border-border/30 last:border-0"
                >
                  <td className="py-1.5 pr-4 text-muted-foreground">
                    {i + 1}
                  </td>
                  <td className="py-1.5 pr-4 font-medium">{okraj.name}</td>
                  <td className="py-1.5 pr-4 text-muted-foreground">
                    {okraj.enotaName}
                  </td>
                  <td className="py-1.5 pr-4 text-right font-mono tabular-nums">
                    {formatNumber(okraj.turnout.voted)}
                  </td>
                  <td className="py-1.5 pr-4 text-right font-mono tabular-nums text-muted-foreground">
                    {formatNumber(okraj.turnout.registered)}
                  </td>
                  <td className="py-1.5 text-right font-mono tabular-nums font-medium">
                    {formatPercent(okraj.turnout.percentage)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
