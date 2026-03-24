"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChartBar,
  MapTrifold,
  Flag,
  ArrowsClockwise,
  Scales,
  ChartLineUp,
  UsersThree,
  Info,
  X,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const PRIMARY_TABS = [
  { href: "/", label: "Pregled", icon: ChartBar, ariaLabel: "Pregled rezultatov" },
  { href: "/zemljevid", label: "Zemljevid", icon: MapTrifold, ariaLabel: "Interaktivni zemljevid" },
  { href: "/stranke", label: "Stranke", icon: Flag, ariaLabel: "Rezultati po strankah" },
  { href: "/primerjava", label: "Primerjava", icon: ArrowsClockwise, ariaLabel: "Primerjava z 2022" },
]

const MORE_ITEMS = [
  { href: "/koalicije", label: "Koalicijski kalkulator", icon: Scales, desc: "Sestavite koalicijo in preverite večino" },
  { href: "/analiza", label: "Demografska analiza", icon: ChartLineUp, desc: "Plače, izobrazba, starost vs. glasovi" },
  { href: "/udelezba", label: "Volilna udeležba", icon: UsersThree, desc: "Rangiranje enot in okrajev po udeležbi" },
  { href: "/o-projektu", label: "O projektu", icon: Info, desc: "Viri podatkov, metodologija, tehnologija" },
]

export function BottomNav() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)

  const isMoreActive = MORE_ITEMS.some((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  )

  const close = useCallback(() => setSheetOpen(false), [])

  // Close on Escape
  useEffect(() => {
    if (!sheetOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false)
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [sheetOpen])

  return (
    <>
      {/* Bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
            onClick={close}
            aria-hidden="true"
          />

          {/* Sheet */}
          <div className="absolute inset-x-0 bottom-14 z-10 mx-2 animate-in slide-in-from-bottom-4 duration-200">
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-card shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/30 px-4 py-3">
                <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  Več
                </span>
                <button
                  type="button"
                  onClick={close}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Zapri"
                >
                  <X weight="bold" className="size-3.5" />
                </button>
              </div>

              {/* Items */}
              <div className="p-2">
                {MORE_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 transition-colors",
                        isActive
                          ? "bg-primary/10 text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-lg",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        <item.icon className="size-4.5" weight={isActive ? "fill" : "regular"} />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-sm", isActive && "font-semibold")}>
                          {item.label}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {item.desc}
                        </p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-sm md:hidden"
        role="navigation"
        aria-label="Glavna navigacija"
      >
        <div className="flex h-14 items-stretch">
          {PRIMARY_TABS.map((tab) => {
            const isActive =
              tab.href === "/"
                ? pathname === "/"
                : pathname.startsWith(tab.href)

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.ariaLabel}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
                  isActive
                    ? "font-semibold text-primary"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <tab.icon
                  className="size-5"
                  weight={isActive ? "fill" : "regular"}
                />
                <span>{tab.label}</span>
              </Link>
            )
          })}

          {/* More button */}
          <button
            type="button"
            onClick={() => setSheetOpen((prev) => !prev)}
            aria-label="Več možnosti"
            aria-expanded={sheetOpen}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors",
              isMoreActive || sheetOpen
                ? "font-semibold text-primary"
                : "text-muted-foreground active:text-foreground"
            )}
          >
            <svg className="size-5" viewBox="0 0 256 256" fill="currentColor">
              <circle cx="64" cy="128" r="20" />
              <circle cx="128" cy="128" r="20" />
              <circle cx="192" cy="128" r="20" />
            </svg>
            <span>Več</span>
          </button>
        </div>
      </nav>
    </>
  )
}
