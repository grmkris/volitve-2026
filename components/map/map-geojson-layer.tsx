"use client"

import { useEffect, useRef } from "react"
import type { ExpressionSpecification } from "maplibre-gl"
import type { FeatureCollection, Geometry } from "geojson"
import { useMap } from "@/components/ui/map"

interface MapGeoJSONLayerProps {
  id: string
  data: FeatureCollection<Geometry>
  fillColor: string | ExpressionSpecification
  fillOpacity?: number
  lineColor?: string
  lineWidth?: number
  lineOpacity?: number
  minZoom?: number
  maxZoom?: number
  visible?: boolean
  onClick?: (feature: GeoJSON.Feature) => void
  onHover?: (feature: GeoJSON.Feature | null) => void
}

export function MapGeoJSONLayer({
  id,
  data,
  fillColor,
  fillOpacity = 0.7,
  lineColor = "rgba(255,255,255,0.5)",
  lineWidth = 1,
  lineOpacity = 1,
  minZoom,
  maxZoom,
  visible = true,
  onClick,
  onHover,
}: MapGeoJSONLayerProps) {
  const { map } = useMap()
  const addedRef = useRef(false)
  const onClickRef = useRef(onClick)
  const onHoverRef = useRef(onHover)
  onClickRef.current = onClick
  onHoverRef.current = onHover

  const sourceId = `${id}-source`
  const fillLayerId = `${id}-fill`
  const lineLayerId = `${id}-line`

  // Add source + layers — decoupled from context isLoaded to avoid
  // infinite spinner when Carto basemap style takes long to load
  useEffect(() => {
    if (!map || addedRef.current) return

    let hoveredId: string | number | null = null
    const cleanupFns: (() => void)[] = []

    function addLayers() {
      if (!map || addedRef.current) return
      try {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: "geojson",
            data,
            promoteId: "VDV_ID",
          })
        }
        if (!map.getLayer(fillLayerId)) {
          map.addLayer({
            id: fillLayerId,
            type: "fill",
            source: sourceId,
            paint: {
              "fill-color": fillColor as string,
              "fill-opacity": fillOpacity,
            },
            ...(minZoom != null ? { minzoom: minZoom } : {}),
            ...(maxZoom != null ? { maxzoom: maxZoom } : {}),
            layout: { visibility: visible ? "visible" : "none" },
          })
        }
        if (!map.getLayer(lineLayerId)) {
          map.addLayer({
            id: lineLayerId,
            type: "line",
            source: sourceId,
            paint: {
              "line-color": lineColor,
              "line-width": lineWidth,
              "line-opacity": lineOpacity,
            },
            ...(minZoom != null ? { minzoom: minZoom } : {}),
            ...(maxZoom != null ? { maxzoom: maxZoom } : {}),
            layout: { visibility: visible ? "visible" : "none" },
          })
        }

        const handleClick = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          const feat = e.features?.[0]
          if (feat) onClickRef.current?.(feat as unknown as GeoJSON.Feature)
        }
        const handleMouseMove = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          const feat = e.features?.[0]
          if (feat) {
            try {
              map.getCanvas().style.cursor = "pointer"
              if (hoveredId !== null) map.setFeatureState({ source: sourceId, id: hoveredId }, { hover: false })
              hoveredId = feat.id ?? null
              if (hoveredId !== null) map.setFeatureState({ source: sourceId, id: hoveredId }, { hover: true })
            } catch { /* map destroyed */ }
            onHoverRef.current?.(feat as unknown as GeoJSON.Feature)
          }
        }
        const handleMouseLeave = () => {
          try {
            map.getCanvas().style.cursor = ""
            if (hoveredId !== null) {
              map.setFeatureState({ source: sourceId, id: hoveredId }, { hover: false })
              hoveredId = null
            }
          } catch { /* map destroyed */ }
          onHoverRef.current?.(null)
        }

        map.on("click", fillLayerId, handleClick)
        map.on("mousemove", fillLayerId, handleMouseMove)
        map.on("mouseleave", fillLayerId, handleMouseLeave)

        addedRef.current = true

        cleanupFns.push(() => {
          try {
            map.off("click", fillLayerId, handleClick)
            map.off("mousemove", fillLayerId, handleMouseMove)
            map.off("mouseleave", fillLayerId, handleMouseLeave)
            if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId)
            if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId)
            if (map.getSource(sourceId)) map.removeSource(sourceId)
          } catch { /* map destroyed */ }
          addedRef.current = false
        })
      } catch { /* style not ready yet */ }
    }

    // Try immediately if style is ready, otherwise wait for styledata event
    if (map.isStyleLoaded()) {
      addLayers()
    } else {
      const onStyleReady = () => { if (!addedRef.current) addLayers() }
      map.once("styledata", onStyleReady)
      // Fallback: retry after delay
      const timer = setTimeout(() => {
        if (!addedRef.current) addLayers()
      }, 3000)
      cleanupFns.push(() => {
        map.off("styledata", onStyleReady)
        clearTimeout(timer)
      })
    }

    return () => { cleanupFns.forEach((fn) => fn()) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map])

  // Update data
  useEffect(() => {
    if (!map || !addedRef.current) return
    try {
      const source = map.getSource(sourceId) as maplibregl.GeoJSONSource | undefined
      if (source) source.setData(data)
    } catch { /* map destroyed */ }
  }, [map, data, sourceId])

  // Update fill color
  useEffect(() => {
    if (!map || !addedRef.current) return
    try {
      if (map.getLayer(fillLayerId)) {
        map.setPaintProperty(fillLayerId, "fill-color", fillColor)
      }
    } catch { /* map destroyed */ }
  }, [map, fillColor, fillLayerId])

  // Update visibility
  useEffect(() => {
    if (!map || !addedRef.current) return
    try {
      const vis = visible ? "visible" : "none"
      if (map.getLayer(fillLayerId)) {
        map.setLayoutProperty(fillLayerId, "visibility", vis)
      }
      if (map.getLayer(lineLayerId)) {
        map.setLayoutProperty(lineLayerId, "visibility", vis)
      }
    } catch { /* map destroyed */ }
  }, [map, visible, fillLayerId, lineLayerId])

  return null
}
