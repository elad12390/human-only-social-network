import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser } from './helpers/test-utils'

test.describe('Status Updates', () => {
  let userEmail: string
  let userPassword: string
  let userFullName: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const creds = await registerUser(page, {
      firstName: 'Status',
      lastName: 'Tester',
      password: 'StatusPass123!',
    })
    userEmail = creds.email
    userPassword = creds.password
    userFullName = creds.fullName
    await logoutUser(page)
    await page.close()
  })

  test('can set a status update from home page', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)

    const statusForm = page.locator('.status_update_form')
    await expect(statusForm.locator('.status_prefix')).toContainText(`${userFullName} is`)
    await statusForm.locator('input.status_input').fill('feeling great today')
    await statusForm.getByRole('button', { name: 'Update' }).click()

    await page.waitForLoadState('networkidle')
  })

  test('status appears on profile page after setting it', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)

    const statusForm = page.locator('.status_update_form')
    await statusForm.locator('input.status_input').fill('coding all night')
    await statusForm.getByRole('button', { name: 'Update' }).click()
    await page.waitForLoadState('networkidle')

    await page.goto('/profile.php')
    await expect(page.locator('.profile_status').first()).toContainText('coding all night')
  })

  test('shows character count', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)

    const statusForm = page.locator('.status_update_form')
    await statusForm.locator('input.status_input').fill('test')
    await expect(statusForm.locator('.char_count')).toContainText('4/255')
  })
})
