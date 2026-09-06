import { describe, expect, it } from 'vitest'

import { isInsideFinland, toEtrs89Tm35fin, toWgs84 } from '@/lib/geo/crs'

describe('crs', () => {
  // Helsinki Cathedral (WGS 84) ≈ E 386 200, N 6 672 500 in ETRS-TM35FIN
  const helsinki: [number, number] = [24.9522, 60.1704]

  it('projects WGS 84 to ETRS-TM35FIN metres', () => {
    const [e, n] = toEtrs89Tm35fin(helsinki)
    expect(e).toBeGreaterThan(385_000)
    expect(e).toBeLessThan(387_500)
    expect(n).toBeGreaterThan(6_671_500)
    expect(n).toBeLessThan(6_673_500)
  })

  it('round-trips within a millimetre', () => {
    const [lon, lat] = toWgs84(toEtrs89Tm35fin(helsinki))
    expect(lon).toBeCloseTo(helsinki[0], 7)
    expect(lat).toBeCloseTo(helsinki[1], 7)
  })

  it('knows roughly where Finland is', () => {
    expect(isInsideFinland(toEtrs89Tm35fin(helsinki))).toBe(true)
    expect(isInsideFinland(toEtrs89Tm35fin([2.35, 48.85]))).toBe(false) // Paris
  })
})
