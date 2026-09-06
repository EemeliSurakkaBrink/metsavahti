/**
 * All PostGIS SQL lives here. Payload's field model does not know about the
 * geometry columns, so we talk to Drizzle directly via the Postgres adapter.
 */
import { type PostgresAdapter, sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'

import type { DeclarationGeometry } from '@/lib/wfs/schemas'

function drizzle(payload: Payload) {
  return (payload.db as unknown as PostgresAdapter).drizzle
}

/** Drizzle wraps driver errors; surface the Postgres message so failures are debuggable. */
async function run<T>(label: string, query: () => Promise<T>): Promise<T> {
  try {
    return await query()
  } catch (err) {
    const cause = err instanceof Error && err.cause instanceof Error ? err.cause : err
    const message = cause instanceof Error ? cause.message : String(cause)
    throw new Error(`${label}: ${message}`, { cause: err })
  }
}

/** Store a GeoJSON geometry (already in EPSG:3067) into `declarations.geom`. */
export async function setDeclarationGeometry(
  payload: Payload,
  declarationId: number,
  geometry: DeclarationGeometry,
): Promise<void> {
  await run('setDeclarationGeometry', () =>
    drizzle(payload).execute(sql`
      UPDATE declarations
      SET geom = ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(${JSON.stringify(geometry)}), 3067))
      WHERE id = ${declarationId}
    `),
  )
}

export type WatchAreaMatch = {
  watchAreaId: number
  ownerId: number
  declarationId: number
  geomHash: string
  distanceM: number
  previouslyAlerted: boolean
}

/**
 * (watch area, declaration) pairs that intersect and have no alert yet for the
 * declaration's current geometry. `previouslyAlerted` tells "new" from "changed".
 */
export async function findUnalertedMatches(payload: Payload): Promise<WatchAreaMatch[]> {
  const { rows } = await run('findUnalertedMatches', () =>
    drizzle(payload).execute<{
      watch_area_id: number
      owner_id: number
      declaration_id: number
      geom_hash: string
      distance_m: string | number
      previously_alerted: boolean
    }>(sql`
    SELECT
      wa.id                                             AS watch_area_id,
      wa.owner_id                                       AS owner_id,
      d.id                                              AS declaration_id,
      d.geom_hash                                       AS geom_hash,
      ST_Distance(ST_Transform(ST_SetSRID(wa.center, 4326), 3067), d.geom) AS distance_m,
      EXISTS (
        SELECT 1 FROM alerts a
        WHERE a.watch_area_id = wa.id AND a.declaration_id = d.id
      )                                                 AS previously_alerted
    FROM watch_areas wa
    JOIN declarations d ON ST_Intersects(d.geom, wa.geom_3067)
    WHERE d.geom IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM alerts a
        WHERE a.watch_area_id = wa.id
          AND a.declaration_id = d.id
          AND a.geom_hash = d.geom_hash
      )
    ORDER BY wa.id, d.id
  `),
  )

  return rows.map((r) => ({
    watchAreaId: Number(r.watch_area_id),
    ownerId: Number(r.owner_id),
    declarationId: Number(r.declaration_id),
    geomHash: r.geom_hash,
    distanceM: Number(r.distance_m),
    previouslyAlerted: Boolean(r.previously_alerted),
  }))
}

/** Declarations (as GeoJSON in WGS 84) intersecting a watch area — for the map. */
export async function findDeclarationsForWatchArea(
  payload: Payload,
  watchAreaId: number,
): Promise<Array<{ id: number; declarationNumber: string; geometry: DeclarationGeometry }>> {
  const { rows } = await run('findDeclarationsForWatchArea', () =>
    drizzle(payload).execute<{
      id: number
      declaration_number: string
      geojson: string
    }>(sql`
    SELECT d.id, d.declaration_number, ST_AsGeoJSON(ST_Transform(d.geom, 4326)) AS geojson
    FROM declarations d
    JOIN watch_areas wa ON ST_Intersects(d.geom, wa.geom_3067)
    WHERE wa.id = ${watchAreaId} AND d.geom IS NOT NULL
  `),
  )
  return rows.map((r) => ({
    id: Number(r.id),
    declarationNumber: r.declaration_number,
    geometry: JSON.parse(r.geojson) as DeclarationGeometry,
  }))
}

/** Used by health checks and tests. */
export async function postgisVersion(payload: Payload): Promise<string> {
  const { rows } = await run('postgisVersion', () =>
    drizzle(payload).execute<{ v: string }>(sql`SELECT PostGIS_Lib_Version() AS v`),
  )
  return rows[0]?.v ?? 'unknown'
}
