import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser } from './helpers/test-utils'

test.describe('Visual QA - 2007 Facebook Styling', () => {
  let userEmail: string
  let userPassword: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const creds = await registerUser(page, {
      firstName: 'Visual',
      lastName: 'Tester',
      password: 'VisualPass123!',
    })
    userEmail = creds.email
    userPassword = creds.password
    await logoutUser(page)
    await page.close()
  })

  test('body has correct 2007 base styles', async ({ page }) => {
    await page.goto('/')
    const body = page.locator('body')
    await expect(body).toHaveCSS('font-family', /lucida grande/i)
    await expect(body).toHaveCSS('font-size', '11px')
  })

  test('#book container is 799px wide and centered', async ({ page }) => {
    await page.goto('/')
    const book = page.locator('#book')
    await expect(book).toHaveCSS('width', '799px')
    await expect(book).toHaveCSS('margin-left', 'auto')
    await expect(book).toHaveCSS('margin-right', 'auto')
  })

  test('links are Facebook blue #3b5998', async ({ page }) => {
    await page.goto('/')
    const firstLink = page.locator('a').first()
    await expect(firstLink).toHaveCSS('color', 'rgb(59, 89, 152)')
  })

  test('navigator is visible when logged in', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    const nav = page.locator('#navigator')
    await expect(nav).toBeVisible()
    await expect(nav).toContainText('home')
    await expect(nav).toContainText('profile')
    await expect(nav).toContainText('friends')
    await expect(nav).toContainText('inbox')
  })

  test('sidebar is visible', async ({ page }) => {
    await page.goto('/')
    const sidebar = page.locator('#sidebar')
    await expect(sidebar).toBeVisible()
    await expect(sidebar).toContainText('humanbook')
  })

  test('registration page has welcome message', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('#welcome h1')).toContainText('Welcome to HumanBook')
    await expect(page.locator('.welcome_message')).toContainText('social utility')
  })
})
