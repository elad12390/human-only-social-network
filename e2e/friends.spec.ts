import { test, expect } from '@playwright/test'
import { registerAndGetId, logoutUser, loginUser, pageContent } from './helpers/test-utils'

test.describe('Friend System', () => {
  let userA: { email: string; password: string; userId: string; fullName: string }
  let userB: { email: string; password: string; userId: string; fullName: string }

  test.beforeAll(async ({ browser }) => {
    const pageA = await browser.newPage()
    userA = await registerAndGetId(pageA, { firstName: 'FriendA', lastName: 'Test' })
    await logoutUser(pageA)
    await pageA.close()

    const pageB = await browser.newPage()
    userB = await registerAndGetId(pageB, { firstName: 'FriendB', lastName: 'Test' })
    await logoutUser(pageB)
    await pageB.close()
  })

  test('can send a friend request', async ({ page }) => {
    await loginUser(page, userA.email, userA.password)
    await page.goto(`/profile.php?id=${userB.userId}`)

    const friendBtn = page.locator('.friend_button')
    await expect(friendBtn).toContainText(`Add ${userB.fullName} as a Friend`)
    await friendBtn.getByRole('button', { name: `Add ${userB.fullName} as a Friend` }).click()

    await page.waitForLoadState('networkidle')
    await expect(friendBtn).toContainText('Friend Request Sent')
  })

  test('other user sees pending request and can accept', async ({ page }) => {
    await loginUser(page, userB.email, userB.password)

    await page.goto('/reqs.php')
    await expect(page.locator('.friend_request_item')).toContainText(userA.fullName)

    await page.getByRole('button', { name: 'Confirm' }).first().click()
    await page.waitForLoadState('networkidle')

    await expect(pageContent(page)).toContainText('no pending friend requests')
  })

  test('friendship is shown on profile after acceptance', async ({ page }) => {
    await loginUser(page, userA.email, userA.password)
    await page.goto(`/profile.php?id=${userB.userId}`)

    const friendBtn = page.locator('.friend_button')
    await expect(friendBtn).toContainText(`You are friends with ${userB.fullName}`)
  })

  test('can unfriend', async ({ page }) => {
    await loginUser(page, userA.email, userA.password)
    await page.goto(`/profile.php?id=${userB.userId}`)

    const friendBtn = page.locator('.friend_button')
    await friendBtn.getByText('Remove from Friends').click()
    await page.waitForLoadState('networkidle')

    await expect(friendBtn).toContainText(`Add ${userB.fullName} as a Friend`)
  })
})
