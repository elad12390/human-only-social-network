import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser, pageContent } from './helpers/test-utils'

test.describe('Search', () => {
  let searcherEmail: string
  let searcherPassword: string
  let targetName: string

  test.beforeAll(async ({ browser }) => {
    const targetPage = await browser.newPage()
    const targetCreds = await registerUser(targetPage, {
      firstName: `Findable${Date.now()}`,
      lastName: 'Person',
      password: 'FindPass123!',
    })
    targetName = targetCreds.firstName
    await logoutUser(targetPage)
    await targetPage.close()

    const searcherPage = await browser.newPage()
    const searcherCreds = await registerUser(searcherPage, {
      firstName: 'Searcher',
      lastName: 'User',
      password: 'SearchPass123!',
    })
    searcherEmail = searcherCreds.email
    searcherPassword = searcherCreds.password
    await logoutUser(searcherPage)
    await searcherPage.close()
  })

  test('can search for a user by name', async ({ page }) => {
    await loginUser(page, searcherEmail, searcherPassword)

    await page.goto(`/search.php?q=${targetName}`)

    await expect(pageContent(page)).toContainText(targetName)
    await expect(pageContent(page)).toContainText('View Profile')
  })

  test('shows no results for nonexistent user', async ({ page }) => {
    await loginUser(page, searcherEmail, searcherPassword)

    await page.goto('/search.php?q=NonexistentUserXYZ999')

    await expect(pageContent(page)).toContainText('No results found')
  })

  test('shows prompt when no search term', async ({ page }) => {
    await loginUser(page, searcherEmail, searcherPassword)
    await page.goto('/search.php')

    await expect(pageContent(page)).toContainText('Enter a search term')
  })

  test('can use sidebar search form', async ({ page }) => {
    await loginUser(page, searcherEmail, searcherPassword)

    const searchInput = page.locator('#qsearch input[name="q"]')
    await searchInput.fill(targetName)
    await searchInput.press('Enter')
    await page.waitForLoadState('domcontentloaded')

    await expect(page).toHaveURL(new RegExp(`search\\.php.*q=${targetName}`))
    await expect(pageContent(page)).toContainText(targetName)
  })
})
