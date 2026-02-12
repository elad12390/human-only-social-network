import { test, expect } from '@playwright/test'
import { registerAndGetId, logoutUser, loginUser, pageContent } from './helpers/test-utils'

test.describe('Poke', () => {
  let userA: { email: string; password: string; userId: string; fullName: string }
  let userB: { email: string; password: string; userId: string; fullName: string }

  test.beforeAll(async ({ browser }) => {
    const pageA = await browser.newPage()
    userA = await registerAndGetId(pageA, { firstName: 'PokeA', lastName: 'User' })
    await logoutUser(pageA)
    await pageA.close()

    const pageB = await browser.newPage()
    userB = await registerAndGetId(pageB, { firstName: 'PokeB', lastName: 'User' })
    await logoutUser(pageB)
    await pageB.close()

    const page1 = await browser.newPage()
    await loginUser(page1, userA.email, userA.password)
    await page1.goto(`/profile.php?id=${userB.userId}`)
    await page1.locator('.friend_button').getByRole('button', { name: `Add ${userB.fullName} as a Friend` }).click()
    await page1.waitForLoadState('networkidle')
    await logoutUser(page1)
    await page1.close()

    const page2 = await browser.newPage()
    await loginUser(page2, userB.email, userB.password)
    await page2.goto('/reqs.php')
    await page2.getByRole('button', { name: 'Confirm' }).first().click()
    await page2.waitForLoadState('networkidle')
    await logoutUser(page2)
    await page2.close()
  })

  test('can poke a friend from their profile', async ({ page }) => {
    await loginUser(page, userA.email, userA.password)
    await page.goto(`/profile.php?id=${userB.userId}`)

    await page.getByRole('button', { name: `Poke ${userB.fullName}` }).click()
    await expect(pageContent(page)).toContainText(`You poked ${userB.fullName}`)
  })

  test('poked user sees poke notification on home page', async ({ page }) => {
    await loginUser(page, userB.email, userB.password)
    await page.goto('/home.php')

    await expect(pageContent(page)).toContainText(`poked you`)
  })

  test('can poke back', async ({ page }) => {
    await loginUser(page, userB.email, userB.password)
    await page.goto('/home.php')

    await page.getByText('Poke Back').first().click()
    await expect(page.getByText('Poked back!')).toBeVisible({ timeout: 5000 })
  })
})
