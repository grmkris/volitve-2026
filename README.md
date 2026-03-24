# Volitve 2026 — Rezultati

Interaktivna vizualizacija rezultatov parlamentarnih volitev v Državni zbor Republike Slovenije 2026.

## Funkcionalnosti

- **Pregled rezultatov** — parlament (hemicikl), stranke, sedeži, udeležba
- **Interaktivni zemljevid** — volilne enote in okraji, obarvani po zmagovalcu
- **Stranke** — podrobni rezultati po strankah z razčlenitvijo po enotah
- **Koalicijski kalkulator** — interaktivno sestavljanje koalicij
- **Primerjava z 2022** — analiza premikov po strankah in ideoloških blokih
- **Demografska analiza** — korelacija med plačami, starostjo, izobrazbo, zaposlenostjo in volilnimi rezultati (SURS podatki)
- **Udeležba** — rangiranje enot in okrajev po volilni udeležbi
- **Drill-down** — od nacionalne ravni do posameznega volišča z zemljevidom volišč

## Viri podatkov

- **Volilni rezultati 2026:** [Državna volilna komisija (DVK)](https://volitve.dvk-rs.si/dz2026/) — JSON API
- **Volilni rezultati 2022:** [Arhiv DVK](https://www.dvk-rs.si/arhivi/dz2022/) — za primerjavo premikov
- **Geografske meje:** [Register prostorskih enot (GURS RPE)](https://github.com/stefanb/gurs-rpe) — CC-BY 4.0, Geodetska uprava RS
- **Demografski podatki:** [Statistični urad RS (SURS)](https://pxweb.stat.si/SiStat/sl) — plače (2023), prebivalstvo po starosti (2025), izobrazba (2025), zaposlenost (2025)

## Tehnični sklad

- [Next.js](https://nextjs.org/) 16 + [React](https://react.dev/) 19
- [MapLibre GL JS](https://maplibre.org/) za interaktivne zemljevide
- [Tailwind CSS](https://tailwindcss.com/) 4 + [shadcn/ui](https://ui.shadcn.com/) komponente
- [TypeScript](https://www.typescriptlang.org/) z imenovanimi tipi (branded IDs)
- [Bun](https://bun.sh/) za upravljanje paketov in izvajanje

## Lokalni razvoj

```bash
bun install
bun dev
```

Aplikacija bo dostopna na `http://localhost:3000`.

## Struktura projekta

```
app/              — Next.js strani (pregled, stranke, enote, okraji, zemljevid, koalicije, primerjava)
components/       — React komponente (kartice, grafi, zemljevid, parlament, layout)
lib/data/         — podatkovni tipi, transformacije, pridobivanje podatkov, konstante
lib/data/static/  — statični JSON (DVK rezultati kot fallback)
lib/geo/          — nalaganje TopoJSON geografskih podatkov
public/geo/       — TopoJSON datoteke (enote, okraji, volišča)
```

## Licenca

Koda: MIT. Podatki DVK in GURS RPE so objavljeni pod [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).
