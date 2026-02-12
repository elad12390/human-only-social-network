import { test, expect } from '@playwright/test'
import { registerAndGetId, logoutUser, loginUser } from './helpers/test-utils'

test.describe('News Feed', () => {
  let userA: { email: string; password: string; userId: string; fullName: string }
  let userB: { email: string; password: string; userId: string; fullName: string }

  test.beforeAll(async ({ browser }) => {
    const pageA = await browser.newPage()
    userA = await registerAndGetId(pageA, { firstName: 'FeedA', lastName: 'User' })
    await logoutUser(pageA)
    await pageA.close()

    const pageB = await browser.newPage()
    userB = await registerAndGetId(pageB, { firstName: 'FeedB', lastName: 'User' })
    await logoutUser(pageB)
    await pageB.close()

    const page1 = await browser.newPage()
    await loginUser(page1, userA.email, userA.password)
    await page1.goto(`/profile.php?id=${userB.userId}`)
    await page1.getByRole('button', { name: `Add ${userB.fullName} as a Friend` }).click()
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

  test('shows empty feed message when no activity', async ({ page }) => {
    const newPage = await page.context().browser()!.newPage()
    const freshUser = await registerAndGetId(newPage, { firstName: 'Lonely', lastName: 'User' })
    await expect(newPage.locator('.feed_empty')).toContainText('No news to show')
    await newPage.close()
  })

  test('shows friend status update in feed', async ({ page }) => {
    await loginUser(page, userB.email, userB.password)
    const statusForm = page.locator('.status_update_form')
    await statusForm.locator('input.status_input').fill('hello from feed test')
    await statusForm.getByRole('button', { name: 'Update' }).click()
    await page.waitForLoadState('networkidle')
    await logoutUser(page)

    await loginUser(page, userA.email, userA.password)
    await expect(page.locator('.feed_item').first()).toContainText('hello from feed test')
  })
})
