import { StatCard } from "@/components/cards/stat-card"
import { TurnoutGauge } from "@/components/charts/turnout-gauge"
import { PageHeader } from "@/components/layout/page-header"
import { OkrajiTurnoutTable } from "@/components/tables/okraji-turnout-table"
import { getNationalResults } from "@/lib/data/fetchers"
import { formatNumber, formatPercent } from "@/lib/data/format"

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
        <TurnoutGauge percentage={data.turnout.percentage} size={180} />
        <div className="grid flex-1 grid-cols-2 gap-3">
          <StatCard
            label="Glasovalo"
            value={formatNumber(data.turnout.voted)}
          />
          <StatCard
            label="Vpisanih"
            value={formatNumber(data.turnout.registered)}
          />
          {(() => {
            const highest = enoteByTurnout[0]
            const lowest = enoteByTurnout.at(-1)
            if (!highest || !lowest) return null
            return (
              <>
                <StatCard
                  label="Najvišja (enota)"
                  value={formatPercent(highest.turnout.percentage)}
                  sublabel={highest.name}
                />
                <StatCard
                  label="Najnižja (enota)"
                  value={formatPercent(lowest.turnout.percentage)}
                  sublabel={lowest.name}
                />
              </>
            )
          })()}
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
            const barHue = Math.round(
              Math.min(140, Math.max(40, 40 + (pct - 0.6) * 600))
            )
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
                    className="absolute inset-y-0 left-0 rounded-r-sm"
                    style={{
                      width: `${pct * 100}%`,
                      backgroundColor: `hsl(${barHue}, 60%, 45%)`,
                    }}
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
        <OkrajiTurnoutTable okraji={okrajiByTurnout} />
      </section>
    </div>
  )
}
