'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { FormError } from '@/components/forms/form-error'
import { PasswordInput } from '@/components/forms/password-input'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { fi } from '@/i18n/fi'

const copy = fi.auth.login

const schema = z.object({
  email: z.email(copy.errors.emailInvalid),
  password: z.string().min(1, copy.errors.passwordMissing),
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
      setServerError(copy.errors.failed)
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form className="flex flex-col gap-4.5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <FormError>{serverError}</FormError>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{copy.email}</Label>
        <Input
          aria-invalid={errors.email ? true : undefined}
          autoComplete="email"
          id="email"
          type="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-error" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{copy.password}</Label>
        <PasswordInput
          aria-invalid={errors.password ? true : undefined}
          autoComplete="current-password"
          id="password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-error" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>
      <Button className="w-full" disabled={isSubmitting} size="xl" type="submit">
        {copy.submit}
      </Button>
    </form>
  )
}
