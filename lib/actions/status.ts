'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function createStatusUpdate(
  userId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  if (!content || content.trim().length === 0) {
    return { success: false, error: 'Status cannot be empty' }
  }

  if (content.length > 255) {
    return { success: false, error: 'Status cannot exceed 255 characters' }
  }

  try {
    const sanitizedContent = content.trim()

    const statusUpdate = await db.insert(schema.statusUpdate).values({
      userId,
      content: sanitizedContent,
    })

    await db.insert(schema.feedItem).values({
      userId,
      type: 'status_update',
      referenceId: statusUpdate.lastInsertRowid?.toString() || '',
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to create status update' }
  }
}

export async function getLatestStatus(userId: string) {
  try {
    const statuses = await db
      .select({
        id: schema.statusUpdate.id,
        content: schema.statusUpdate.content,
        createdAt: schema.statusUpdate.createdAt,
      })
      .from(schema.statusUpdate)
      .where(eq(schema.statusUpdate.userId, userId))
      .orderBy(desc(schema.statusUpdate.createdAt))
      .limit(1)

    return statuses[0] || null
  } catch (error) {
    return null
  }
}
