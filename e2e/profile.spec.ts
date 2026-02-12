import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser } from './helpers/test-utils'

test.describe('Profile & Wall', () => {
  let userEmail: string
  let userPassword: string
  let userFullName: string

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const creds = await registerUser(page, {
      firstName: 'Profile',
      lastName: 'Tester',
      password: 'ProfilePass123!',
    })
    userEmail = creds.email
    userPassword = creds.password
    userFullName = creds.fullName
    await logoutUser(page)
    await page.close()
  })

  test('displays user name on own profile', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/profile.php')

    await expect(page.locator('.profile_name')).toContainText(userFullName)
  })

  test('shows wall, info, photos, friends tabs', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/profile.php')

    await expect(page.locator('#tabs')).toContainText('Wall')
    await expect(page.locator('#tabs')).toContainText('Info')
    await expect(page.locator('#tabs')).toContainText('Photos')
    await expect(page.locator('#tabs')).toContainText('Friends')
  })

  test('can write a wall post on own profile', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/profile.php')

    const wallForm = page.locator('.wall_post_form')
    await wallForm.locator('textarea').fill('Hello from my wall!')
    await wallForm.getByRole('button', { name: 'Post' }).click()

    await page.waitForLoadState('networkidle')
    await expect(page.locator('.wall_post_content')).toContainText('Hello from my wall!')
  })

  test('info tab shows member since date', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/profile.php')

    await page.locator('#tabs a', { hasText: 'Info' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#content')).toContainText('Member since')
  })

  test('friends tab shows friend count', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/profile.php')

    await page.locator('#tabs a', { hasText: 'Friends' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.friend_count')).toContainText('Friends (')
  })
})
