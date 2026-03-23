"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", label: "Pregled" },
  { href: "/zemljevid", label: "Zemljevid" },
  { href: "/stranke", label: "Stranke" },
  { href: "/koalicije", label: "Koalicije" },
  { href: "/primerjava", label: "Primerjava" },
  { href: "/analiza", label: "Analiza" },
  { href: "/udelezba", label: "Udeležba" },
  { href: "/o-projektu", label: "O projektu" },
]

export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 hidden border-b border-border/50 bg-background/80 backdrop-blur-sm md:block">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-heading text-sm font-bold tracking-tight"
        >
          <span className="inline-block h-4 w-8 -skew-x-12 rounded-sm bg-cgp-green" aria-hidden="true" />
          <span>Volitve 2026</span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs transition-colors hover:text-foreground",
                  isActive
                    ? "font-semibold text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {item.label}
              </Link>
            )
          })}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
