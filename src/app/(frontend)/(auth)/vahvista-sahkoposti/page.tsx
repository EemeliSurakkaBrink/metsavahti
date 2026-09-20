import type { Metadata } from 'next'
import Link from 'next/link'

import { fi } from '@/i18n/fi'

const copy = fi.auth.verifyEmail

export const metadata: Metadata = { title: copy.title }

type Props = { searchParams: Promise<{ email?: string | string[] }> }

/**
 * `/vahvista-sahkoposti?email=` (App artboard `vahvista`): where registration lands. Shows
 * the address the link went to; the "Lähetä uudelleen" button with its 60 s cooldown is
 * MV-043's. The address comes from the query string only, so it is echoed as text and
 * never used for anything else.
 */
export default async function VerifyEmailPage({ searchParams }: Props) {
  const { email: raw } = await searchParams
  const email = Array.isArray(raw) ? raw[0] : raw
  return (
    <div className="flex flex-col items-center gap-3.5 text-center">
      <span
        aria-hidden="true"
        className="inline-flex size-14 items-center justify-center rounded-full bg-forest-50 text-2xl text-forest-700"
      >
        ✉
      </span>
      <h1 className="text-2xl font-bold text-forest-700">{copy.title}</h1>
      <p className="leading-relaxed text-ink-muted">
        {email ? (
          <>
            {copy.sentTo} <strong className="text-ink">{email}</strong>.
          </>
        ) : (
          copy.sentToUnknown
        )}{' '}
        {copy.validFor}
      </p>
      <Link className="text-sm font-semibold text-forest-600 hover:underline" href="/rekisteroidy">
        {copy.changeEmail}
      </Link>
    </div>
  )
}
