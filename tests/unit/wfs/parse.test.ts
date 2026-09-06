import { describe, expect, it } from 'vitest'

import { hashGeometry, parseFeatureCollection, toDeclarationRecords } from '@/lib/wfs/parse'
import { loadWfsFixture } from '../../helpers/wfs-fixture'

describe('wfs parse', () => {
  const fixture = loadWfsFixture()

  it('validates the recorded WFS response against the schema', () => {
    const fc = parseFeatureCollection(fixture)
    expect(fc.features).toHaveLength(2)
    expect(fc.crs?.properties.name).toBe('urn:ogc:def:crs:EPSG::3067')
  })

  it('rejects responses that drift from the contract', () => {
    const broken = {
      ...fixture,
      features: [{ ...fixture.features[0], geometry: { type: 'Point', coordinates: [1, 2] } }],
    }
    expect(() => parseFeatureCollection(broken)).toThrow()
    expect(() => parseFeatureCollection({ type: 'Nope' })).toThrow()
  })

  it('normalises features into declaration records', () => {
    const records = toDeclarationRecords(parseFeatureCollection(fixture))
    expect(records.map(({ geometry: _g, properties: _p, ...rest }) => rest)).toMatchSnapshot()
  })

  it('hashes geometry deterministically and detects changes', () => {
    const geometry = fixture.features[0]!.geometry
    const same = hashGeometry(structuredClone(geometry))
    expect(hashGeometry(geometry)).toBe(same)
    const moved = structuredClone(geometry)
    const ring = moved.coordinates[0] as number[][]
    ring[0]![0]! += 1
    expect(hashGeometry(moved)).not.toBe(same)
  })
})
