'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'
import { getPendingRequests } from '@/lib/actions/friends'
import { getUnreadCount } from '@/lib/actions/messages'
import { getUnseenPokes } from '@/lib/actions/poke'

export async function getNotifications(userId: string): Promise<
  Array<{
    id: string
    userId: string
    type: string
    referenceId: string | null
    referenceType: string | null
    fromUserId: string | null
    fromUserName: string | null
    read: boolean | null
    createdAt: Date | null
  }>
> {
  try {
    const notifications = await db
      .select({
        id: schema.notification.id,
        userId: schema.notification.userId,
        type: schema.notification.type,
        referenceId: schema.notification.referenceId,
        referenceType: schema.notification.referenceType,
        fromUserId: schema.notification.fromUserId,
        fromUserName: schema.user.name,
        read: schema.notification.read,
        createdAt: schema.notification.createdAt,
      })
      .from(schema.notification)
      .leftJoin(schema.user, eq(schema.notification.fromUserId, schema.user.id))
      .where(eq(schema.notification.userId, userId))
      .orderBy(desc(schema.notification.createdAt))
      .limit(50)

    return notifications
  } catch (error) {
    return []
  }
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const notifications = await db
      .select()
      .from(schema.notification)
      .where(and(eq(schema.notification.userId, userId), eq(schema.notification.read, false)))

    return notifications.length
  } catch (error) {
    return 0
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<{ success: boolean }> {
  try {
    await db
      .update(schema.notification)
      .set({ read: true })
      .where(eq(schema.notification.id, notificationId))

    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<{ success: boolean }> {
  try {
    await db
      .update(schema.notification)
      .set({ read: true })
      .where(and(eq(schema.notification.userId, userId), eq(schema.notification.read, false)))

    return { success: true }
  } catch (error) {
    return { success: false }
  }
}

export async function getNavigatorCounts(userId: string): Promise<{
  friendRequests: number
  unreadMessages: number
  unseenPokes: number
}> {
  try {
    const friendRequests = await getPendingRequests(userId)
    const unreadMessages = await getUnreadCount(userId)
    const unseenPokes = await getUnseenPokes(userId)

    return {
      friendRequests: friendRequests.length,
      unreadMessages,
      unseenPokes: unseenPokes.length,
    }
  } catch (error) {
    return {
      friendRequests: 0,
      unreadMessages: 0,
      unseenPokes: 0,
    }
  }
}
