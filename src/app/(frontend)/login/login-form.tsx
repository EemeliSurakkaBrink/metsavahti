'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  email: z.email('Anna kelvollinen sähköpostiosoite'),
  password: z.string().min(1, 'Salasana puuttuu'),
})
type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: FormValues) {
    setServerError(null)
    const res = await fetch('/api/users/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(values),
    })
    if (!res.ok) {
      setServerError('Kirjautuminen epäonnistui. Tarkista tunnus ja salasana.')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form className="space-y-4" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-1">
        <Label htmlFor="email">Sähköposti</Label>
        <Input autoComplete="email" id="email" type="email" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="password">Salasana</Label>
        <Input
          autoComplete="current-password"
          id="password"
          type="password"
          {...register('password')}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      {serverError && (
        <p className="text-sm text-destructive" role="alert">
          {serverError}
        </p>
      )}
      <Button className="w-full" disabled={isSubmitting} type="submit">
        Kirjaudu
      </Button>
    </form>
  )
}
