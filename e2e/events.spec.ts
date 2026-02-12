import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser } from './helpers/test-utils'

test.describe.serial('Events', () => {
  let userEmail: string
  let userPassword: string
  let eventName: string

  test.beforeAll(async ({ browser }) => {
    eventName = `TestEvent-${Date.now()}`
    const page = await browser.newPage()
    const creds = await registerUser(page, {
      firstName: 'Event',
      lastName: 'Creator',
      password: 'EventPass123!',
    })
    userEmail = creds.email
    userPassword = creds.password
    await logoutUser(page)
    await page.close()
  })

  test('can create a new event', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/events.php')

    await page.locator('.create_event_form input[placeholder="Event Name"]').fill(eventName)
    await page.locator('.create_event_form textarea[placeholder="Description (optional)"]').fill('A test event')
    await page.locator('.create_event_form input[placeholder="Location (optional)"]').fill('Test Venue')
    await page.getByRole('button', { name: 'Create Event' }).click()

    await expect(page.locator('.event_list')).toContainText(eventName, { timeout: 15000 })
  })

  test('can view event page', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/events.php')

    await page.locator('a.event_name', { hasText: eventName }).click()
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('.event_title')).toContainText(eventName)
    await expect(page.locator('.event_description')).toContainText('A test event')
    await expect(page.locator('.event_location')).toContainText('Test Venue')
  })

  test('can RSVP as attending', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/events.php')

    await page.locator('a.event_name', { hasText: eventName }).click()
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('button', { name: 'Attending' }).click()
    await page.waitForTimeout(2000)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('.rsvp_status')).toContainText('attending', { timeout: 15000 })
    await expect(page.locator('.guest_section').first()).toContainText('Event Creator')
  })

  test('can change RSVP to maybe', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/events.php')

    await page.locator('a.event_name', { hasText: eventName }).click()
    await page.waitForLoadState('domcontentloaded')

    await page.getByRole('button', { name: 'Maybe' }).click()
    await page.waitForTimeout(2000)
    await page.reload()
    await page.waitForLoadState('domcontentloaded')

    await expect(page.locator('.rsvp_status')).toContainText('maybe', { timeout: 15000 })
  })

  test('another user can RSVP to the same event', async ({ browser }) => {
    const guestPage = await browser.newPage()
    await registerUser(guestPage, {
      firstName: 'EventGuest',
      lastName: 'User',
      password: 'GuestPass123!',
    })

    await guestPage.goto('/events.php')
    await guestPage.locator('a.event_name', { hasText: eventName }).click()
    await guestPage.waitForLoadState('domcontentloaded')

    await guestPage.getByRole('button', { name: 'Attending' }).click()
    await guestPage.waitForTimeout(2000)
    await guestPage.reload()
    await guestPage.waitForLoadState('domcontentloaded')

    await expect(guestPage.locator('.guest_section').first()).toContainText('EventGuest User', { timeout: 15000 })
    await guestPage.close()
  })
})
