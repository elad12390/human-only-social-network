import { test, expect } from '@playwright/test'
import { registerAndGetId, logoutUser, loginUser } from './helpers/test-utils'

test.describe('Messages', () => {
  let sender: { email: string; password: string; userId: string; fullName: string }
  let receiver: { email: string; password: string; userId: string; fullName: string }

  test.beforeAll(async ({ browser }) => {
    const page1 = await browser.newPage()
    sender = await registerAndGetId(page1, { firstName: 'MsgSender', lastName: 'User' })
    await logoutUser(page1)
    await page1.close()

    const page2 = await browser.newPage()
    receiver = await registerAndGetId(page2, { firstName: 'MsgReceiver', lastName: 'User' })
    await logoutUser(page2)
    await page2.close()
  })

  test('can compose and send a message', async ({ page }) => {
    await loginUser(page, sender.email, sender.password)

    await page.goto(`/inbox/compose?to=${receiver.userId}`)
    await page.locator('input[placeholder="Subject"]').fill('Hello friend!')
    await page.locator('textarea[placeholder="Write your message..."]').fill('This is a test message body.')
    await page.getByRole('button', { name: 'Send Message' }).click()

    await page.waitForURL('**/inbox', { timeout: 10000 })
  })

  test('receiver sees the message in inbox', async ({ page }) => {
    await loginUser(page, receiver.email, receiver.password)
    await page.goto('/inbox')

    await expect(page.locator('.message_row').first()).toContainText('Hello friend!')
    await expect(page.locator('.message_row').first()).toContainText(sender.fullName)
  })

  test('can read a message', async ({ page }) => {
    await loginUser(page, receiver.email, receiver.password)
    await page.goto('/inbox')

    await page.locator('.message_subject a').first().click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('.read_message')).toContainText('Hello friend!')
    await expect(page.locator('.message_body')).toContainText('This is a test message body.')
    await expect(page.locator('.read_message')).toContainText(sender.fullName)
  })

  test('sent messages appear in sent tab', async ({ page }) => {
    await loginUser(page, sender.email, sender.password)
    await page.goto('/inbox?tab=sent')

    await expect(page.locator('.message_row').first()).toContainText('Hello friend!')
    await expect(page.locator('.message_row').first()).toContainText(receiver.fullName)
  })

  test('compose page has reply prefilled from read message', async ({ page }) => {
    await loginUser(page, receiver.email, receiver.password)
    await page.goto('/inbox')

    await page.locator('.message_subject a').first().click()
    await page.waitForLoadState('networkidle')

    await page.locator('a', { hasText: 'Reply' }).click()
    await page.waitForLoadState('networkidle')

    await expect(page.locator('input[placeholder="Subject"]')).toHaveValue('Re: Hello friend!')
  })
})
