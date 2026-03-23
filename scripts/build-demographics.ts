/**
 * Demographics data pipeline.
 *
 * 1. Downloads občina (municipality) GeoJSON from GURS RPE
 * 2. Loads okraji TopoJSON boundaries
 * 3. Maps each občina centroid → containing okraj (point-in-polygon)
 * 4. Fetches SURS average wage data per občina
 * 5. Aggregates to okraj level using population-weighted averaging
 * 6. Outputs lib/data/static/okraj_demographics.json
 *
 * Run: bun run scripts/build-demographics.ts
 */

import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"
import { feature } from "topojson-client"
import type { Topology, Objects } from "topojson-specification"
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from "geojson"
import booleanPointInPolygon from "@turf/boolean-point-in-polygon"
import centroid from "@turf/centroid"

const ROOT = resolve(import.meta.dir, "..")
const OUTPUT_PATH = resolve(ROOT, "lib/data/static/okraj_demographics.json")

// ── Step 1: Load okraji boundaries ────────────────────────────────────

console.log("Loading okraji TopoJSON...")
const okrajiTopoRaw = readFileSync(
  resolve(ROOT, "public/geo/okraji.topojson"),
  "utf-8"
)
const okrajiTopo = JSON.parse(okrajiTopoRaw) as Topology<Objects>
const objectName = Object.keys(okrajiTopo.objects)[0]
const okrajiGeo = feature(
  okrajiTopo,
  okrajiTopo.objects[objectName]
) as FeatureCollection<Polygon | MultiPolygon>
console.log(`  ${okrajiGeo.features.length} okraji loaded`)

// ── Step 2: Download občina GeoJSON ───────────────────────────────────

console.log("Downloading občina GeoJSON from GURS RPE...")
const obcinaRes = await fetch(
  "https://raw.githubusercontent.com/stefanb/gurs-rpe/master/data/OB.geojson"
)
if (!obcinaRes.ok) throw new Error(`Failed to fetch občina GeoJSON: ${obcinaRes.status}`)
const obcinaGeo = (await obcinaRes.json()) as FeatureCollection
console.log(`  ${obcinaGeo.features.length} občine loaded`)

// ── Step 3: Map each občina centroid → okraj ──────────────────────────

interface ObcinaToOkraj {
  obcinaId: number
  obcinaName: string
  okrajVdvId: number
  area: number // km²
}

console.log("Computing občina → okraj mapping via centroids...")
const mappings: ObcinaToOkraj[] = []
let unmapped = 0

for (const obcina of obcinaGeo.features) {
  const obId = obcina.properties?.OB_ID as number
  const obName = obcina.properties?.OB_UIME as string
  const obArea = obcina.properties?.POV_KM2 as number

  const center = centroid(obcina as Feature<Polygon | MultiPolygon>)

  let foundOkraj: number | null = null
  for (const okraj of okrajiGeo.features) {
    if (
      booleanPointInPolygon(
        center.geometry.coordinates,
        okraj as Feature<Polygon | MultiPolygon>
      )
    ) {
      foundOkraj = okraj.properties?.VDV_ID as number
      break
    }
  }

  if (foundOkraj) {
    mappings.push({
      obcinaId: obId,
      obcinaName: obName,
      okrajVdvId: foundOkraj,
      area: obArea,
    })
  } else {
    unmapped++
    // Fallback: find nearest okraj (skip for now, log it)
    console.warn(`  ⚠ Občina ${obName} (${obId}) not in any okraj`)
  }
}

console.log(
  `  ${mappings.length} mapped, ${unmapped} unmapped`
)

// Build okraj → občina[] lookup
const okrajObcine = new Map<number, ObcinaToOkraj[]>()
for (const m of mappings) {
  const existing = okrajObcine.get(m.okrajVdvId) ?? []
  existing.push(m)
  okrajObcine.set(m.okrajVdvId, existing)
}

// ── Step 4: Fetch SURS wage data ──────────────────────────────────────

console.log("Fetching SURS wage data...")

// Get all občina codes from the table metadata
const metaRes = await fetch(
  "https://pxweb.stat.si/SiStatData/api/v1/sl/Data/0772615S.PX"
)
if (!metaRes.ok) throw new Error(`SURS metadata failed: ${metaRes.status}`)
const meta = await metaRes.json()

const obcineCodes = meta.variables.find(
  (v: { code: string }) => v.code === "OBČINE"
)?.values as string[]
const letoCodes = meta.variables.find(
  (v: { code: string }) => v.code === "LETO"
)?.values as string[]

// Get latest year
const latestYear = letoCodes[letoCodes.length - 1]
console.log(`  Using year: ${latestYear}`)

// Query for bruto wages, latest year, all občine
const queryBody = {
  query: [
    {
      code: "OBČINE",
      selection: {
        filter: "item",
        values: obcineCodes.filter((c: string) => c !== "0"), // exclude national total
      },
    },
    {
      code: "KAZALNIK",
      selection: {
        filter: "item",
        values: ["PLA-MESEC-BRUTO"],
      },
    },
    {
      code: "LETO",
      selection: {
        filter: "item",
        values: [latestYear],
      },
    },
  ],
  response: {
    format: "json",
  },
}

const wageRes = await fetch(
  "https://pxweb.stat.si/SiStatData/api/v1/sl/Data/0772615S.PX",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(queryBody),
  }
)
if (!wageRes.ok) {
  const text = await wageRes.text()
  throw new Error(`SURS wage query failed: ${wageRes.status} — ${text}`)
}
const wageData = await wageRes.json()

// Parse SURS response: { columns: [...], data: [{ key: [...], values: [...] }, ...] }
const wageMap = new Map<string, number>()
for (const row of wageData.data ?? []) {
  const obcinaCode = row.key[0] as string
  const value = parseFloat(row.values[0])
  if (!isNaN(value) && value > 0) {
    wageMap.set(obcinaCode, value)
  }
}
console.log(`  ${wageMap.size} občine with wage data`)

// ── Step 5: Aggregate to okraj level ──────────────────────────────────

interface OkrajDemographics {
  rpeid: string
  vdvId: number
  avgWage: number | null
  obcineCount: number
  obcineNames: string[]
}

console.log("Aggregating demographics to okraj level...")
const results: OkrajDemographics[] = []

for (const okraj of okrajiGeo.features) {
  const vdvId = okraj.properties?.VDV_ID as number
  const rpeid = String(vdvId)
  const obcine = okrajObcine.get(vdvId) ?? []

  // Population-weighted wage average using area as proxy for population
  // (we don't have per-občina population in this dataset, area is the best proxy)
  let weightedWageSum = 0
  let totalWeight = 0

  for (const ob of obcine) {
    const obCode = String(ob.obcinaId).padStart(3, "0")
    const wage = wageMap.get(obCode)
    if (wage) {
      const weight = ob.area // using area as population proxy
      weightedWageSum += wage * weight
      totalWeight += weight
    }
  }

  const avgWage = totalWeight > 0 ? Math.round(weightedWageSum / totalWeight) : null

  results.push({
    rpeid,
    vdvId,
    avgWage,
    obcineCount: obcine.length,
    obcineNames: obcine.map((o) => o.obcinaName),
  })
}

const withWage = results.filter((r) => r.avgWage !== null)
console.log(
  `  ${withWage.length}/${results.length} okraji with wage data`
)

// ── Step 6: Write output ──────────────────────────────────────────────

writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2))
console.log(`\nWritten to ${OUTPUT_PATH}`)
console.log("Done!")
