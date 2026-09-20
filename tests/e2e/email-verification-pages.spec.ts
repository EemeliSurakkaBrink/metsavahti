import { randomInt } from 'node:crypto'
import { readFile } from 'node:fs/promises'

import { type APIRequestContext, type Page, request as playwrightRequest } from '@playwright/test'

import { AUTH_STATE } from '../../playwright.config'
import { createMailpitClient } from '../helpers/mailpit'
import { expectNoA11yViolations } from './a11y'
import { expect, test } from './fixtures'

const PASSWORD = 'kuusi-metsa-jarvi-2026'
const HOUR = 60 * 60 * 1000
const mailpit = createMailpitClient(process.env.MAILPIT_API_URL ?? 'http://localhost:8025')

/** Own client address per test (`2001:db8::/32`): the auth actions rate-limit by `x-forwarded-for`. */
async function useOwnAddress(page: Page): Promise<void> {
  const ip = `2001:db8:${randomInt(0x10000).toString(16)}:${randomInt(0x10000).toString(16)}::1`
  await page.setExtraHTTPHeaders({ 'x-forwarded-for': ip })
}

/** `/rekisteroidy` → `/vahvista-sahkoposti?email=`; returns the address. */
async function register(page: Page, browserName: string, tag: string): Promise<string> {
  const email = `${tag}-${browserName}-${Date.now()}@metsavahti.test`
  await page.goto('/rekisteroidy')
  await page.getByLabel('Sähköposti').fill(email)
  await page.getByLabel('Salasana', { exact: true }).fill(PASSWORD)
  await page.getByLabel('Salasana uudelleen').fill(PASSWORD)
  await page.getByLabel(/Olen lukenut/).check()
  await page.getByRole('button', { name: 'Luo tili' }).click()
  await expect(page).toHaveURL(/\/vahvista-sahkoposti\?email=/)
  return email
}

/** The `/vahvista?token=` links sent to `email`, newest first, once `count` have arrived. */
async function verificationLinks(email: string, count: number): Promise<string[]> {
  const messagesFor = async () =>
    (await mailpit.listMessages()).filter((m) => m.To[0]?.Address === email)
  await expect.poll(async () => (await messagesFor()).length, { timeout: 15_000 }).toBe(count)
  const messages = (await messagesFor()).sort((a, b) => b.Created.localeCompare(a.Created))
  const links: string[] = []
  for (const message of messages) {
    const full = await mailpit.getMessage(message.ID)
    links.push(mailpit.extractFirstLink(full.HTML, '/vahvista?token=')!)
  }
  return links
}

/**
 * An API context with the seeded admin's session from `auth.setup.ts` (its cookie stays out
 * of the browser). It does not log in again: concurrent logins of one account from the three
 * browser projects can lose a session in Payload's `sessions` array.
 */
async function adminApi(): Promise<{ api: APIRequestContext; patchUser: PatchUser }> {
  // The cookie is sent as a JWT header: Payload only honours cookies from browser navigations.
  const { cookies } = JSON.parse(await readFile(AUTH_STATE, 'utf8')) as {
    cookies: Array<{ name: string; value: string }>
  }
  const token = cookies.find((c) => c.name === 'payload-token')?.value
  expect(token, 'auth.setup.ts must have stored the admin session').toBeTruthy()
  const api = await playwrightRequest.newContext({
    extraHTTPHeaders: { authorization: `JWT ${token}` },
  })
  const patchUser: PatchUser = async (email, data) => {
    const found = await api.get(`/api/users?where[email][equals]=${encodeURIComponent(email)}`)
    expect(found.ok(), await found.text()).toBeTruthy()
    const { docs } = (await found.json()) as { docs: Array<{ id: number }> }
    expect(docs).toHaveLength(1)
    const res = await api.patch(`/api/users/${docs[0]!.id}`, { data })
    expect(res.ok(), await res.text()).toBeTruthy()
  }
  return { api, patchUser }
}
type PatchUser = (email: string, data: Record<string, unknown>) => Promise<void>

const outcome = (page: Page) => page.getByTestId('verify-outcome')
const resendButton = (page: Page) => page.getByRole('button', { name: /Lähetä uudelleen/ })

/** MV-043: register → resend → Mailpit link → verified → `/aloita`; expired and used states; the guard. */
test.describe('email verification pages', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('resends with a cooldown, verifies through the newest link and refuses it afterwards @smoke', async ({
    page,
    browserName,
  }) => {
    await useOwnAddress(page)
    const email = await register(page, browserName, 'verify')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vahvista sähköposti')
    await expect(resendButton(page)).toHaveText('Lähetä uudelleen')
    await expect(page.getByRole('link', { name: 'Vaihda sähköpostiosoite' })).toHaveAttribute(
      'href',
      '/rekisteroidy',
    )

    await resendButton(page).click()
    await expect(page.getByRole('status')).toHaveText('Vahvistuslinkki lähetetty uudelleen.')
    await expect(resendButton(page)).toBeDisabled()
    await expect(resendButton(page)).toHaveText(/^Lähetä uudelleen \(\d+ s\)$/)
    await expectNoA11yViolations(page)

    const [newest, oldest] = await verificationLinks(email, 2)
    expect(newest).not.toBe(oldest)

    // The resend retired the first link.
    await page.goto(oldest!)
    await expect(outcome(page)).toHaveAttribute('data-state', 'invalid')

    await page.goto(newest!)
    await expect(outcome(page)).toHaveAttribute('data-state', 'verified')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sähköposti vahvistettu')
    await expect(page.getByRole('link', { name: 'Luo ensimmäinen vahtialue' })).toHaveAttribute(
      'href',
      '/aloita',
    )
    await expect(page.getByTestId('attribution')).toBeVisible()
    await expectNoA11yViolations(page)

    // The account is active: the login Payload refused before registration now succeeds.
    const login = await page.request.post('/api/users/login', {
      data: { email, password: PASSWORD },
    })
    expect(login.ok(), await login.text()).toBeTruthy()

    // The same link again is "used".
    await page.goto(newest!)
    await expect(outcome(page)).toHaveAttribute('data-state', 'invalid')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Linkki on jo käytetty')
    await expect(page.getByRole('link', { name: 'Kirjaudu' })).toHaveAttribute('href', '/login')
    await expectNoA11yViolations(page)
  })

  test('a link older than 24 h is expired and the page offers a fresh one', async ({
    page,
    browserName,
  }) => {
    await useOwnAddress(page)
    const email = await register(page, browserName, 'expired')
    const [link] = await verificationLinks(email, 1)
    const { api, patchUser } = await adminApi()
    try {
      await patchUser(email, { verificationSentAt: new Date(Date.now() - 25 * HOUR).toISOString() })
    } finally {
      await api.dispose()
    }

    await page.goto(link!)
    await expect(outcome(page)).toHaveAttribute('data-state', 'expired')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Vahvistuslinkki on vanhentunut',
    )
    await expect(page.getByText(email)).toBeVisible()
    await expectNoA11yViolations(page)

    await resendButton(page).click()
    await expect(page.getByRole('status')).toHaveText('Vahvistuslinkki lähetetty uudelleen.')
    const [fresh] = await verificationLinks(email, 2)
    expect(fresh).not.toBe(link)
    await page.goto(fresh!)
    await expect(outcome(page)).toHaveAttribute('data-state', 'verified')
    // The expired link is gone for good.
    await page.goto(link!)
    await expect(outcome(page)).toHaveAttribute('data-state', 'invalid')
  })

  test('a missing or unknown token shows the used state', async ({ page }) => {
    await page.goto('/vahvista')
    await expect(outcome(page)).toHaveAttribute('data-state', 'invalid')
    await page.goto(`/vahvista?token=${'ab'.repeat(20)}`)
    await expect(outcome(page)).toHaveAttribute('data-state', 'invalid')
    await expect(page.getByRole('link', { name: 'Luo tili' })).toHaveAttribute(
      'href',
      '/rekisteroidy',
    )
    await expectNoA11yViolations(page)
  })

  test('a logged-in account that is no longer verified is sent to the interstitial', async ({
    page,
    browserName,
  }) => {
    await useOwnAddress(page)
    const email = await register(page, browserName, 'guard')
    const [link] = await verificationLinks(email, 1)
    await page.goto(link!)
    await expect(outcome(page)).toHaveAttribute('data-state', 'verified')
    const login = await page.request.post('/api/users/login', {
      data: { email, password: PASSWORD },
    })
    expect(login.ok(), await login.text()).toBeTruthy()
    await page.goto('/dashboard')
    await expect(page.getByText(`Kirjautunut: ${email}`)).toBeVisible()

    const { api, patchUser } = await adminApi()
    try {
      await patchUser(email, { _verified: false })
    } finally {
      await api.dispose()
    }

    await page.goto('/dashboard')
    await expect(page).toHaveURL(
      `/vahvista-sahkoposti?email=${encodeURIComponent(email)}&required=1`,
    )
    await expect(page.getByTestId('system-code')).toHaveText('VAHVISTUS')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Vahvista sähköpostiosoitteesi ensin',
    )
    await expect(resendButton(page)).toBeEnabled()
    await expect(page.getByRole('link', { name: 'Etusivulle' })).toHaveAttribute('href', '/')
    await expect(page.getByTestId('attribution')).toBeVisible()
    await expectNoA11yViolations(page)
  })
})
