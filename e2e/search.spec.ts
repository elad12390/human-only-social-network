import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser } from './helpers/test-utils'

test.describe('Search', () => {
  let userEmail: string
  let userPassword: string
  const searchableName = `Searchable${Date.now()}`

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const creds = await registerUser(page, {
      firstName: searchableName,
      lastName: 'Person',
      password: 'SearchPass123!',
    })
    userEmail = creds.email
    userPassword = creds.password
    await logoutUser(page)
    await page.close()
  })

  test('can search for a user by name', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)

    await page.goto(`/search.php?q=${searchableName}`)

    await expect(page.locator('#content')).toContainText(searchableName)
    await expect(page.locator('#content')).toContainText('View Profile')
  })

  test('shows no results for nonexistent user', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)

    await page.goto('/search.php?q=NonexistentUserXYZ999')

    await expect(page.locator('#content')).toContainText('No results found')
  })

  test('shows prompt when no search term', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/search.php')

    await expect(page.locator('#content')).toContainText('Enter a search term')
  })

  test('can use sidebar search form', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)

    const searchInput = page.locator('#qsearch input[name="q"]')
    await searchInput.fill(searchableName)
    await searchInput.press('Enter')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveURL(new RegExp(`search\\.php.*q=${searchableName}`))
    await expect(page.locator('#content')).toContainText(searchableName)
  })
})
