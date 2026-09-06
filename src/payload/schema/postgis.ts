import type { PostgresAdapterArgs } from '@payloadcms/db-postgres'
import { customType } from 'drizzle-orm/pg-core'

type PostgresSchemaHook = NonNullable<PostgresAdapterArgs['afterSchemaInit']>[number]

/**
 * Registers the PostGIS geometry columns on Payload's Drizzle schema so that
 * `payload migrate:create` knows about them (and never generates a DROP COLUMN).
 *
 * The columns are declared as plain geometry here; the migration in
 * src/payload/migrations turns `watch_areas.geom_3067` into a GENERATED column
 * (ST_Buffer(ST_Transform(center, 3067), radius_m)) and adds GIST indexes.
 */
const geometry = (type: string) =>
  customType<{ data: string; driverData: string }>({
    dataType: () => `geometry(${type})`,
  })

export const addPostgisColumns: PostgresSchemaHook = ({ schema, extendTable }) => {
  const watchAreas = schema.tables.watch_areas
  const declarations = schema.tables.declarations
  if (!watchAreas || !declarations) {
    throw new Error('Expected watch_areas and declarations tables to exist in the Payload schema')
  }

  extendTable({
    table: watchAreas,
    columns: { geom_3067: geometry('Polygon,3067')('geom_3067') },
  })
  extendTable({
    table: declarations,
    columns: { geom: geometry('MultiPolygon,3067')('geom') },
  })

  return schema
}
