"use client"

import { useMemo, useState } from "react"

import type { PartyId } from "@/lib/data/ids"
import staticKandidati from "@/lib/data/static/kandidati_rezultat.json"
import okrajDemographics from "@/lib/data/static/okraj_demographics.json"
import staticRezultati from "@/lib/data/static/rezultati.json"
import staticUdelezba from "@/lib/data/static/udelezba.json"
import { buildNationalResults } from "@/lib/data/transforms"
import type {
  RawRezultati,
  RawUdelezba,
  RawKandidatiRezultat,
  OkrajDemographics,
} from "@/lib/data/types"
import { cn } from "@/lib/utils"

type MetricKey = "wage" | "elderly" | "education" | "employment" | "turnout"

const METRICS: {
  key: MetricKey
  label: string
  unit: string
  source: string
}[] = [
  { key: "wage", label: "Plača", unit: "€", source: "SURS 2023" },
  { key: "elderly", label: "Starejši (65+)", unit: "%", source: "SURS 2025" },
  {
    key: "education",
    label: "Višja izobrazba",
    unit: "%",
    source: "SURS 2025",
  },
  {
    key: "employment",
    label: "Zaposleni z VŠ",
    unit: "%",
    source: "SURS 2025",
  },
  { key: "turnout", label: "Udeležba", unit: "%", source: "DVK 2026" },
]

interface DataPoint {
  rpeid: string
  name: string
  metric: number
  partyPct: number
  partyColor: string
  partyAbbrev: string
}

function pearsonR(points: DataPoint[]): number {
  const n = points.length
  if (n < 3) return 0
  let sx = 0,
    sy = 0,
    sxy = 0,
    sx2 = 0,
    sy2 = 0
  for (const p of points) {
    sx += p.metric
    sy += p.partyPct
    sxy += p.metric * p.partyPct
    sx2 += p.metric * p.metric
    sy2 += p.partyPct * p.partyPct
  }
  const num = n * sxy - sx * sy
  const den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy))
  return den !== 0 ? num / den : 0
}

export default function AnalizaPage() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>("wage")
  const [selectedPartyId, setSelectedPartyId] = useState<PartyId | null>(null)

  const { parliamentaryParties, dataByMetric } = useMemo(() => {
    const results = buildNationalResults({
      rezultati: staticRezultati as RawRezultati,
      udelezba: staticUdelezba as RawUdelezba,
      kandidati: staticKandidati as RawKandidatiRezultat,
    })

    const demographics = okrajDemographics as OkrajDemographics[]
    const demoMap = new Map(demographics.map((d) => [d.rpeid, d]))

    // Build data for each metric × each party
    const byMetric = new Map<MetricKey, Map<PartyId | null, DataPoint[]>>()

    for (const metricDef of METRICS) {
      const partyMap = new Map<PartyId | null, DataPoint[]>()

      for (const enota of results.enote) {
        for (const okraj of enota.okraji) {
          const demo = demoMap.get(String(okraj.rpeid))

          // Get metric value
          let metricVal: number | null = null
          switch (metricDef.key) {
            case "wage":
              metricVal = demo?.avgWage ?? null
              break
            case "elderly":
              metricVal =
                demo?.pctElderly != null ? demo.pctElderly * 100 : null
              break
            case "education":
              metricVal =
                demo?.pctHigherEd != null ? demo.pctHigherEd * 100 : null
              break
            case "employment":
              metricVal =
                demo?.pctEmployedHigherEd != null
                  ? demo.pctEmployedHigherEd * 100
                  : null
              break
            case "turnout":
              metricVal = okraj.turnout.percentage * 100
              break
          }
          if (metricVal == null) continue

          // For each party, create a data point
          for (const rp of okraj.parties) {
            const party = results.partyMap.get(rp.partyId)
            if (!party || rp.percentage < 0.01) continue

            const point: DataPoint = {
              rpeid: String(okraj.rpeid),
              name: okraj.name,
              metric: metricVal,
              partyPct: rp.percentage * 100,
              partyColor: party.color,
              partyAbbrev: party.abbrev,
            }

            // Add to party-specific bucket
            const existing = partyMap.get(rp.partyId) ?? []
            existing.push(point)
            partyMap.set(rp.partyId, existing)
          }

          // Also add winner for the "null" (all winners) bucket
          const winner = results.partyMap.get(okraj.winnerId)
          const winnerResult = okraj.parties.find(
            (p) => p.partyId === okraj.winnerId
          )
          if (winner && winnerResult) {
            const existing = partyMap.get(null) ?? []
            existing.push({
              rpeid: String(okraj.rpeid),
              name: okraj.name,
              metric: metricVal,
              partyPct: winnerResult.percentage * 100,
              partyColor: winner.color,
              partyAbbrev: winner.abbrev,
            })
            partyMap.set(null, existing)
          }
        }
      }

      byMetric.set(metricDef.key, partyMap)
    }

    return {
      parliamentaryParties: results.parliamentaryParties,
      dataByMetric: byMetric,
    }
  }, [])

  // Get current data points
  const metricData = dataByMetric.get(activeMetric)
  const points = metricData?.get(selectedPartyId) ?? []
  const r = pearsonR(points)
  const metricDef = METRICS.find((m) => m.key === activeMetric)!

  // Scales
  const metricValues = points.map((p) => p.metric)
  const minX = Math.min(...metricValues)
  const maxX = Math.max(...metricValues)
  const rangeX = maxX - minX || 1

  const plotW = 600,
    plotH = 300
  const pad = { t: 10, r: 20, b: 30, l: 50 }
  const innerW = plotW - pad.l - pad.r
  const innerH = plotH - pad.t - pad.b
  const scaleX = (v: number) => pad.l + ((v - minX) / rangeX) * innerW
  const scaleY = (v: number) => pad.t + innerH - (v / 60) * innerH // 0-60% range

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <h1 className="font-heading text-xl font-bold md:text-3xl">
        Demografska analiza
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Korelacija med demografskimi kazalniki in volilnimi rezultati po
        okrajih.
      </p>

      {/* Caveat */}
      <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-400">
        Agregatni podatki na ravni okrajev ne odražajo posameznikov (ekološka
        zmota). Korelacije niso vzročnost.
      </div>

      {/* Metric toggle */}
      <div className="mt-6 flex flex-wrap gap-1">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setActiveMetric(m.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              activeMetric === m.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Party selector */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-muted-foreground">Stranka:</span>
        <button
          type="button"
          onClick={() => setSelectedPartyId(null)}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
            selectedPartyId === null
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          )}
        >
          Zmagovalec
        </button>
        {parliamentaryParties.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelectedPartyId(p.id)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              selectedPartyId === p.id
                ? "text-white"
                : "bg-muted text-muted-foreground"
            )}
            style={
              selectedPartyId === p.id
                ? { backgroundColor: p.color }
                : undefined
            }
          >
            {p.abbrev}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Pearsonov r</p>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {r.toFixed(3)}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {Math.abs(r) < 0.2
              ? "Šibka"
              : Math.abs(r) < 0.5
                ? "Zmerna"
                : "Močna"}{" "}
            {r > 0 ? "pozitivna" : "negativna"}
          </p>
        </div>
        <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">Okrajev</p>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {points.length}
          </p>
        </div>
        <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">
            Min {metricDef.label.toLowerCase()}
          </p>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {minX.toLocaleString("sl-SI")} {metricDef.unit}
          </p>
        </div>
        <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
          <p className="text-xs text-muted-foreground">
            Max {metricDef.label.toLowerCase()}
          </p>
          <p className="font-heading text-2xl font-bold tabular-nums">
            {maxX.toLocaleString("sl-SI")} {metricDef.unit}
          </p>
        </div>
      </div>

      {/* Scatter plot */}
      <section className="mt-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          {metricDef.label} vs. glasovi (
          {selectedPartyId ? points[0]?.partyAbbrev : "zmagovalec"})
        </h2>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${plotW} ${plotH}`} className="w-full max-w-2xl">
            {[10, 20, 30, 40, 50].map((pct) => (
              <line
                key={pct}
                x1={pad.l}
                x2={plotW - pad.r}
                y1={scaleY(pct)}
                y2={scaleY(pct)}
                className="stroke-border/30"
                strokeDasharray="2 4"
              />
            ))}
            <line
              x1={pad.l}
              x2={plotW - pad.r}
              y1={pad.t + innerH}
              y2={pad.t + innerH}
              className="stroke-border"
            />
            <line
              x1={pad.l}
              x2={pad.l}
              y1={pad.t}
              y2={pad.t + innerH}
              className="stroke-border"
            />
            {[10, 20, 30, 40, 50].map((pct) => (
              <text
                key={pct}
                x={pad.l - 5}
                y={scaleY(pct) + 3}
                textAnchor="end"
                className="fill-muted-foreground text-[8px]"
              >
                {pct}%
              </text>
            ))}
            {Array.from({ length: 5 }, (_, i) => minX + (i * rangeX) / 4).map(
              (v) => (
                <text
                  key={v}
                  x={scaleX(v)}
                  y={pad.t + innerH + 15}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px]"
                >
                  {metricDef.unit === "€"
                    ? `${Math.round(v)} €`
                    : `${v.toFixed(1)}%`}
                </text>
              )
            )}
            {points.map((p) => (
              <circle
                key={p.rpeid}
                cx={scaleX(p.metric)}
                cy={scaleY(p.partyPct)}
                r={4}
                fill={p.partyColor}
                opacity={0.7}
                className="transition-opacity hover:opacity-100"
              >
                <title>
                  {p.name}: {p.metric.toLocaleString("sl-SI")} {metricDef.unit}{" "}
                  / {p.partyPct.toFixed(1)}% {p.partyAbbrev}
                </title>
              </circle>
            ))}
            <text
              x={plotW / 2}
              y={plotH - 2}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {metricDef.label} ({metricDef.source})
            </text>
            <text
              x={12}
              y={plotH / 2}
              textAnchor="middle"
              transform={`rotate(-90, 12, ${plotH / 2})`}
              className="fill-muted-foreground text-[9px]"
            >
              Delež glasov (%)
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
                <th className="pb-2 pr-4 text-right font-medium">
                  {metricDef.label}
                </th>
                <th className="pb-2 pr-4 font-medium">Stranka</th>
                <th className="pb-2 text-right font-medium">Delež</th>
              </tr>
            </thead>
            <tbody>
              {[...points]
                .sort((a, b) => b.metric - a.metric)
                .map((p) => (
                  <tr
                    key={p.rpeid}
                    className="border-b border-border/30 transition-colors last:border-0 hover:bg-muted/30"
                  >
                    <td className="py-1.5 pr-4 font-medium">{p.name}</td>
                    <td className="py-1.5 pr-4 text-right font-mono tabular-nums">
                      {metricDef.unit === "€"
                        ? p.metric.toLocaleString("sl-SI")
                        : `${p.metric.toFixed(1)}%`}
                    </td>
                    <td className="py-1.5 pr-4">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: p.partyColor }}
                        />
                        {p.partyAbbrev}
                      </span>
                    </td>
                    <td className="py-1.5 text-right font-mono tabular-nums">
                      {p.partyPct.toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Methodology */}
      <section className="mt-10 rounded-lg bg-card/50 p-5 ring-1 ring-foreground/10">
        <h2 className="font-heading text-sm font-semibold">Kako deluje?</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
          <li>
            Podatki o plačah, starosti, izobrazbi in zaposlitvi so pridobljeni
            iz <strong className="text-foreground">SURS</strong> (Statistični
            urad RS) na ravni 212 občin.
          </li>
          <li>
            Meje 212 občin (GURS RPE) preslikamo na 88 volilnih okrajev z
            uporabo centroida vsake občine in prostorskega ujemanja
            (point-in-polygon).
          </li>
          <li>
            Demografske kazalnike tehtamo po površini občin znotraj vsakega
            okraja.
          </li>
          <li>
            Volilne rezultate pridobimo iz DVK (Državna volilna komisija) na
            ravni okrajev.
          </li>
          <li>
            Pearsonov koeficient korelacije (r) meri linearno povezanost med
            kazalnikom in deležem glasov.
          </li>
        </ol>
        <p className="mt-2 text-[10px] text-muted-foreground">
          Viri: SURS (plače 2023, prebivalstvo 2025 H2, izobrazba 2025,
          zaposlenost 2025), GURS RPE (meje občin), DVK (volilni rezultati
          2026).
        </p>
      </section>
    </div>
  )
}
