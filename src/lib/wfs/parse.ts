import { geomHash } from '@/lib/geo/hash'
import {
  type DeclarationFeature,
  type DeclarationFeatureCollection,
  type DeclarationGeometry,
  declarationFeatureCollectionSchema,
} from '@/lib/wfs/schemas'

/** Normalised declaration ready to be stored in the `declarations` collection. */
export type DeclarationRecord = {
  metsakeskusId: string
  declarationNumber: string
  hakkuutapa: number | null
  areaHa: number | null
  arrivalDate: string | null
  updatedAtSource: string | null
  geometry: DeclarationGeometry
  geomHash: string
  properties: DeclarationFeature['properties']
}

/** Parse and validate a raw WFS JSON body. Throws a ZodError on contract drift. */
export function parseFeatureCollection(raw: unknown): DeclarationFeatureCollection {
  return declarationFeatureCollectionSchema.parse(raw)
}

export function toDeclarationRecord(feature: DeclarationFeature): DeclarationRecord {
  const p = feature.properties
  return {
    metsakeskusId: feature.id,
    declarationNumber: p.FORESTUSEDECLARATIONNUMBER,
    hakkuutapa: p.CUTTINGREALIZATIONPRACTICE ?? null,
    areaHa: p.AREA ?? null,
    arrivalDate: p.DECLARATIONARRIVALDATE ?? null,
    updatedAtSource: p.UPDATETIME ?? null,
    geometry: feature.geometry,
    geomHash: geomHash(feature.geometry),
    properties: p,
  }
}

export function toDeclarationRecords(
  collection: DeclarationFeatureCollection,
): DeclarationRecord[] {
  return collection.features.map(toDeclarationRecord)
}
