import { describe, expect, it } from 'vitest'

import { VERIFY_EMAIL_SUBJECT, renderVerifyEmail, verifyEmailUrl } from '@/emails/VerifyEmail'
import { validateRegistration, verifyEmailPath } from '@/lib/auth/registration'
import { passwordUserInputs, registrationFormSchema } from '@/lib/auth/registration-schema'
import { RateLimited } from '@/lib/errors'
import { clientIp } from '@/lib/privacy/ip'
import { createRateLimiter } from '@/lib/rate-limit'

const valid = {
  email: 'Anna.K@Example.fi',
  password: 'kuusi-metsa-jarvi-2026',
  confirmPassword: 'kuusi-metsa-jarvi-2026',
  acceptTerms: true,
  marketing: false,
}

/** MV-042: registration schema, server validation, rate limiter, verify email. */
describe('registration schema', () => {
  it('accepts a complete form and normalises the email', () => {
    const result = registrationFormSchema.safeParse(valid)
    expect(result.success).toBe(true)
    expect(result.data?.email).toBe('anna.k@example.fi')
  })

  it.each([
    ['invalid email', { email: 'not-an-email' }, 'email', 'Anna kelvollinen sähköpostiosoite'],
    [
      'short password',
      { password: 'lyhyt', confirmPassword: 'lyhyt' },
      'password',
      'Salasanan on oltava vähintään 10 merkkiä',
    ],
    [
      'mismatch',
      { confirmPassword: 'jotain-muuta-2026' },
      'confirmPassword',
      'Salasanat eivät täsmää.',
    ],
    [
      'terms not accepted',
      { acceptTerms: false },
      'acceptTerms',
      'Hyväksy käyttöehdot ja tietosuojaseloste jatkaaksesi',
    ],
  ])('rejects %s on the right field', (_name, overrides, field, message) => {
    const result = registrationFormSchema.safeParse({ ...valid, ...overrides })
    expect(result.success).toBe(false)
    const issue = result.error!.issues.find((i) => i.path[0] === field)
    expect(issue?.message).toBe(message)
  })
})

describe('validateRegistration', () => {
  it('returns the parsed data for a strong password', () => {
    const result = validateRegistration({ ...valid, marketing: true })
    expect(result).toEqual({
      success: true,
      data: { ...valid, email: 'anna.k@example.fi', marketing: true },
    })
  })

  it('maps schema issues to one message per field', () => {
    const result = validateRegistration({ ...valid, email: 'nope', acceptTerms: false })
    expect(result).toEqual({
      success: false,
      fieldErrors: {
        email: 'Anna kelvollinen sähköpostiosoite',
        acceptTerms: 'Hyväksy käyttöehdot ja tietosuojaseloste jatkaaksesi',
      },
    })
  })

  it('rejects a long but guessable password (zxcvbn < 3)', () => {
    const result = validateRegistration({
      ...valid,
      password: 'password12',
      confirmPassword: 'password12',
    })
    expect(result).toEqual({
      success: false,
      fieldErrors: { password: expect.stringContaining('liian heikko') },
    })
  })

  it('penalises the email address inside the password', () => {
    const result = validateRegistration({
      ...valid,
      email: 'kuusimetsajarvi@example.fi',
      password: 'kuusimetsajarvi1',
      confirmPassword: 'kuusimetsajarvi1',
    })
    expect(result.success).toBe(false)
  })

  it('passwordUserInputs yields the address and its local part', () => {
    expect(passwordUserInputs(' Anna.K@Example.fi ')).toEqual(['anna.k@example.fi', 'anna.k'])
    expect(passwordUserInputs('')).toEqual([])
    expect(passwordUserInputs('nolocal')).toEqual(['nolocal'])
  })

  it('rejects non-object input', () => {
    expect(validateRegistration(null).success).toBe(false)
    expect(validateRegistration('x').success).toBe(false)
  })
})

describe('rate limiter', () => {
  it('allows `limit` requests per window and then denies with a retry hint', () => {
    let now = 1_000_000
    const limiter = createRateLimiter({ limit: 5, windowMs: 60_000, now: () => now })
    for (let i = 1; i <= 5; i += 1) {
      expect(limiter.check('ip:1')).toEqual({
        allowed: true,
        remaining: 5 - i,
        retryAfterSeconds: 0,
      })
    }
    now += 10_000
    expect(limiter.check('ip:1')).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 50 })
    // Another key is independent.
    expect(limiter.check('ip:2').allowed).toBe(true)
    // The window slides: the five requests share a timestamp and leave together after 60 s.
    now += 50_000
    expect(limiter.check('ip:1')).toMatchObject({ allowed: true, remaining: 4 })
  })

  it('assert() throws RateLimited with the retry-after seconds', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 30_000, now: () => 0 })
    limiter.assert('k')
    expect(() => limiter.assert('k')).toThrow(RateLimited)
    const thrown = (() => {
      try {
        limiter.assert('k')
        return null
      } catch (error) {
        return error as RateLimited
      }
    })()
    expect(thrown?.retryAfterSeconds).toBe(30)
    expect(thrown?.toActionError()).toMatchObject({ code: 'rate_limited', retryAfterSeconds: 30 })
    limiter.reset()
    expect(() => limiter.assert('k')).not.toThrow()
  })
})

describe('clientIp', () => {
  it('takes the first x-forwarded-for entry, then x-real-ip, and ignores garbage', () => {
    expect(clientIp(new Headers({ 'x-forwarded-for': '203.0.113.7, 10.0.0.1' }))).toBe(
      '203.0.113.7',
    )
    expect(clientIp(new Headers({ 'x-real-ip': '2001:db8::1' }))).toBe('2001:db8::1')
    expect(
      clientIp(new Headers({ 'x-forwarded-for': 'unknown', 'x-real-ip': '198.51.100.2' })),
    ).toBe('198.51.100.2')
    expect(clientIp(new Headers({ 'x-forwarded-for': '<script>' }))).toBeNull()
    expect(clientIp(new Headers())).toBeNull()
  })
})

describe('verify email', () => {
  it('renders template 1 with the token link, the fallback URL and the attribution', async () => {
    const { html, text } = await renderVerifyEmail({
      token: 'abc/123',
      baseUrl: 'https://metsavahti.fi',
      attribution: 'Sisältää Suomen metsäkeskuksen Metsänkäyttöilmoitukset-aineistoa 09/2026',
    })
    expect(VERIFY_EMAIL_SUBJECT).toBe('Vahvista sähköpostiosoitteesi')
    expect(verifyEmailUrl('https://metsavahti.fi', 'abc/123')).toBe(
      'https://metsavahti.fi/vahvista?token=abc%2F123',
    )
    expect(html).toContain('Vahvista sähköpostiosoitteesi')
    expect(html).toContain('Tervetuloa')
    expect(html).toContain('https://metsavahti.fi/vahvista?token=abc%2F123')
    expect(html).toContain('Jos painike ei toimi')
    expect(html).toContain('Jos et luonut tiliä Metsävahtiin')
    expect(html).toContain('Metsänkäyttöilmoitukset-aineistoa 09/2026')
    expect(text).toContain('https://metsavahti.fi/vahvista?token=abc%2F123')
  })

  it('verifyEmailPath encodes the address', () => {
    expect(verifyEmailPath('anna+k@example.fi')).toBe(
      '/vahvista-sahkoposti?email=anna%2Bk%40example.fi',
    )
  })
})
