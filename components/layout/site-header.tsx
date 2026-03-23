import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

const NAV_ITEMS = [
  { href: "/", label: "Pregled" },
  { href: "/zemljevid", label: "Zemljevid" },
  { href: "/stranke", label: "Stranke" },
  { href: "/udelezba", label: "Udeležba" },
  { href: "/o-projektu", label: "O projektu" },
]

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 hidden border-b border-border/50 bg-background/80 backdrop-blur-sm md:block">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-heading text-sm font-bold tracking-tight"
        >
          Volitve 2026
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-2">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  )
}
