import type { CollectionConfig } from 'payload'

import { isAdmin, isAuthenticated } from '@/payload/access'

/**
 * Cached Metsäkeskus forest use declaration stands (kuviot). Written only by the
 * `fetch-declarations` job. The geometry lives in the PostGIS column `geom`
 * (MultiPolygon, EPSG:3067) which is managed via raw SQL, not Payload fields.
 */
export const Declarations: CollectionConfig = {
  slug: 'declarations',
  labels: { singular: 'Metsänkäyttöilmoitus', plural: 'Metsänkäyttöilmoitukset' },
  admin: {
    useAsTitle: 'declarationNumber',
    defaultColumns: ['declarationNumber', 'metsakeskusId', 'hakkuutapa', 'areaHa', 'lastSeen'],
    group: 'Metsävahti',
  },
  access: {
    read: isAuthenticated,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'metsakeskusId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'WFS feature id',
      admin: { readOnly: true },
    },
    {
      name: 'declarationNumber',
      type: 'text',
      required: true,
      index: true,
      label: 'Ilmoitusnumero',
    },
    { name: 'hakkuutapa', type: 'number', label: 'Hakkuutapa (koodi)' },
    { name: 'areaHa', type: 'number', label: 'Pinta-ala (ha)' },
    { name: 'arrivalDate', type: 'date', label: 'Saapumispäivä' },
    { name: 'updatedAtSource', type: 'date', label: 'Päivitetty lähteessä' },
    { name: 'geomHash', type: 'text', required: true, index: true, admin: { readOnly: true } },
    { name: 'firstSeen', type: 'date', required: true, admin: { readOnly: true } },
    { name: 'lastSeen', type: 'date', required: true, index: true, admin: { readOnly: true } },
    {
      name: 'properties',
      type: 'json',
      label: 'Kaikki WFS-attribuutit',
      admin: { readOnly: true },
    },
  ],
}
