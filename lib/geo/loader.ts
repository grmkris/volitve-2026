import { feature } from "topojson-client"
import type { Topology, Objects } from "topojson-specification"
import type { FeatureCollection, Geometry } from "geojson"

const cache = new Map<string, FeatureCollection>()

/**
 * Load a TopoJSON file from a URL and convert to GeoJSON FeatureCollection.
 * Results are cached in memory to avoid re-fetching.
 */
export async function loadTopoJSON(
  url: string
): Promise<FeatureCollection<Geometry>> {
  const cached = cache.get(url)
  if (cached) return cached

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`)

  const topology = (await res.json()) as Topology<Objects>
  const objectName = Object.keys(topology.objects)[0]
  const geojson = feature(
    topology,
    topology.objects[objectName]
  ) as FeatureCollection<Geometry>

  cache.set(url, geojson)
  return geojson
}
