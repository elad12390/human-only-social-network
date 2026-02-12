import { type Page, expect } from '@playwright/test'

export function uniqueEmail(prefix = 'user'): string {
  const ts = Date.now()
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${ts}-${rand}@test.com`
}

export function uniqueName(prefix = 'Test'): { first: string; last: string } {
  const rand = Math.random().toString(36).slice(2, 6)
  return { first: `${prefix}`, last: `User${rand}` }
}

export async function registerUser(
  page: Page,
  options?: { firstName?: string; lastName?: string; email?: string; password?: string }
): Promise<{ email: string; password: string; firstName: string; lastName: string; fullName: string }> {
  const name = uniqueName(options?.firstName ?? 'Test')
  const firstName = options?.firstName ?? name.first
  const lastName = options?.lastName ?? name.last
  const email = options?.email ?? uniqueEmail('reg')
  const password = options?.password ?? 'TestPassword123!'

  await page.goto('/')
  const regForm = page.locator('#welcome')
  await regForm.locator('#firstName').fill(firstName)
  await regForm.locator('#lastName').fill(lastName)
  await regForm.locator('#email').fill(email)
  await regForm.locator('#password').fill(password)
  await regForm.locator('#confirmPassword').fill(password)
  await regForm.locator('#isHuman').check()
  await regForm.locator('#noAiContent').check()
  await regForm.getByRole('button', { name: 'Sign Up' }).click()

  await page.waitForURL('**/home.php', { timeout: 15000 })

  return { email, password, firstName, lastName, fullName: `${firstName} ${lastName}` }
}

export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/')

  const loginForm = page.locator('#squicklogin')
  await loginForm.locator('#email').fill(email)
  await loginForm.locator('#password').fill(password)
  await loginForm.locator('input[type="submit"][value="Login"]').click()

  await page.waitForURL('**/home.php', { timeout: 15000 })
}

export async function logoutUser(page: Page): Promise<void> {
  await page.goto('/api/auth/sign-out')
  await page.waitForLoadState('networkidle')
}

export async function getCurrentUserId(page: Page): Promise<string> {
  await page.goto('/profile.php')
  const url = page.url()
  const match = url.match(/id=([^&]+)/)
  if (match) {
    return match[1]
  }
  const profileLink = page.locator('a[href^="/profile.php?id="]').first()
  const href = await profileLink.getAttribute('href')
  const idMatch = href?.match(/id=([^&]+)/)
  if (idMatch) {
    return idMatch[1]
  }
  throw new Error('Could not determine current user ID')
}

export async function waitForReload(page: Page): Promise<void> {
  await page.waitForLoadState('networkidle')
}

export async function expectOnHomePage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/home\.php/)
}

export async function registerAndGetId(
  page: Page,
  options?: { firstName?: string; lastName?: string }
): Promise<{ email: string; password: string; firstName: string; lastName: string; fullName: string; userId: string }> {
  const creds = await registerUser(page, options)
  const userId = await getCurrentUserId(page)
  return { ...creds, userId }
}
