import { createMailpitClient } from '../helpers/mailpit'
import { expectNoA11yViolations } from './a11y'
import { expect, test } from './fixtures'

const PASSWORD = 'kuusi-metsa-jarvi-2026'

/** MV-042 `@smoke`: `/rekisteroidy` → account + verification email → `/vahvista-sahkoposti`. */
test.describe('registration', () => {
  // A logged-in session would be sent away by the guest-only guard (MV-046); register as a guest.
  test.use({ storageState: { cookies: [], origins: [] } })

  test('validates the form inline before anything is sent', async ({ page }) => {
    await page.goto('/rekisteroidy')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Luo tili')
    await page.getByRole('button', { name: 'Luo tili' }).click()
    await expect(page.getByText('Anna kelvollinen sähköpostiosoite')).toBeVisible()
    await expect(page.getByText('Salasanan on oltava vähintään 10 merkkiä')).toBeVisible()
    await expect(
      page.getByText('Hyväksy käyttöehdot ja tietosuojaseloste jatkaaksesi'),
    ).toBeVisible()

    await page.getByLabel('Salasana', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Salasana uudelleen').fill('jotain-muuta-2026')
    await page.getByRole('button', { name: 'Luo tili' }).click()
    await expect(page.getByText('Salasanat eivät täsmää.')).toBeVisible()
    await expect(page.getByRole('meter', { name: 'Salasanan vahvuus' })).toHaveAttribute(
      'aria-valuetext',
      /Hyvä|Vahva/,
    )
    await expectNoA11yViolations(page)
  })

  test('registers, sends the verification email and lands on the verify page @smoke', async ({
    page,
    browserName,
  }) => {
    const mailpit = createMailpitClient(process.env.MAILPIT_API_URL ?? 'http://localhost:8025')
    const email = `e2e-${browserName}-${Date.now()}@metsavahti.test`

    await page.goto('/rekisteroidy')
    await page.getByLabel('Sähköposti').fill(email)
    await page.getByLabel('Salasana', { exact: true }).fill(PASSWORD)
    await page.getByLabel('Salasana uudelleen').fill(PASSWORD)
    await page.getByLabel(/Olen lukenut/).check()
    await page.getByLabel('Saa lähettää palveluun liittyviä uutisia.').check()
    await page.getByRole('button', { name: 'Luo tili' }).click()

    await expect(page).toHaveURL(/\/vahvista-sahkoposti\?email=/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vahvista sähköposti')
    await expect(page.getByText(email)).toBeVisible()
    await expect(page.getByTestId('attribution')).toBeVisible()
    await expectNoA11yViolations(page)

    await expect
      .poll(async () => (await mailpit.listMessages()).some((m) => m.To[0]?.Address === email), {
        timeout: 15_000,
      })
      .toBe(true)
    const message = (await mailpit.listMessages()).find((m) => m.To[0]?.Address === email)!
    expect(message.Subject).toBe('Vahvista sähköpostiosoitteesi')
    const full = await mailpit.getMessage(message.ID)
    expect(mailpit.extractFirstLink(full.HTML, '/vahvista?token=')).toBeTruthy()
    expect(full.HTML).toContain('Metsänkäyttöilmoitukset-aineistoa')

    // Unverified accounts cannot log in yet (Payload `auth.verify`).
    const login = await page.request.post('/api/users/login', {
      data: { email, password: PASSWORD },
    })
    expect(login.ok()).toBe(false)
  })
})
