import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser } from './helpers/test-utils'

test.describe('Photos & Albums', () => {
  let userEmail: string
  let userPassword: string
  const albumName = `Album-${Date.now()}`

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage()
    const creds = await registerUser(page, {
      firstName: 'Photo',
      lastName: 'Tester',
      password: 'PhotoPass123!',
    })
    userEmail = creds.email
    userPassword = creds.password
    await logoutUser(page)
    await page.close()
  })

  test('can create a new album', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/photos.php')

    await page.locator('.create_album_form input[placeholder="Album Name"]').fill(albumName)
    await page.locator('.create_album_form textarea[placeholder="Description (optional)"]').fill('My test album')
    await page.getByRole('button', { name: 'Create Album' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.album_list')).toContainText(albumName)
  })

  test('can view album page', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/photos.php')

    await page.locator('.album_name', { hasText: albumName }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.grayheader')).toContainText(albumName)
    await expect(page.locator('#content')).toContainText('My test album')
  })

  test('photos tab on profile links to photos page', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/profile.php')

    await page.locator('#tabs a', { hasText: 'Photos' }).click()
    await page.waitForLoadState('networkidle')

    await page.locator('a', { hasText: 'See All Photos' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.grayheader')).toContainText("Photo Tester's Photos")
  })
})
