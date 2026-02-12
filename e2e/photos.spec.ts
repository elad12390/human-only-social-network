import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser, pageContent } from './helpers/test-utils'

test.describe.serial('Photos & Albums', () => {
  let userEmail: string
  let userPassword: string
  let albumName: string

  test.beforeAll(async ({ browser }) => {
    albumName = `Album-${Date.now()}`
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

    await expect(page.locator('.album_list')).toContainText(albumName, { timeout: 15000 })
  })

  test('can view album page', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/photos.php')

    await page.locator('a.album_name', { hasText: albumName }).click()
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('.grayheader').first()).toContainText(albumName)
    await expect(pageContent(page)).toContainText('My test album')
  })

  test('photos tab on profile links to photos page', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/profile.php')

    await page.locator('#tabs a', { hasText: 'Photos' }).click()
    await page.waitForLoadState('domcontentloaded')

    await page.locator('a', { hasText: 'See All Photos' }).click()
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('.grayheader').first()).toContainText("Photo Tester's Photos")
  })
})
