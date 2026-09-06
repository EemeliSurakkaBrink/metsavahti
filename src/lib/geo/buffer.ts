import { bbox as turfBbox, buffer as turfBuffer, point as turfPoint } from '@turf/turf'
import type { Feature, Polygon } from 'geojson'

import { type EastNorth, type LonLat, to3067 } from '@/lib/geo/crs'

/** [minX, minY, maxX, maxY] */
export type Bbox = [number, number, number, number]

/** Circle-ish polygon (WGS 84) around `center` with radius `radiusM` metres. */
export function watchAreaPolygon(center: LonLat, radiusM: number): Feature<Polygon> {
  const polygon = turfBuffer(turfPoint(center), radiusM, { units: 'meters', steps: 32 })
  if (!polygon) throw new Error('Failed to buffer point')
  return polygon as Feature<Polygon>
}

/** Bounding box of the watch area in WGS 84. */
export function watchAreaBbox4326(center: LonLat, radiusM: number): Bbox {
  return turfBbox(watchAreaPolygon(center, radiusM)) as Bbox
}

/**
 * Axis-aligned bounding box in EPSG:3067 metres — what we send to the WFS `bbox` parameter.
 * Computed directly in the projected CRS, so it is exact.
 */
export function watchAreaBbox3067(center: LonLat, radiusM: number): Bbox {
  const [e, n]: EastNorth = to3067(center)
  return [e - radiusM, n - radiusM, e + radiusM, n + radiusM]
}

export function formatBbox(bbox: Bbox): string {
  return bbox.map((v) => v.toFixed(2)).join(',')
}
