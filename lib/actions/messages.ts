'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, and, desc, count } from 'drizzle-orm'

export async function sendMessage(
  senderId: string,
  recipientId: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string; messageId?: string }> {
  // Validate: subject required
  if (!subject || subject.trim().length === 0) {
    return { success: false, error: 'Subject is required' }
  }

  // Validate: body required
  if (!body || body.trim().length === 0) {
    return { success: false, error: 'Message body is required' }
  }

  // Validate: can't message self
  if (senderId === recipientId) {
    return { success: false, error: 'Cannot send message to yourself' }
  }

  try {
    // Insert message
    const messageResult = await db.insert(schema.message).values({
      senderId,
      recipientId,
      subject: subject.trim(),
      body: body.trim(),
    })

    const messageId = messageResult.lastInsertRowid?.toString() || ''

    // Create notification
    await db.insert(schema.notification).values({
      userId: recipientId,
      type: 'new_message',
      referenceId: messageId,
      referenceType: 'message',
      fromUserId: senderId,
    })

    return { success: true, messageId }
  } catch (error) {
    return { success: false, error: 'Failed to send message' }
  }
}

export async function getInboxMessages(
  userId: string
): Promise<
  Array<{
    id: string
    senderId: string
    senderName: string
    subject: string
    read: boolean | null
    createdAt: Date | null
  }>
> {
  try {
    const messages = await db
      .select({
        id: schema.message.id,
        senderId: schema.message.senderId,
        senderName: schema.user.name,
        subject: schema.message.subject,
        read: schema.message.read,
        createdAt: schema.message.createdAt,
      })
      .from(schema.message)
      .innerJoin(schema.user, eq(schema.message.senderId, schema.user.id))
      .where(eq(schema.message.recipientId, userId))
      .orderBy(desc(schema.message.createdAt))

    return messages
  } catch (error) {
    return []
  }
}

export async function getSentMessages(
  userId: string
): Promise<
  Array<{
    id: string
    recipientId: string
    recipientName: string
    subject: string
    createdAt: Date | null
  }>
> {
  try {
    const messages = await db
      .select({
        id: schema.message.id,
        recipientId: schema.message.recipientId,
        recipientName: schema.user.name,
        subject: schema.message.subject,
        createdAt: schema.message.createdAt,
      })
      .from(schema.message)
      .innerJoin(schema.user, eq(schema.message.recipientId, schema.user.id))
      .where(eq(schema.message.senderId, userId))
      .orderBy(desc(schema.message.createdAt))

    return messages
  } catch (error) {
    return []
  }
}

export async function getMessage(
  messageId: string
): Promise<{
  id: string
  senderId: string
  senderName: string
  recipientId: string
  recipientName: string
  subject: string
  body: string
  read: boolean | null
  createdAt: Date | null
} | null> {
  try {
    // Get the message record
    const messages = await db
      .select()
      .from(schema.message)
      .where(eq(schema.message.id, messageId))

    if (messages.length === 0) {
      return null
    }

    const message = messages[0]

    // Get sender name
    const senders = await db
      .select({ name: schema.user.name })
      .from(schema.user)
      .where(eq(schema.user.id, message.senderId))

    const senderName = senders[0]?.name || ''

    // Get recipient name
    const recipients = await db
      .select({ name: schema.user.name })
      .from(schema.user)
      .where(eq(schema.user.id, message.recipientId))

    const recipientName = recipients[0]?.name || ''

    return {
      id: message.id,
      senderId: message.senderId,
      senderName,
      recipientId: message.recipientId,
      recipientName,
      subject: message.subject,
      body: message.body,
      read: message.read,
      createdAt: message.createdAt,
    }
  } catch (error) {
    return null
  }
}

export async function markAsRead(messageId: string): Promise<void> {
  try {
    await db
      .update(schema.message)
      .set({ read: true })
      .where(eq(schema.message.id, messageId))
  } catch (error) {
    // Silently fail
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(schema.message)
      .where(
        and(
          eq(schema.message.recipientId, userId),
          eq(schema.message.read, false)
        )
      )

    return result[0]?.count || 0
  } catch (error) {
    return 0
  }
}
