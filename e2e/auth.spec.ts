import { test, expect } from '@playwright/test'
import { registerUser, loginUser, logoutUser, uniqueEmail } from './helpers/test-utils'

test.describe('Registration', () => {
  test('registers a new user and redirects to home', async ({ page }) => {
    const email = uniqueEmail('newuser')
    await page.goto('/')

    const reg = page.locator('#welcome')
    await reg.locator('#firstName').fill('Alice')
    await reg.locator('#lastName').fill('Wonder')
    await reg.locator('#email').fill(email)
    await reg.locator('#password').fill('SecurePass123!')
    await reg.locator('#confirmPassword').fill('SecurePass123!')
    await reg.locator('#isHuman').check()
    await reg.locator('#noAiContent').check()
    await reg.getByRole('button', { name: 'Sign Up' }).click()

    await page.waitForURL('**/home.php', { timeout: 15000 })
    await expect(page).toHaveURL(/\/home\.php/)
  })

  test('shows error when passwords do not match', async ({ page }) => {
    await page.goto('/')

    const reg = page.locator('#welcome')
    await reg.locator('#firstName').fill('Bob')
    await reg.locator('#lastName').fill('Test')
    await reg.locator('#email').fill(uniqueEmail('mismatch'))
    await reg.locator('#password').fill('Password123!')
    await reg.locator('#confirmPassword').fill('DifferentPass!')
    await reg.locator('#isHuman').check()
    await reg.locator('#noAiContent').check()
    await reg.getByRole('button', { name: 'Sign Up' }).click()

    await expect(page.locator('#error')).toContainText('Passwords do not match')
  })

  test('shows error when human checkbox is unchecked', async ({ page }) => {
    await page.goto('/')

    const reg = page.locator('#welcome')
    await reg.locator('#firstName').fill('Bot')
    await reg.locator('#lastName').fill('User')
    await reg.locator('#email').fill(uniqueEmail('bot'))
    await reg.locator('#password').fill('Password123!')
    await reg.locator('#confirmPassword').fill('Password123!')
    await reg.locator('#noAiContent').check()
    await reg.getByRole('button', { name: 'Sign Up' }).click()

    await expect(page.locator('#error')).toContainText('You must confirm that you are human')
  })

  test('shows error when required fields are empty', async ({ page }) => {
    await page.goto('/')

    await page.getByRole('button', { name: 'Sign Up' }).click()

    await expect(page.locator('#error')).toContainText('First name is required')
  })
})

test.describe('Login and Logout', () => {
  let testEmail: string
  const testPassword = 'LoginTestPass123!'

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const creds = await registerUser(page, { password: testPassword })
    testEmail = creds.email
    await logoutUser(page)
    await page.close()
  })

  test('logs in via sidebar form and redirects to home', async ({ page }) => {
    await loginUser(page, testEmail, testPassword)
    await expect(page).toHaveURL(/\/home\.php/)
  })

  test('shows error for wrong password', async ({ page }) => {
    await page.goto('/')

    const loginForm = page.locator('#squicklogin')
    await loginForm.locator('#email').fill(testEmail)
    await loginForm.locator('#password').fill('WrongPassword!')
    await loginForm.locator('input[type="submit"][value="Login"]').click()

    await expect(page.locator('#squicklogin')).toContainText(/failed|invalid|error/i)
  })

  test('logs out and can no longer access protected pages', async ({ page }) => {
    await loginUser(page, testEmail, testPassword)
    await expect(page).toHaveURL(/\/home\.php/)

    await logoutUser(page)

    await page.goto('/home.php')
    await page.waitForURL('**/', { timeout: 10000 })
    await expect(page).not.toHaveURL(/\/home\.php/)
  })
})
