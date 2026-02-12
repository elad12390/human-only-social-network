import { test, expect } from '@playwright/test'
import { registerUser, logoutUser, loginUser } from './helpers/test-utils'

test.describe('Events', () => {
  let userEmail: string
  let userPassword: string
  const eventName = `TestEvent-${Date.now()}`

  test.beforeAll(async ({ browser }) => {
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
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.event_list')).toContainText(eventName)
  })

  test('can view event page', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/events.php')

    await page.locator('.event_name', { hasText: eventName }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.event_title')).toContainText(eventName)
    await expect(page.locator('.event_description')).toContainText('A test event')
    await expect(page.locator('.event_location')).toContainText('Test Venue')
  })

  test('can RSVP as attending', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/events.php')

    await page.locator('.event_name', { hasText: eventName }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Attending' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.rsvp_status')).toContainText('attending')
    await expect(page.locator('.guest_section')).toContainText('Event Creator')
  })

  test('can change RSVP to maybe', async ({ page }) => {
    await loginUser(page, userEmail, userPassword)
    await page.goto('/events.php')

    await page.locator('.event_name', { hasText: eventName }).click()
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: 'Maybe' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.rsvp_status')).toContainText('maybe')
  })

  test('another user can RSVP to the same event', async ({ page, browser }) => {
    const guestPage = await browser.newPage()
    await registerUser(guestPage, {
      firstName: 'EventGuest',
      lastName: 'User',
      password: 'GuestPass123!',
    })

    await guestPage.goto('/events.php')
    await guestPage.locator('.event_name', { hasText: eventName }).click()
    await guestPage.waitForLoadState('networkidle')

    await guestPage.getByRole('button', { name: 'Attending' }).click()
    await guestPage.waitForLoadState('networkidle')

    await expect(guestPage.locator('.guest_section')).toContainText('EventGuest User')
    await guestPage.close()
  })
})
