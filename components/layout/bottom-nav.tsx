"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChartBar,
  MapTrifold,
  Flag,
  DotsThree,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/", label: "Pregled", icon: ChartBar },
  { href: "/zemljevid", label: "Zemljevid", icon: MapTrifold },
  { href: "/stranke", label: "Stranke", icon: Flag },
  { href: "/udelezba", label: "Več", icon: DotsThree },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-sm md:hidden">
      <div className="flex h-14 items-stretch">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href)

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px]",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground"
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
      </div>
    </nav>
  )
}
