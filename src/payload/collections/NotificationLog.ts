import type { CollectionConfig } from 'payload'

import { isAdmin } from '@/payload/access'

export const NotificationLog: CollectionConfig = {
  slug: 'notification-log',
  labels: { singular: 'Ilmoitusloki', plural: 'Ilmoitusloki' },
  admin: {
    defaultColumns: ['channel', 'status', 'recipient', 'createdAt'],
    group: 'Metsävahti',
  },
  access: {
    read: isAdmin,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    { name: 'alerts', type: 'relationship', relationTo: 'alerts', hasMany: true },
    { name: 'user', type: 'relationship', relationTo: 'users', index: true },
    { name: 'recipient', type: 'email' },
    {
      name: 'channel',
      type: 'select',
      required: true,
      defaultValue: 'email',
      options: [{ label: 'Sähköposti', value: 'email' }],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Lähetetty', value: 'sent' },
        { label: 'Epäonnistui', value: 'failed' },
      ],
    },
    { name: 'error', type: 'textarea' },
    { name: 'jobRunId', type: 'text', index: true },
  ],
}
