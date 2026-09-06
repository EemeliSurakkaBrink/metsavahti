/**
 * Validate `feature_list.json`, the harness feature tracker (see AGENTS.md → Working rules).
 *   pnpm harness:check
 *
 * Rules enforced here so that neither a human nor an agent can leave the list in an
 * inconsistent state: unique `F-NNN` ids, at most one `in_progress` feature (WIP=1),
 * `passing` requires recorded evidence, `blocked` requires a note, every verification
 * step names its layer (`L1:` static, `L2:` runtime, `L3:` end-to-end, or `manual:`).
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { z } from 'zod'

export const featureStatuses = ['not_started', 'in_progress', 'blocked', 'passing'] as const
export type FeatureStatus = (typeof featureStatuses)[number]

const verificationStep = z
  .string()
  .regex(/^(L1|L2|L3|manual): \S.*$/, 'must start with "L1: ", "L2: ", "L3: " or "manual: "')

const featureSchema = z.object({
  id: z.string().regex(/^F-\d{3}$/, 'id must look like F-001'),
  priority: z.number().int().nonnegative(),
  area: z.string().min(1),
  title: z.string().min(1),
  user_visible_behavior: z.string().min(1),
  status: z.enum(featureStatuses),
  verification: z.array(verificationStep).min(1),
  evidence: z.array(z.string().min(1)),
  notes: z.string(),
})

export const featureListSchema = z
  .object({
    project: z.string().min(1),
    last_updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'last_updated must be YYYY-MM-DD'),
    rules: z.object({
      single_active_feature: z.literal(true),
      passing_requires_evidence: z.literal(true),
      do_not_skip_verification: z.literal(true),
    }),
    status_legend: z.record(z.enum(featureStatuses), z.string().min(1)),
    features: z.array(featureSchema).min(1),
  })
  .superRefine((list, ctx) => {
    const seen = new Set<string>()
    list.features.forEach((feature, index) => {
      const at = (field: string) => ['features', index, field]
      if (seen.has(feature.id)) {
        ctx.addIssue({ code: 'custom', path: at('id'), message: `duplicate id ${feature.id}` })
      }
      seen.add(feature.id)
      if (feature.status === 'passing' && feature.evidence.length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: at('evidence'),
          message: `${feature.id} is passing but has no evidence`,
        })
      }
      if (feature.status === 'blocked' && feature.notes.trim() === '') {
        ctx.addIssue({
          code: 'custom',
          path: at('notes'),
          message: `${feature.id} is blocked but notes do not say why`,
        })
      }
    })
    const active = list.features.filter((f) => f.status === 'in_progress').map((f) => f.id)
    if (active.length > 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['features'],
        message: `only one feature may be in_progress (WIP=1); found ${active.join(', ')}`,
      })
    }
  })

export type FeatureList = z.infer<typeof featureListSchema>

/** Parse and validate a raw feature list; throws with a readable report on failure. */
export function validateFeatureList(raw: unknown): FeatureList {
  const result = featureListSchema.safeParse(raw)
  if (!result.success) {
    throw new Error(`feature_list.json is invalid:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

/** One-line status summary including the verified-completion ratio (VCR). */
export function summarizeFeatureList(list: FeatureList): string {
  const count = (status: FeatureStatus) => list.features.filter((f) => f.status === status).length
  const passing = count('passing')
  const activated = passing + count('in_progress')
  const vcr = activated === 0 ? 'n/a' : `${passing}/${activated}`
  const active = list.features.find((f) => f.status === 'in_progress')
  return [
    `${list.features.length} features`,
    `${passing} passing`,
    `${count('in_progress')} in_progress${active ? ` (${active.id})` : ''}`,
    `${count('blocked')} blocked`,
    `${count('not_started')} not_started`,
    `VCR ${vcr}`,
  ].join(' · ')
}

export const FEATURE_LIST_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'feature_list.json',
)

function main() {
  const raw: unknown = JSON.parse(readFileSync(FEATURE_LIST_PATH, 'utf8'))
  const list = validateFeatureList(raw)
  console.log(`feature_list.json OK — ${summarizeFeatureList(list)}`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
