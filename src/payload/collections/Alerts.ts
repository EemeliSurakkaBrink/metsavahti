import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminOrOwner } from '@/payload/access'

/** One alert = one (watch area, declaration) match the owner should hear about. */
export const Alerts: CollectionConfig = {
  slug: 'alerts',
  labels: { singular: 'Hälytys', plural: 'Hälytykset' },
  admin: {
    defaultColumns: ['watchArea', 'declaration', 'kind', 'status', 'createdAt'],
    group: 'Metsävahti',
  },
  access: {
    read: isAdminOrOwner('user'),
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users', required: true, index: true },
    {
      name: 'watchArea',
      type: 'relationship',
      relationTo: 'watch-areas',
      required: true,
      index: true,
    },
    {
      name: 'declaration',
      type: 'relationship',
      relationTo: 'declarations',
      required: true,
      index: true,
    },
    {
      name: 'kind',
      type: 'select',
      required: true,
      options: [
        { label: 'Uusi', value: 'new' },
        { label: 'Muuttunut', value: 'changed' },
      ],
    },
    { name: 'distanceM', type: 'number', label: 'Etäisyys keskipisteestä (m)' },
    {
      name: 'geomHash',
      type: 'text',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Geometrian tiiviste hälytyshetkellä (muutosten tunnistus)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: [
        { label: 'Odottaa', value: 'pending' },
        { label: 'Lähetetty', value: 'sent' },
        { label: 'Epäonnistui', value: 'failed' },
      ],
    },
    { name: 'sentAt', type: 'date' },
  ],
}
