import type { Metadata } from 'next'

import { LoginForm } from '@/app/(frontend)/login/login-form'

export const metadata: Metadata = { title: 'Kirjaudu' }

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-2xl font-semibold">Kirjaudu sisään</h1>
      <LoginForm />
    </div>
  )
}
