const numberFormatter = new Intl.NumberFormat("sl-SI")
const percentFormatter = new Intl.NumberFormat("sl-SI", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const percentShortFormatter = new Intl.NumberFormat("sl-SI", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

/** Format number with Slovenian locale: 1234567 → "1.234.567" */
export function formatNumber(n: number): string {
  return numberFormatter.format(n)
}

/** Format proportion as percentage: 0.2862 → "28,62 %" */
export function formatPercent(n: number): string {
  return percentFormatter.format(n)
}

/** Format proportion as short percentage: 0.2862 → "28,6 %" */
export function formatPercentShort(n: number): string {
  return percentShortFormatter.format(n)
}

/** Format date in Slovenian: "23. marec 2026" */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}
