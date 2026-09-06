import type { CollectionConfig } from 'payload'

import { isAdmin, isAdminField, isAdminOrSelf } from '@/payload/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    group: 'Käyttäjät',
  },
  auth: {
    // Email verification is required before login (link is sent via the email adapter).
    verify: true,
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
    maxLoginAttempts: 10,
    lockTime: 10 * 60 * 1000,
  },
  access: {
    // Anyone can sign up; `role` is protected by field-level access below.
    create: () => true,
    read: isAdminOrSelf,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req }) => Boolean(req.user && (req.user as { role?: string }).role === 'admin'),
  },
  hooks: {
    beforeChange: [
      // The very first account becomes admin so the instance can be managed.
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users', overrideAccess: true })
        if (totalDocs === 0) return { ...data, role: 'admin' }
        // Never allow self-assigned admin role through the public API.
        const requesterIsAdmin = (req.user as { role?: string } | null)?.role === 'admin'
        return requesterIsAdmin ? data : { ...data, role: 'user' }
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nimi',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'Käyttäjä', value: 'user' },
        { label: 'Ylläpitäjä', value: 'admin' },
      ],
      access: {
        update: isAdminField,
      },
      saveToJWT: true,
    },
  ],
}
