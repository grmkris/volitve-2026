"use client"

import { useMemo, useState } from "react"

import { formatPercent } from "@/lib/data/format"
import type { PartyId } from "@/lib/data/ids"
import staticKandidati2026 from "@/lib/data/static/kandidati_rezultat.json"
import staticRezultati2026 from "@/lib/data/static/rezultati.json"
import staticRezultati2022 from "@/lib/data/static/rezultati_2022.json"
import staticUdelezba2026 from "@/lib/data/static/udelezba.json"
import { buildNationalResults, buildSwingAnalysis } from "@/lib/data/transforms"
import type {
  RawRezultati,
  RawUdelezba,
  RawKandidatiRezultat,
  PartySwing,
  OkrajSwing,
} from "@/lib/data/types"
import { cn } from "@/lib/utils"

type ViewMode = "parties" | "blocs"

export default function PrimerjavaPage() {
  const [selectedPartyId, setSelectedPartyId] = useState<PartyId | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("parties")

  const { swing } = useMemo(() => {
    const results = buildNationalResults({
      rezultati: staticRezultati2026 as RawRezultati,
      udelezba: staticUdelezba2026 as RawUdelezba,
      kandidati: staticKandidati2026 as RawKandidatiRezultat,
    })

    const swingData = buildSwingAnalysis({
      results2022: staticRezultati2022 as RawRezultati,
      results2026: staticRezultati2026 as RawRezultati,
      partyMap2026: results.partyMap,
    })

    return { swing: swingData, parties2026: results.parliamentaryParties }
  }, [])

  // When a party is selected, show per-okraj swing for that party
  const selectedSwings = useMemo(() => {
    if (!selectedPartyId) return null
    return swing.okraji
      .map((o) => {
        const ps = o.partySwings.find((s) => s.partyId2026 === selectedPartyId)
        return ps ? { ...o, selectedSwing: ps } : null
      })
      .filter(Boolean)
      .sort(
        (a, b) =>
          Math.abs(b!.selectedSwing.swing) - Math.abs(a!.selectedSwing.swing)
      ) as (OkrajSwing & { selectedSwing: PartySwing })[]
  }, [selectedPartyId, swing.okraji])

  const selectedParty = selectedPartyId
    ? swing.nationalSwings.find((s) => s.partyId2026 === selectedPartyId)
    : null

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <h1 className="font-heading text-xl font-bold md:text-3xl">
        Primerjava z 2022
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Kako so se rezultati spremenili od zadnjih parlamentarnih volitev.
      </p>

      {/* View mode toggle */}
      <div className="mt-6 flex gap-1 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => setViewMode("parties")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "parties"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          Po strankah
        </button>
        <button
          type="button"
          onClick={() => setViewMode("blocs")}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            viewMode === "blocs"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground"
          )}
        >
          Po blokih
        </button>
      </div>

      {viewMode === "parties" ? (
        <>
          {/* National party swings */}
          <section className="mt-6">
            <h2 className="mb-4 font-heading text-lg font-semibold">
              Nacionalni premiki
            </h2>
            <div className="space-y-2">
              {swing.nationalSwings.map((ps) => (
                <button
                  key={ps.partyId2026}
                  type="button"
                  onClick={() =>
                    setSelectedPartyId(
                      selectedPartyId === ps.partyId2026 ? null : ps.partyId2026
                    )
                  }
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all ring-1",
                    selectedPartyId === ps.partyId2026
                      ? "ring-foreground/30 bg-card shadow-sm"
                      : "ring-foreground/10 hover:ring-foreground/20"
                  )}
                >
                  <span
                    className="size-3 shrink-0 rounded-full"
                    style={{ backgroundColor: ps.color }}
                  />
                  <span className="w-28 shrink-0 text-xs font-medium md:w-36">
                    {ps.partyLabel}
                  </span>

                  {/* Swing bar */}
                  <div className="flex flex-1 items-center gap-2">
                    <span className="w-14 shrink-0 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {formatPercent(ps.pct2022)}
                    </span>
                    <div className="relative h-4 flex-1">
                      <div className="absolute inset-y-0 left-1/2 w-px bg-border" />
                      {ps.swing !== 0 && (
                        <div
                          className="absolute inset-y-0 rounded-sm"
                          style={{
                            backgroundColor: ps.color,
                            opacity: 0.7,
                            left:
                              ps.swing > 0 ? "50%" : `${50 + ps.swing * 200}%`,
                            width: `${Math.abs(ps.swing) * 200}%`,
                          }}
                        />
                      )}
                    </div>
                    <span className="w-14 shrink-0 font-mono text-xs tabular-nums">
                      {formatPercent(ps.pct2026)}
                    </span>
                  </div>

                  <span
                    className={cn(
                      "w-16 shrink-0 text-right font-mono text-xs font-medium tabular-nums",
                      ps.swing > 0
                        ? "text-green-600 dark:text-green-400"
                        : ps.swing < 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                    )}
                  >
                    {ps.swing > 0 ? "+" : ""}
                    {(ps.swing * 100).toFixed(1)} o.t.
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Per-okraj detail for selected party */}
          {selectedParty && selectedSwings && (
            <section className="mt-8">
              <h2 className="mb-1 font-heading text-lg font-semibold">
                {selectedParty.partyLabel} po okrajih
              </h2>
              <p className="mb-4 text-xs text-muted-foreground">
                Največji premiki v odstotnih točkah (top 20)
              </p>
              <div className="space-y-1">
                {selectedSwings.slice(0, 20).map((item) => {
                  const s = item.selectedSwing
                  return (
                    <div
                      key={item.rpeid}
                      className="flex items-center gap-3 text-xs"
                    >
                      <span className="w-32 shrink-0 truncate text-right md:w-44">
                        {item.name}
                      </span>
                      {/* Dumbbell */}
                      <div className="relative h-4 flex-1">
                        {/* 2022 dot */}
                        <div
                          className="absolute top-1/2 size-2 -translate-y-1/2 rounded-full bg-muted-foreground/40"
                          style={{ left: `${s.pct2022 * 200}%` }}
                        />
                        {/* Line */}
                        <div
                          className="absolute top-1/2 h-0.5 -translate-y-1/2"
                          style={{
                            backgroundColor: selectedParty.color,
                            left: `${Math.min(s.pct2022, s.pct2026) * 200}%`,
                            width: `${Math.abs(s.swing) * 200}%`,
                          }}
                        />
                        {/* 2026 dot */}
                        <div
                          className="absolute top-1/2 size-2.5 -translate-y-1/2 rounded-full"
                          style={{
                            backgroundColor: selectedParty.color,
                            left: `${s.pct2026 * 200}%`,
                          }}
                        />
                      </div>
                      <span
                        className={cn(
                          "w-16 shrink-0 text-right font-mono tabular-nums",
                          s.swing > 0
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        )}
                      >
                        {s.swing > 0 ? "+" : ""}
                        {(s.swing * 100).toFixed(1)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        /* Bloc view */
        <section className="mt-6">
          <h2 className="mb-4 font-heading text-lg font-semibold">
            Premiki po ideoloških blokih
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {swing.nationalBlocSwings.map((bs) => (
              <div
                key={bs.bloc}
                className="rounded-lg bg-card p-4 ring-1 ring-foreground/10"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="size-3 rounded-full"
                    style={{ backgroundColor: bs.color }}
                  />
                  <span className="text-xs font-medium">{bs.label}</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-heading text-2xl font-bold tabular-nums">
                    {(bs.pct2026 * 100).toFixed(1)}%
                  </span>
                  <span
                    className={cn(
                      "font-mono text-xs font-medium tabular-nums",
                      bs.swing > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {bs.swing > 0 ? "+" : ""}
                    {(bs.swing * 100).toFixed(1)} o.t.
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-muted-foreground">
                  2022: {(bs.pct2022 * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Wasted votes comparison */}
      <section className="mt-10">
        <h2 className="mb-4 font-heading text-lg font-semibold">
          Izgubljeni glasovi
        </h2>
        <p className="text-xs text-muted-foreground">
          Glasovi za stranke, ki niso presegle 4% praga.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">2022</p>
            <p className="font-heading text-2xl font-bold tabular-nums">
              {swing.wastedVotes2022.toLocaleString("sl-SI")}
            </p>
          </div>
          <div className="rounded-lg bg-card p-4 ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">2026</p>
            <p className="font-heading text-2xl font-bold tabular-nums">
              {swing.wastedVotes2026.toLocaleString("sl-SI")}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
