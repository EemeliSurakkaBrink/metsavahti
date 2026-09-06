import proj4 from 'proj4'

/** ETRS89 / TM35FIN(E,N) — the CRS used by Metsäkeskus WFS and by all PostGIS columns. */
export const EPSG_3067 = 'EPSG:3067'
/** WGS 84 — what maps, browsers and Payload `point` fields use ([lon, lat]). */
export const EPSG_4326 = 'EPSG:4326'

// Registered once at module load; proj4 keeps a global registry.
proj4.defs(EPSG_3067, '+proj=utm +zone=35 +ellps=GRS80 +units=m +no_defs +type=crs')

/** [longitude, latitude] in WGS 84. */
export type LonLat = [number, number]
/** [easting, northing] in ETRS-TM35FIN metres. */
export type EastNorth = [number, number]

export function toWgs84([easting, northing]: EastNorth): LonLat {
  const [lon, lat] = proj4(EPSG_3067, EPSG_4326, [easting, northing])
  return [lon as number, lat as number]
}

export function toEtrs89Tm35fin([lon, lat]: LonLat): EastNorth {
  const [e, n] = proj4(EPSG_4326, EPSG_3067, [lon, lat])
  return [e as number, n as number]
}

/** Rough sanity bounds of Finland in EPSG:3067, useful for validating input. */
export const FINLAND_BOUNDS_3067 = {
  minE: 50_000,
  minN: 6_600_000,
  maxE: 760_000,
  maxN: 7_800_000,
} as const

export function isInsideFinland([e, n]: EastNorth): boolean {
  const b = FINLAND_BOUNDS_3067
  return e >= b.minE && e <= b.maxE && n >= b.minN && n <= b.maxN
}
