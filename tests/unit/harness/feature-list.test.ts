import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import {
  FEATURE_LIST_PATH,
  summarizeFeatureList,
  validateFeatureList,
} from '../../../scripts/validate-feature-list'

const committed = (): unknown => JSON.parse(readFileSync(FEATURE_LIST_PATH, 'utf8'))

describe('feature_list.json (harness state)', () => {
  it('is valid: unique ids, WIP=1, passing has evidence, blocked has notes', () => {
    const list = validateFeatureList(committed())
    expect(list.features.length).toBeGreaterThan(0)
    expect(summarizeFeatureList(list)).toMatch(/VCR/)
  })

  it('rejects two in_progress features', () => {
    const list = validateFeatureList(committed())
    const [first, second] = list.features
    if (!first || !second) throw new Error('need at least two features')
    const broken = {
      ...list,
      features: list.features.map((f) =>
        f.id === first.id || f.id === second.id ? { ...f, status: 'in_progress' } : f,
      ),
    }
    expect(() => validateFeatureList(broken)).toThrow(/WIP=1/)
  })

  it('rejects passing without evidence and unlabelled verification steps', () => {
    const list = validateFeatureList(committed())
    const [first] = list.features
    if (!first) throw new Error('need at least one feature')
    const noEvidence = {
      ...list,
      features: [{ ...first, status: 'passing', evidence: [] }],
    }
    expect(() => validateFeatureList(noEvidence)).toThrow(/no evidence/)
    const unlabelled = {
      ...list,
      features: [{ ...first, verification: ['run the tests'] }],
    }
    expect(() => validateFeatureList(unlabelled)).toThrow(/L1: /)
  })
})
