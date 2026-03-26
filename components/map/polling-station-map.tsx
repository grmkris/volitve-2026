"use client"

import { useQuery } from "@tanstack/react-query"
import type { FeatureCollection, Geometry } from "geojson"
import type { ExpressionSpecification } from "maplibre-gl"
import { useMemo } from "react"

import { Map, MapControls } from "@/components/ui/map"
import { loadTopoJSON } from "@/lib/geo/loader"

import { MapGeoJSONLayer } from "./map-geojson-layer"

interface StationInfo {
  vdvId: number
  winnerId: number
  name: string
}

interface PollingStationMapProps {
  enotaSt: number
  okrajSt: number
  stations: StationInfo[]
  partyMap: Record<number, { color: string; abbrev: string }>
  className?: string
}

export function PollingStationMap({
  enotaSt,
  okrajSt,
  stations,
  partyMap,
  className,
}: PollingStationMapProps) {
  const { data: allVolisca } = useQuery({
    queryKey: ["volisca-topojson"],
    queryFn: () => loadTopoJSON("/geo/volisca.topojson"),
    staleTime: Infinity,
  })

  // Filter to current okraj using N8 prefix pattern
  const prefix = `${String(enotaSt).padStart(2, "0")}${String(okrajSt).padStart(2, "0")}`

  const filteredGeo = useMemo((): FeatureCollection<Geometry> | null => {
    if (!allVolisca) return null
    const features = allVolisca.features.filter((f) => {
      const n8 = String(f.properties?.N8 ?? "")
      return n8.startsWith(prefix)
    })
    return { type: "FeatureCollection", features }
  }, [allVolisca, prefix])

  // Build color expression from station winner data
  const colorExpr = useMemo((): string | ExpressionSpecification => {
    const entries: (string | number)[] = []
    for (const s of stations) {
      const party = partyMap[s.winnerId]
      if (party) {
        entries.push(s.vdvId, party.color)
      }
    }
    if (entries.length === 0) {
      return "#cccccc"
    }
    return [
      "match",
      ["get", "VDV_ID"],
      ...entries,
      "#cccccc",
    ] as unknown as ExpressionSpecification
  }, [stations, partyMap])

  if (!filteredGeo || filteredGeo.features.length === 0) {
    return null
  }

  // Compute center from first feature for initial map position
  const bounds = filteredGeo.features.reduce(
    (acc, f) => {
      const coords =
        f.geometry.type === "Polygon"
          ? f.geometry.coordinates[0]
          : f.geometry.type === "MultiPolygon"
            ? f.geometry.coordinates[0]?.[0]
            : undefined
      if (!coords) return acc
      for (const coord of coords) {
        const lng = coord[0]
        const lat = coord[1]
        if (lng === undefined || lat === undefined) continue
        acc.minLng = Math.min(acc.minLng, lng)
        acc.maxLng = Math.max(acc.maxLng, lng)
        acc.minLat = Math.min(acc.minLat, lat)
        acc.maxLat = Math.max(acc.maxLat, lat)
      }
      return acc
    },
    { minLng: 180, maxLng: -180, minLat: 90, maxLat: -90 }
  )

  const centerLng = (bounds.minLng + bounds.maxLng) / 2
  const centerLat = (bounds.minLat + bounds.maxLat) / 2

  return (
    <div className={className}>
      <Map
        center={[centerLng, centerLat]}
        zoom={11}
        className="h-64 w-full rounded-lg md:h-80"
      >
        <MapGeoJSONLayer
          id="volisca"
          data={filteredGeo}
          fillColor={colorExpr}
          fillOpacity={0.7}
          lineColor="rgba(255,255,255,0.6)"
          lineWidth={1}
        />
        <MapControls showZoom position="bottom-right" />
      </Map>
    </div>
  )
}
