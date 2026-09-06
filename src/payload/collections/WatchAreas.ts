import type { CollectionConfig } from 'payload'

import { isAdminOrOwner, isAdminUser, isAuthenticated } from '@/payload/access'

export const MIN_RADIUS_M = 100
export const MAX_RADIUS_M = 20_000

/**
 * A user-defined circular area to watch. `center` is stored as a WGS 84 point by
 * Payload; the PostGIS generated column `geom_3067` (see migrations) holds the
 * buffered polygon in EPSG:3067 used for matching.
 */
export const WatchAreas: CollectionConfig = {
  slug: 'watch-areas',
  labels: { singular: 'Vahtialue', plural: 'Vahtialueet' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'radiusM', 'owner', 'updatedAt'],
    group: 'Metsävahti',
  },
  access: {
    create: isAuthenticated,
    read: isAdminOrOwner('owner'),
    update: isAdminOrOwner('owner'),
    delete: isAdminOrOwner('owner'),
  },
  hooks: {
    beforeValidate: [
      // Non-admins always own what they create; they cannot re-assign ownership.
      ({ data, req }) => {
        if (!data || !req.user || isAdminUser(req.user)) return data
        return { ...data, owner: req.user.id }
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Nimi' },
    {
      name: 'center',
      type: 'point',
      required: true,
      label: 'Keskipiste (WGS 84)',
    },
    {
      name: 'radiusM',
      type: 'number',
      required: true,
      defaultValue: 1000,
      min: MIN_RADIUS_M,
      max: MAX_RADIUS_M,
      label: 'Säde (m)',
    },
    {
      name: 'owner',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      label: 'Omistaja',
      defaultValue: ({ user }) => user?.id,
      admin: { position: 'sidebar' },
    },
    {
      name: 'notifyByEmail',
      type: 'checkbox',
      defaultValue: true,
      label: 'Ilmoita sähköpostilla',
    },
  ],
}
