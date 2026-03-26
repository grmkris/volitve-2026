"use client"

import { ShareNetwork, Check } from "@phosphor-icons/react"
import { useSearchParams, useRouter } from "next/navigation"
import { useMemo, useCallback } from "react"

import { TOTAL_SEATS } from "@/lib/data/constants"
import { formatPercent, formatNumber } from "@/lib/data/format"
import type { PartyId } from "@/lib/data/ids"
import staticKandidati from "@/lib/data/static/kandidati_rezultat.json"
import staticRezultati from "@/lib/data/static/rezultati.json"
import staticUdelezba from "@/lib/data/static/udelezba.json"
import { buildNationalResults } from "@/lib/data/transforms"
import type {
  Party,
  RawRezultati,
  RawUdelezba,
  RawKandidatiRezultat,
} from "@/lib/data/types"
import { cn } from "@/lib/utils"

const MAJORITY = Math.ceil(TOTAL_SEATS / 2)

export default function KoalicijePage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const parties = useMemo(() => {
    const results = buildNationalResults({
      rezultati: staticRezultati as RawRezultati,
      udelezba: staticUdelezba as RawUdelezba,
      kandidati: staticKandidati as RawKandidatiRezultat,
    })
    return results.parliamentaryParties
  }, [])

  // Read selected party IDs from URL
  const selected = useMemo(() => {
    const param = searchParams.get("stranke")
    if (!param) return new Set<number>()
    return new Set(param.split(",").map(Number).filter(Boolean))
  }, [searchParams])

  const toggleParty = useCallback(
    (id: PartyId) => {
      const next = new Set(selected)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      const params = new URLSearchParams()
      if (next.size > 0) {
        params.set("stranke", [...next].join(","))
      }
      const qs = params.toString()
      router.replace(qs ? `?${qs}` : "/koalicije", { scroll: false })
    },
    [selected, router]
  )

  const totalSeats = useMemo(
    () =>
      parties.reduce((sum, p) => (selected.has(p.id) ? sum + p.seats : sum), 0),
    [parties, selected]
  )

  const totalVotes = useMemo(
    () =>
      parties.reduce((sum, p) => (selected.has(p.id) ? sum + p.votes : sum), 0),
    [parties, selected]
  )

  const hasMajority = totalSeats >= MAJORITY

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // fallback: do nothing
    }
  }, [])

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
      <h1 className="font-heading text-xl font-bold md:text-3xl">
        Koalicijski kalkulator
      </h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Izberite stranke in preverite ali dosežejo parlamentarno večino (
        {MAJORITY} sedežev).
      </p>

      {/* Seat counter */}
      <div className="mt-6 rounded-lg bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex items-baseline justify-between">
          <div>
            <span
              className={cn(
                "font-heading text-4xl font-bold tabular-nums md:text-5xl",
                hasMajority ? "text-primary" : ""
              )}
            >
              {totalSeats}
            </span>
            <span className="ml-2 text-sm text-muted-foreground">
              / {MAJORITY} za večino
            </span>
          </div>
          <div className="flex items-center gap-3">
            {hasMajority && (
              <span className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground">
                <Check weight="bold" className="size-3" />
                Večina
              </span>
            )}
            {selected.size > 0 && (
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <ShareNetwork className="size-3.5" />
                Deli
              </button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{
              width: `${Math.min((totalSeats / TOTAL_SEATS) * 100, 100)}%`,
            }}
          />
          {/* Majority line */}
          <div
            className="relative -mt-3 h-3 border-r-2 border-foreground/40"
            style={{ width: `${(MAJORITY / TOTAL_SEATS) * 100}%` }}
          />
        </div>

        {/* Selected party breakdown */}
        {selected.size > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {parties
              .filter((p) => selected.has(p.id))
              .map((p) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {p.abbrev} {p.seats}
                </span>
              ))}
            <span className="self-center text-xs text-muted-foreground">
              = {formatNumber(totalVotes)} glasov
            </span>
          </div>
        )}
      </div>

      {/* Party grid */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {parties.map((party) => (
          <PartyToggle
            key={party.id}
            party={party}
            isSelected={selected.has(party.id)}
            onToggle={toggleParty}
          />
        ))}
      </div>
    </div>
  )
}

function PartyToggle({
  party,
  isSelected,
  onToggle,
}: {
  party: Party
  isSelected: boolean
  onToggle: (id: PartyId) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(party.id)}
      className={cn(
        "relative overflow-hidden rounded-lg p-4 text-left ring-1 transition-all",
        isSelected
          ? "bg-card ring-2 ring-foreground/30 shadow-sm"
          : "bg-card ring-foreground/10 opacity-70 hover:opacity-100"
      )}
    >
      {/* Accent bar */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 w-1 transition-all",
          isSelected ? "w-1.5" : ""
        )}
        style={{ backgroundColor: party.color }}
      />

      <div className="flex items-center justify-between">
        <div className="ml-2">
          <p className="text-xs font-medium">{party.abbrev}</p>
          <p className="text-[10px] text-muted-foreground">{party.name}</p>
        </div>
        <div className="text-right">
          <p className="font-heading text-lg font-bold tabular-nums">
            {party.seats}
          </p>
          <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {formatPercent(party.percentage)}
          </p>
        </div>
      </div>

      {/* Check indicator */}
      {isSelected && (
        <div
          className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full text-white"
          style={{ backgroundColor: party.color }}
        >
          <Check weight="bold" className="size-2.5" />
        </div>
      )}
    </button>
  )
}
