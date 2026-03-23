import type { Metadata } from "next"
import Script from "next/script"
import { Geist_Mono, Inter, Roboto_Slab } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { QueryProvider } from "@/components/query-provider"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { BottomNav } from "@/components/layout/bottom-nav"
import { cn } from "@/lib/utils"

const robotoSlabHeading = Roboto_Slab({
  subsets: ["latin"],
  variable: "--font-heading",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

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
        inter.variable,
        robotoSlabHeading.variable
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
        <Script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "4fe38d8733c841ad9cc245011429b409"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  )
}
