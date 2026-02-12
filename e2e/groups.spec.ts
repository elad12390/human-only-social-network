import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser } from './helpers/test-utils'

test.describe('Groups', () => {
  let userEmail: string
  let userPassword: string
  const groupName = `TestGroup-${Date.now()}`

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const creds = await registerUser(page, {
      firstName: 'Group',
      lastName: 'Creator',
      password: 'GroupPass123!',
    })
    userEmail = creds.email
    userPassword = creds.password
    await logoutUser(page)
    await page.close()
  })

  test('can create a new group', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/groups.php')

    await page.locator('.create_group_form input[placeholder="Group Name"]').fill(groupName)
    await page.locator('.create_group_form textarea[placeholder="Description (optional)"]').fill('A test group')
    await page.getByRole('button', { name: 'Create Group' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.group_list')).toContainText(groupName)
  })

  test('can view group page', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/groups.php')

    await page.locator('.group_name', { hasText: groupName }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.group_title')).toContainText(groupName)
    await expect(page.locator('.group_description')).toContainText('A test group')
  })

  test('creator is automatically a member', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/groups.php')

    await page.locator('.group_name', { hasText: groupName }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.group_members')).toContainText('Group Creator')
  })

  test('can write on group wall as member', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/groups.php')

    await page.locator('.group_name', { hasText: groupName }).click()
    await page.waitForLoadState('networkidle')

    await page.locator('textarea[placeholder="Write on the group wall..."]').fill('Hello group!')
    await page.getByRole('button', { name: 'Post' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.post_content')).toContainText('Hello group!')
  })

  test('another user can join and leave', async ({ page, browser }) => {
    const joinerPage = await browser.newPage()
    const joiner = await registerUser(joinerPage, {
      firstName: 'Joiner',
      lastName: 'User',
      password: 'JoinPass123!',
    })

    await joinerPage.goto('/groups.php')
    await joinerPage.locator('.group_name', { hasText: groupName }).click()
    await joinerPage.waitForLoadState('networkidle')

    await joinerPage.getByRole('button', { name: 'Join Group' }).click()
    await joinerPage.waitForLoadState('networkidle')

    await expect(joinerPage.locator('.group_members')).toContainText('Joiner User')

    await joinerPage.getByRole('button', { name: 'Leave Group' }).click()
    await joinerPage.waitForLoadState('networkidle')

    await expect(joinerPage.locator('.group_members')).not.toContainText('Joiner User')
    await joinerPage.close()
  })
})
