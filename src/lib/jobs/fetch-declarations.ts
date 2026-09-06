import { watchAreaBbox3067 } from '@/lib/geo/buffer'
import { setDeclarationGeometry } from '@/lib/geo/spatial-queries'
import type { JobContext } from '@/lib/jobs/context'
import { type DeclarationRecord, toDeclarationRecords } from '@/lib/wfs/parse'

export type FetchDeclarationsResult = {
  watchAreas: number
  fetched: number
  created: number
  updated: number
}

const WFS_PAGE_SIZE = 1000

/**
 * For every watch area, fetch the declarations inside its bbox from the WFS
 * and upsert them into the `declarations` collection (attributes via Payload,
 * geometry via PostGIS). Declarations seen through several areas are handled once.
 */
export async function fetchDeclarations(ctx: JobContext): Promise<FetchDeclarationsResult> {
  const { payload, logger, wfs, now } = ctx
  const { docs: areas } = await payload.find({
    collection: 'watch-areas',
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })

  const byId = new Map<string, DeclarationRecord>()
  for (const area of areas) {
    const bbox = watchAreaBbox3067(area.center as [number, number], area.radiusM)
    const collection = await wfs.getDeclarations({ bbox, count: WFS_PAGE_SIZE })
    for (const record of toDeclarationRecords(collection)) byId.set(record.metsakeskusId, record)
    logger.debug({ watchAreaId: area.id, features: collection.features.length }, 'wfs page fetched')
  }

  let created = 0
  let updated = 0
  const seenAt = now().toISOString()

  for (const record of byId.values()) {
    const existing = await payload.find({
      collection: 'declarations',
      where: { metsakeskusId: { equals: record.metsakeskusId } },
      limit: 1,
      overrideAccess: true,
    })
    const attrs = {
      declarationNumber: record.declarationNumber,
      hakkuutapa: record.hakkuutapa,
      areaHa: record.areaHa,
      arrivalDate: record.arrivalDate,
      updatedAtSource: record.updatedAtSource,
      geomHash: record.geomHash,
      properties: record.properties,
      lastSeen: seenAt,
    }

    const found = existing.docs[0]
    if (!found) {
      const doc = await payload.create({
        collection: 'declarations',
        data: { ...attrs, metsakeskusId: record.metsakeskusId, firstSeen: seenAt },
        overrideAccess: true,
      })
      await setDeclarationGeometry(payload, doc.id, record.geometry)
      created += 1
      continue
    }

    await payload.update({
      collection: 'declarations',
      id: found.id,
      data: attrs,
      overrideAccess: true,
    })
    if (found.geomHash !== record.geomHash) {
      await setDeclarationGeometry(payload, found.id, record.geometry)
    }
    updated += 1
  }

  const result = { watchAreas: areas.length, fetched: byId.size, created, updated }
  logger.info(result, 'fetch-declarations done')
  return result
}
