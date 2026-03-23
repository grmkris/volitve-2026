"use client"

import { useMemo } from "react"
import { buildNationalResults } from "@/lib/data/transforms"
import { formatPercent } from "@/lib/data/format"
import type {
  RawRezultati,
  RawUdelezba,
  RawKandidatiRezultat,
  OkrajDemographics,
} from "@/lib/data/types"
import staticRezultati from "@/lib/data/static/rezultati.json"
import staticUdelezba from "@/lib/data/static/udelezba.json"
import staticKandidati from "@/lib/data/static/kandidati_rezultat.json"
import okrajDemographics from "@/lib/data/static/okraj_demographics.json"

interface ScatterPoint {
  rpeid: string
  name: string
  x: number // wage
  y: number // vote share of winner
  color: string
  partyAbbrev: string
}

export default function AnalizaPage() {
  const { points, correlationR, minWage, maxWage } = useMemo(() => {
    const results = buildNationalResults({
      rezultati: staticRezultati as RawRezultati,
      udelezba: staticUdelezba as RawUdelezba,
      kandidati: staticKandidati as RawKandidatiRezultat,
    })

    const demographics = okrajDemographics as OkrajDemographics[]
    const demoMap = new Map(demographics.map((d) => [d.rpeid, d]))

    const pts: ScatterPoint[] = []

    for (const enota of results.enote) {
      for (const okraj of enota.okraji) {
        const demo = demoMap.get(String(okraj.rpeid))
        if (!demo?.avgWage) continue

        const winner = results.partyMap.get(okraj.winnerId)
        if (!winner) continue

        // Find winner's vote share in this okraj
        const winnerResult = okraj.parties.find(
          (p) => p.partyId === okraj.winnerId
        )
        if (!winnerResult) continue

        pts.push({
          rpeid: String(okraj.rpeid),
          name: okraj.name,
          x: demo.avgWage,
          y: winnerResult.percentage,
          color: winner.color,
          partyAbbrev: winner.abbrev,
        })
      }
    }

    // Compute Pearson correlation between wage and winner vote share
    const n = pts.length
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0,
      sumY2 = 0
    for (const p of pts) {
      sumX += p.x
      sumY += p.y
      sumXY += p.x * p.y
      sumX2 += p.x * p.x
      sumY2 += p.y * p.y
    }
    const numerator = n * sumXY - sumX * sumY
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
    )
    const r = denominator !== 0 ? numerator / denominator : 0

    const wages = pts.map((p) => p.x)

    return {
      points: pts,
      correlationR: r,
      minWage: Math.min(...wages),
      maxWage: Math.max(...wages),
    }
  }, [])

  // Scale for scatter plot
  const plotWidth = 600
  const plotHeight = 300
  const padding = { top: 10, right: 20, bottom: 30, left: 50 }
  const innerW = plotWidth - padding.left - padding.right
  const innerH = plotHeight - padding.top - padding.bottom

  const wageRange = maxWage - minWage || 1
  const scaleX = (wage: number) =>
    padding.left + ((wage - minWage) / wageRange) * innerW
  const scaleY = (pct: number) =>
    padding.top + innerH - pct * innerH // 0% at bottom, 100% at top

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <h1 className="font-heading text-xl font-bold md:text-3xl">
        Demografska analiza
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Povezava med povprečnimi plačami po občinah in volilnimi rezultati po
        okrajih.
      </p>

      {/* Caveat */}
      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
        Opozorilo: Podatki na ravni okrajev ne odražajo posameznikov
        (ekološka zmota). Prikazane korelacije so agregatne in ne
        izražajo vzročnosti.
      </div>

      {/* Correlation stat */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Pearsonov r</p>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {correlationR.toFixed(3)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {Math.abs(correlationR) < 0.2
              ? "Šibka korelacija"
              : Math.abs(correlationR) < 0.5
                ? "Zmerna korelacija"
                : "Močna korelacija"}
          </p>
        </div>
        <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Okrajev</p>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {points.length}
          </p>
          <p className="text-[10px] text-muted-foreground">od 88 z podatki</p>
        </div>
        <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Min plača</p>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {minWage.toLocaleString("sl-SI")} €
          </p>
        </div>
        <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Max plača</p>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {maxWage.toLocaleString("sl-SI")} €
          </p>
        </div>
      </div>

      {/* Scatter plot */}
      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Plača vs. delež zmagovalca
        </h2>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${plotWidth} ${plotHeight}`}
            className="w-full max-w-2xl"
          >
            {/* Grid lines */}
            {[0.1, 0.2, 0.3, 0.4, 0.5].map((pct) => (
              <line
                key={pct}
                x1={padding.left}
                x2={plotWidth - padding.right}
                y1={scaleY(pct)}
                y2={scaleY(pct)}
                className="stroke-border/30"
                strokeDasharray="2 4"
              />
            ))}

            {/* X axis */}
            <line
              x1={padding.left}
              x2={plotWidth - padding.right}
              y1={padding.top + innerH}
              y2={padding.top + innerH}
              className="stroke-border"
            />

            {/* Y axis */}
            <line
              x1={padding.left}
              x2={padding.left}
              y1={padding.top}
              y2={padding.top + innerH}
              className="stroke-border"
            />

            {/* Y axis labels */}
            {[0.1, 0.2, 0.3, 0.4, 0.5].map((pct) => (
              <text
                key={pct}
                x={padding.left - 5}
                y={scaleY(pct) + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[8px]"
              >
                {(pct * 100).toFixed(0)}%
              </text>
            ))}

            {/* X axis labels */}
            {Array.from(
              { length: 5 },
              (_, i) => minWage + (i * wageRange) / 4
            ).map((wage) => (
              <text
                key={wage}
                x={scaleX(wage)}
                y={padding.top + innerH + 15}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px]"
              >
                {Math.round(wage)} €
              </text>
            ))}

            {/* Dots */}
            {points.map((p) => (
              <circle
                key={p.rpeid}
                cx={scaleX(p.x)}
                cy={scaleY(p.y)}
                r={4}
                fill={p.color}
                opacity={0.7}
                className="transition-opacity hover:opacity-100"
              >
                <title>
                  {p.name}: {p.x.toLocaleString("sl-SI")} € / {formatPercent(p.y)} ({p.partyAbbrev})
                </title>
              </circle>
            ))}

            {/* Axis labels */}
            <text
              x={plotWidth / 2}
              y={plotHeight - 2}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              Povprečna bruto plača (€)
            </text>
            <text
              x={12}
              y={plotHeight / 2}
              textAnchor="middle"
              transform={`rotate(-90, 12, ${plotHeight / 2})`}
              className="fill-muted-foreground text-[9px]"
            >
              Delež zmagovalca (%)
            </text>
          </svg>
        </div>
      </section>

      {/* Data table */}
      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Podatki po okrajih
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/50 text-left text-muted-foreground">
                <th className="pb-2 pr-4 font-medium">Okraj</th>
                <th className="pb-2 pr-4 text-right font-medium">Plača (€)</th>
                <th className="pb-2 pr-4 font-medium">Zmagovalec</th>
                <th className="pb-2 text-right font-medium">Delež</th>
              </tr>
            </thead>
            <tbody>
              {points
                .sort((a, b) => b.x - a.x)
                .map((p) => (
                  <tr
                    key={p.rpeid}
                    className="border-b border-border/30 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="py-1.5 pr-4 font-medium">{p.name}</td>
                    <td className="py-1.5 pr-4 text-right font-mono tabular-nums">
                      {p.x.toLocaleString("sl-SI")}
                    </td>
                    <td className="py-1.5 pr-4">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.partyAbbrev}
                      </span>
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {formatPercent(p.y)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Data sources */}
      <p className="mt-6 text-[10px] text-muted-foreground">
        Vir plač:{" "}
        <a
          href="https://pxweb.stat.si/SiStat/sl"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          SURS
        </a>{" "}
        (2023, povprečne mesečne bruto plače po občinah). Občine agregirane na
        okraje prek geografskega prekrivanja (GURS RPE).
      </p>
    </div>
  )
}
