import { findUnalertedMatches } from '@/lib/geo/spatial-queries'
import type { JobContext } from '@/lib/jobs/context'

export type MatchWatchAreasResult = { matched: number; alertsCreated: number }

/** Turn spatial matches without an up-to-date alert into pending `alerts` rows. */
export async function matchWatchAreas(ctx: JobContext): Promise<MatchWatchAreasResult> {
  const { payload, logger } = ctx
  const matches = await findUnalertedMatches(payload)

  let alertsCreated = 0
  for (const m of matches) {
    await payload.create({
      collection: 'alerts',
      data: {
        user: m.ownerId,
        watchArea: m.watchAreaId,
        declaration: m.declarationId,
        kind: m.previouslyAlerted ? 'changed' : 'new',
        distanceM: Math.round(m.distanceM),
        geomHash: m.geomHash,
        status: 'pending',
      },
      overrideAccess: true,
    })
    alertsCreated += 1
  }

  const result = { matched: matches.length, alertsCreated }
  logger.info(result, 'match-watch-areas done')
  return result
}
