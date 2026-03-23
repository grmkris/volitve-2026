"use client"

import { useTheme } from "next-themes"
import { Moon, Sun } from "@phosphor-icons/react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
      aria-label="Preklopi temo"
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </button>
  )
}
