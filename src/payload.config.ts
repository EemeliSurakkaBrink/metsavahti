import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { resendAdapter } from '@payloadcms/email-resend'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'

import { env } from '@/lib/env'
import {
  Alerts,
  DeclarationRevisions,
  Declarations,
  NotificationLog,
  Users,
  WatchAreas,
} from '@/payload/collections'
import { canRunJobs } from '@/payload/jobs/access'
import { tasks } from '@/payload/jobs/tasks'
import { workflows } from '@/payload/jobs/workflows'
import { migrations } from '@/payload/migrations'
import { addPostgisColumns } from '@/payload/schema/postgis'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** "Name <addr@example.com>" → { name, address } */
function parseFrom(from: string): { defaultFromName: string; defaultFromAddress: string } {
  const match = /^(.*)<([^>]+)>\s*$/.exec(from)
  if (match) return { defaultFromName: match[1]!.trim(), defaultFromAddress: match[2]!.trim() }
  return { defaultFromName: 'Metsävahti', defaultFromAddress: from.trim() }
}

function emailAdapter() {
  const from = parseFrom(env.EMAIL_FROM)
  if (env.SMTP_HOST) {
    return nodemailerAdapter({
      ...from,
      transportOptions: { host: env.SMTP_HOST, port: env.SMTP_PORT, secure: false },
    })
  }
  if (env.RESEND_API_KEY) {
    return resendAdapter({ ...from, apiKey: env.RESEND_API_KEY })
  }
  return undefined
}

export default buildConfig({
  serverURL: env.NEXT_PUBLIC_SERVER_URL,
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' · Metsävahti' },
  },
  collections: [Users, WatchAreas, Declarations, DeclarationRevisions, Alerts, NotificationLog],
  secret: env.PAYLOAD_SECRET,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: env.DATABASE_URL },
    // `CREATE EXTENSION IF NOT EXISTS postgis` runs before every `migrate` (CLI and boot), so the
    // extension exists before the first geometry column regardless of migration order (MV-030).
    extensions: ['postgis'],
    // Schema comes exclusively from committed migrations in every environment.
    push: false,
    migrationDir: path.resolve(dirname, 'payload/migrations'),
    prodMigrations: migrations,
    afterSchemaInit: [addPostgisColumns],
  }),
  email: emailAdapter(),
  jobs: {
    tasks,
    workflows,
    access: { run: canRunJobs },
  },
})
