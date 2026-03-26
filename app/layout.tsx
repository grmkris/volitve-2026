import type { Metadata } from "next"
import { Geist_Mono, Source_Serif_4 } from "next/font/google"
import Script from "next/script"

import "./globals.css"
import { BottomNav } from "@/components/layout/bottom-nav"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { QueryProvider } from "@/components/query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"

const sourceSerif = Source_Serif_4({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Volitve v Državni zbor 2026 — Rezultati",
  description:
    "Interaktivna vizualizacija rezultatov parlamentarnih volitev v Sloveniji 2026. Preglejte rezultate po volilnih enotah, okrajih in voliščih.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="sl"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        sourceSerif.variable
      )}
    >
      <body>
        <ThemeProvider>
          <QueryProvider>
            <SiteHeader />
            <main className="min-h-svh pb-14 md:pb-0">{children}</main>
            <SiteFooter />
            <BottomNav />
          </QueryProvider>
        </ThemeProvider>
        {process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN && (
          <Script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${process.env.NEXT_PUBLIC_CF_ANALYTICS_TOKEN}"}`}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
