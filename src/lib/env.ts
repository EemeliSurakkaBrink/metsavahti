import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

const logLevels = ['trace', 'debug', 'info', 'warn', 'error', 'fatal'] as const

/**
 * Validated environment. Import `env` instead of touching `process.env`.
 *
 * Fails fast at boot when something required is missing. Set
 * `SKIP_ENV_VALIDATION=1` for tooling that only needs to parse the code
 * (lint, knip, type generation without a database).
 */
export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    DATABASE_URL: z.url().startsWith('postgres'),
    PAYLOAD_SECRET: z.string().min(16),
    WFS_BASE_URL: z.url(),
    WFS_LAYER: z.string().min(1).default('v1:forestusedeclaration'),
    CRON_SECRET: z.string().min(8),
    EMAIL_FROM: z.string().min(3),
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(1025),
    RESEND_API_KEY: z.string().min(1).optional(),
    MAILPIT_API_URL: z.url().optional(),
    MML_API_KEY: z.string().min(1).optional(),
    SENTRY_DSN: z.string().min(1).optional(),
    LOG_LEVEL: z.enum(logLevels).default('info'),
  },
  client: {
    NEXT_PUBLIC_SERVER_URL: z.url(),
    NEXT_PUBLIC_SENTRY_DSN: z.string().min(1).optional(),
  },
  // Only NEXT_PUBLIC_* keys must be listed; server keys are read from process.env.
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  emptyStringAsUndefined: true,
  skipValidation: Boolean(process.env.SKIP_ENV_VALIDATION),
})
