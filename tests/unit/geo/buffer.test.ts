import { area } from '@turf/turf'
import { describe, expect, it } from 'vitest'

import {
  formatBbox,
  watchAreaBbox3067,
  watchAreaBbox4326,
  watchAreaPolygon,
} from '@/lib/geo/buffer'
import { toEtrs89Tm35fin } from '@/lib/geo/crs'

const center: [number, number] = [25.0, 62.0]

describe('buffer', () => {
  it('builds a polygon whose area is close to πr²', () => {
    const r = 1000
    const polygon = watchAreaPolygon(center, r)
    const expected = Math.PI * r * r
    expect(Math.abs(area(polygon) - expected) / expected).toBeLessThan(0.02)
  })

  it('bbox (WGS 84) contains the center', () => {
    const [minLon, minLat, maxLon, maxLat] = watchAreaBbox4326(center, 500)
    expect(minLon).toBeLessThan(center[0])
    expect(maxLon).toBeGreaterThan(center[0])
    expect(minLat).toBeLessThan(center[1])
    expect(maxLat).toBeGreaterThan(center[1])
  })

  it('bbox (EPSG:3067) is exactly radius metres around the projected center', () => {
    const [e, n] = toEtrs89Tm35fin(center)
    const [minE, minN, maxE, maxN] = watchAreaBbox3067(center, 250)
    expect(minE).toBeCloseTo(e - 250, 6)
    expect(maxE).toBeCloseTo(e + 250, 6)
    expect(minN).toBeCloseTo(n - 250, 6)
    expect(maxN).toBeCloseTo(n + 250, 6)
  })

  it('formats a bbox for the WFS query string', () => {
    expect(formatBbox([1, 2.5, 3.123456, 4])).toBe('1.00,2.50,3.12,4.00')
  })
})
