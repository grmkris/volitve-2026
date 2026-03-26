import type { MetadataRoute } from "next"

import { partySlug } from "@/lib/data/constants"
import { NUM_ENOTE, MAX_OKRAJI_PER_ENOTA } from "@/lib/data/constants"
import { fetchRezultati } from "@/lib/data/fetchers"

const BASE_URL = "https://volitve2026.si"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rezultati = await fetchRezultati()

  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/stranke`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/koalicije`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/primerjava`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/udelezba`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/zemljevid`, changeFrequency: "daily", priority: 0.8 },
    {
      url: `${BASE_URL}/o-projektu`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  const partyPages: MetadataRoute.Sitemap = rezultati.slovenija.map((p) => ({
    url: `${BASE_URL}/stranka/${partySlug(p.knaz)}`,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }))

  const enotaPages: MetadataRoute.Sitemap = Array.from(
    { length: NUM_ENOTE },
    (_, i) => ({
      url: `${BASE_URL}/enota/${i + 1}`,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })
  )

  const okrajPages: MetadataRoute.Sitemap = []
  for (let e = 1; e <= NUM_ENOTE; e++) {
    for (let o = 1; o <= MAX_OKRAJI_PER_ENOTA; o++) {
      okrajPages.push({
        url: `${BASE_URL}/okraj/${e}/${o}`,
        changeFrequency: "daily",
        priority: 0.5,
      })
    }
  }

  return [...staticPages, ...partyPages, ...enotaPages, ...okrajPages]
}
