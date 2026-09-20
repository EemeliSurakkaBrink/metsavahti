import type { Metadata } from 'next'
import Link from 'next/link'

import { fi } from '@/i18n/fi'

import { LoginForm } from './login-form'

const copy = fi.auth.login

export const metadata: Metadata = { title: copy.title }

/**
 * `/login` inside the `(auth)` layout (App artboard `kirjaudu`). MV-044 renames the route to
 * `/kirjaudu` and adds remember-me, `?next=` and the locked/unverified states.
 */
export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold text-forest-700">{copy.title}</h1>
      <LoginForm />
      <p className="text-center text-sm text-ink-muted">
        {copy.noAccount}{' '}
        <Link className="font-semibold text-forest-600 hover:underline" href="/rekisteroidy">
          {copy.register}
        </Link>
      </p>
    </>
  )
}
