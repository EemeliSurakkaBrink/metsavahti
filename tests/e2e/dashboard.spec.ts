import { AUTH_STATE } from '../../playwright.config'
import { expectNoA11yViolations } from './a11y'
import { E2E_USER, E2E_WATCH_AREA, expect, test } from './fixtures'

test.describe('dashboard (anonymous)', () => {
  test('redirects anonymous visitors to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('logging in through the form lands on the dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Sähköposti').fill(E2E_USER.email)
    await page.getByLabel('Salasana', { exact: true }).fill(E2E_USER.password)
    await page.getByRole('button', { name: 'Kirjaudu' }).click()
    await expect(page).toHaveURL(/\/dashboard$/)
    await expect(page.getByTestId('watch-area-list')).toContainText(E2E_WATCH_AREA.name)
  })
})

test.describe('dashboard (logged in)', () => {
  // Session created once by auth.setup.ts and shared by every browser project.
  test.use({ storageState: AUTH_STATE })

  test('shows the seeded watch area and the map', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vahtialueesi')
    await expect(page.getByText(E2E_USER.email)).toBeVisible()
    // The pending-alert count is a Payload count on `alerts.notifiedAt` (MV-034); the seed has none.
    await expect(page.getByText('odottavia hälytyksiä: 0')).toBeVisible()
    await expect(page.getByTestId('watch-area-list')).toContainText(E2E_WATCH_AREA.name)
    await expect(page.getByTestId('watch-area-map')).toBeVisible()
    await expectNoA11yViolations(page)
  })
})
