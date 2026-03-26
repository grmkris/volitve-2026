/**
 * Demographics data pipeline — fetches SURS data, maps to okraji.
 *
 * Data sources:
 * 1. SURS 0772615S — avg gross wages per občina (2023)
 * 2. SURS 05C4003S — population by age per občina (2025 H2)
 * 3. SURS 05G2014S — education level per občina (2025)
 * 4. SURS 0764721S — employed by education per občina (2025)
 * 5. GURS RPE — občina GeoJSON boundaries (for spatial join)
 * 6. Local okraji.topojson — okraj boundaries
 *
 * Run: bun run scripts/build-demographics.ts
 */

import { readFileSync, writeFileSync } from "fs"
import { resolve } from "path"

import booleanPointInPolygon from "@turf/boolean-point-in-polygon"
import centroid from "@turf/centroid"
import type { FeatureCollection, Feature, Polygon, MultiPolygon } from "geojson"
import { feature } from "topojson-client"
import type { Topology, Objects } from "topojson-specification"

const ROOT = resolve(import.meta.dir, "..")
const OUTPUT_PATH = resolve(ROOT, "lib/data/static/okraj_demographics.json")

// ── Helper: query SURS PxWeb API ──────────────────────────────────────

async function querySurs(
  tableId: string,
  query: { code: string; values: string[] }[]
): Promise<{ key: string[]; values: string[] }[]> {
  const body = {
    query: query.map((q) => ({
      code: q.code,
      selection: { filter: "item", values: q.values },
    })),
    response: { format: "json" },
  }

  const res = await fetch(
    `https://pxweb.stat.si/SiStatData/api/v1/sl/Data/${tableId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SURS ${tableId} query failed: ${res.status} — ${text}`)
  }

  const data = await res.json()
  return data.data ?? []
}

async function getSursMetadata(tableId: string) {
  const res = await fetch(
    `https://pxweb.stat.si/SiStatData/api/v1/sl/Data/${tableId}`
  )
  if (!res.ok) throw new Error(`SURS metadata ${tableId}: ${res.status}`)
  return res.json()
}

// ── Step 1: Load okraji boundaries ────────────────────────────────────

console.log("1. Loading okraji TopoJSON...")
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
console.log(`   ${okrajiGeo.features.length} okraji`)

// ── Step 2: Download and map občine to okraji ─────────────────────────

console.log("2. Downloading občina GeoJSON...")
const obcinaRes = await fetch(
  "https://raw.githubusercontent.com/stefanb/gurs-rpe/master/data/OB.geojson"
)
if (!obcinaRes.ok) throw new Error(`Failed: ${obcinaRes.status}`)
const obcinaGeo = (await obcinaRes.json()) as FeatureCollection
console.log(`   ${obcinaGeo.features.length} občine`)

console.log("   Mapping občine → okraji via centroids...")
const obcinaToOkraj = new Map<
  number,
  { okrajVdvId: number; area: number; name: string }
>()
const okrajObcine = new Map<
  number,
  { obcinaId: number; name: string; area: number }[]
>()

for (const ob of obcinaGeo.features) {
  const obId = ob.properties?.OB_ID as number
  const obName = ob.properties?.OB_UIME as string
  const obArea = ob.properties?.POV_KM2 as number
  const center = centroid(ob as Feature<Polygon | MultiPolygon>)

  for (const okraj of okrajiGeo.features) {
    if (
      booleanPointInPolygon(
        center.geometry.coordinates,
        okraj as Feature<Polygon | MultiPolygon>
      )
    ) {
      const vdvId = okraj.properties?.VDV_ID as number
      obcinaToOkraj.set(obId, { okrajVdvId: vdvId, area: obArea, name: obName })
      const existing = okrajObcine.get(vdvId) ?? []
      existing.push({ obcinaId: obId, name: obName, area: obArea })
      okrajObcine.set(vdvId, existing)
      break
    }
  }
}
console.log(`   ${obcinaToOkraj.size} občine mapped`)

// ── Step 3: Fetch SURS wages ──────────────────────────────────────────

console.log("3. Fetching SURS wages (0772615S)...")
const wageMeta = await getSursMetadata("0772615S.PX")
const wageObcine = wageMeta.variables.find(
  (v: { code: string }) => v.code === "OBČINE"
)?.values as string[]
const wageYears = wageMeta.variables.find(
  (v: { code: string }) => v.code === "LETO"
)?.values as string[]
const latestWageYear = wageYears[wageYears.length - 1]

const wageRows = await querySurs("0772615S.PX", [
  { code: "OBČINE", values: wageObcine.filter((c: string) => c !== "0") },
  { code: "KAZALNIK", values: ["PLA-MESEC-BRUTO"] },
  { code: "LETO", values: [latestWageYear] },
])
const wageMap = new Map<string, number>()
for (const row of wageRows) {
  const val = parseFloat(row.values[0])
  if (!isNaN(val) && val > 0) wageMap.set(row.key[0], val)
}
console.log(`   ${wageMap.size} občine with wages (${latestWageYear})`)

// ── Step 4: Fetch SURS population age ─────────────────────────────────

console.log("4. Fetching SURS population age (05C4003S)...")
const popMeta = await getSursMetadata("05C4003S.PX")
const popObcine = popMeta.variables.find(
  (v: { code: string }) => v.code === "OBČINE"
)?.values as string[]
const popPolletja = popMeta.variables.find(
  (v: { code: string }) => v.code === "POLLETJE"
)?.values as string[]
const latestPolletje = popPolletja[popPolletja.length - 1]

// Fetch total, 0-14, 15-64, 65+ age groups
// Ages 0-14: individual years "0"-"14"
// Total: "999"
// We need to aggregate, but simpler: fetch "999" (total) and compute from age brackets
// Actually, fetch specific ages and sum: 0-14, 15-64, 65-85+
const popRows = await querySurs("05C4003S.PX", [
  { code: "OBČINE", values: popObcine.filter((c: string) => c !== "0") },
  { code: "POLLETJE", values: [latestPolletje] },
  {
    code: "STAROST",
    values: [
      "999",
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
      "11",
      "12",
      "13",
      "14",
      "65",
      "66",
      "67",
      "68",
      "69",
      "70",
      "71",
      "72",
      "73",
      "74",
      "75",
      "76",
      "77",
      "78",
      "79",
      "80",
      "81",
      "82",
      "83",
      "84",
      "85",
    ],
  },
])

// Parse into per-občina aggregates
const popData = new Map<
  string,
  { total: number; young: number; elderly: number }
>()
for (const row of popRows) {
  const obCode = row.key[0]
  const ageCode = row.key[2]
  const val = parseInt(row.values[0])
  if (isNaN(val)) continue

  const existing = popData.get(obCode) ?? { total: 0, young: 0, elderly: 0 }
  if (ageCode === "999") {
    existing.total = val
  } else {
    const age = parseInt(ageCode)
    if (age <= 14) existing.young += val
    else if (age >= 65) existing.elderly += val
  }
  popData.set(obCode, existing)
}
console.log(
  `   ${popData.size} občine with population data (${latestPolletje})`
)

// ── Step 5: Fetch SURS education ──────────────────────────────────────

console.log("5. Fetching SURS education (05G2014S)...")
const eduMeta = await getSursMetadata("05G2014S.PX")
const eduObcine = eduMeta.variables.find(
  (v: { code: string }) => v.code === "OBČINE"
)?.values as string[]
const eduYears = eduMeta.variables.find(
  (v: { code: string }) => v.code === "LETO"
)?.values as string[]
const latestEduYear = eduYears[eduYears.length - 1]

// Fetch total (code "0") and higher ed (code "23" = Višješolska, visokošolska - Skupaj)
const eduRows = await querySurs("05G2014S.PX", [
  { code: "SPOL", values: ["0"] }, // both sexes
  { code: "OBČINE", values: eduObcine.filter((c: string) => c !== "0") },
  { code: "LETO", values: [latestEduYear] },
  { code: "IZOBRAZBA", values: ["0", "23"] }, // total + higher ed
])

const eduData = new Map<string, { total: number; higherEd: number }>()
for (const row of eduRows) {
  const obCode = row.key[1] // OBČINE is 2nd dimension
  const eduCode = row.key[3] // IZOBRAZBA is 4th
  const val = parseInt(row.values[0])
  if (isNaN(val)) continue

  const existing = eduData.get(obCode) ?? { total: 0, higherEd: 0 }
  if (eduCode === "0") existing.total = val
  else if (eduCode === "23") existing.higherEd = val
  eduData.set(obCode, existing)
}
console.log(`   ${eduData.size} občine with education data (${latestEduYear})`)

// ── Step 6: Fetch SURS employment ─────────────────────────────────────

console.log("6. Fetching SURS employment (0764721S)...")
const empMeta = await getSursMetadata("0764721S.PX")
const empObcine = empMeta.variables.find(
  (v: { code: string }) => v.code === "OBČINE"
)?.values as string[]
const empYears = empMeta.variables.find(
  (v: { code: string }) => v.code === "LETO"
)?.values as string[]
const latestEmpYear = empYears[empYears.length - 1]

const empRows = await querySurs("0764721S.PX", [
  { code: "OBČINE", values: empObcine.filter((c: string) => c !== "0") },
  { code: "LETO", values: [latestEmpYear] },
  { code: "DOSEŽENA IZOBRAZBA", values: ["0", "3"] }, // total + higher ed
  { code: "SPOL", values: ["0"] }, // both sexes
])

const empData = new Map<string, { total: number; higherEd: number }>()
for (const row of empRows) {
  const obCode = row.key[0]
  const eduCode = row.key[2]
  const val = parseInt(row.values[0])
  if (isNaN(val)) continue

  const existing = empData.get(obCode) ?? { total: 0, higherEd: 0 }
  if (eduCode === "0") existing.total = val
  else if (eduCode === "3") existing.higherEd = val
  empData.set(obCode, existing)
}
console.log(`   ${empData.size} občine with employment data (${latestEmpYear})`)

// ── Step 7: Aggregate to okraj level ──────────────────────────────────

console.log("7. Aggregating to okraj level...")

interface OkrajDemographics {
  rpeid: string
  vdvId: number
  avgWage: number | null
  population: number | null
  pctYoung: number | null
  pctWorking: number | null
  pctElderly: number | null
  pctHigherEd: number | null
  employed: number | null
  pctEmployedHigherEd: number | null
  obcineCount: number
  obcineNames: string[]
}

const results: OkrajDemographics[] = []

for (const okraj of okrajiGeo.features) {
  const vdvId = okraj.properties?.VDV_ID as number
  const rpeid = String(vdvId)
  const obcine = okrajObcine.get(vdvId) ?? []

  let wageWeightedSum = 0,
    wageWeightTotal = 0
  let popTotal = 0,
    popYoung = 0,
    popElderly = 0
  let eduTotal = 0,
    eduHigher = 0
  let empTotal = 0,
    empHigher = 0

  for (const ob of obcine) {
    const obCode = String(ob.obcinaId).padStart(3, "0")

    // Wages (area-weighted since we don't have per-občina population from wage table)
    const wage = wageMap.get(obCode)
    if (wage) {
      wageWeightedSum += wage * ob.area
      wageWeightTotal += ob.area
    }

    // Population (direct sum — additive)
    const pop = popData.get(obCode)
    if (pop) {
      popTotal += pop.total
      popYoung += pop.young
      popElderly += pop.elderly
    }

    // Education (direct sum — additive)
    const edu = eduData.get(obCode)
    if (edu) {
      eduTotal += edu.total
      eduHigher += edu.higherEd
    }

    // Employment (direct sum — additive)
    const emp = empData.get(obCode)
    if (emp) {
      empTotal += emp.total
      empHigher += emp.higherEd
    }
  }

  results.push({
    rpeid,
    vdvId,
    avgWage:
      wageWeightTotal > 0
        ? Math.round(wageWeightedSum / wageWeightTotal)
        : null,
    population: popTotal > 0 ? popTotal : null,
    pctYoung:
      popTotal > 0 ? Math.round((popYoung / popTotal) * 1000) / 1000 : null,
    pctWorking:
      popTotal > 0
        ? Math.round(((popTotal - popYoung - popElderly) / popTotal) * 1000) /
          1000
        : null,
    pctElderly:
      popTotal > 0 ? Math.round((popElderly / popTotal) * 1000) / 1000 : null,
    pctHigherEd:
      eduTotal > 0 ? Math.round((eduHigher / eduTotal) * 1000) / 1000 : null,
    employed: empTotal > 0 ? empTotal : null,
    pctEmployedHigherEd:
      empTotal > 0 ? Math.round((empHigher / empTotal) * 1000) / 1000 : null,
    obcineCount: obcine.length,
    obcineNames: obcine.map((o) => o.name),
  })
}

const withData = results.filter((r) => r.population !== null)
console.log(`   ${withData.length}/${results.length} okraji with data`)

// ── Step 8: Write output ──────────────────────────────────────────────

writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2))
console.log(`\nWritten to ${OUTPUT_PATH}`)
console.log("Done!")
