'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, and, or, inArray, desc } from 'drizzle-orm'

export interface FeedItemResult {
  id: string
  userId: string
  userName: string
  type: string
  content: string | null
  targetUserName: string | null
  createdAt: Date | null
}

async function getFriendIds(userId: string): Promise<string[]> {
  const friendships = await db
    .select({
      friendId: schema.user.id,
    })
    .from(schema.friendship)
    .innerJoin(
      schema.user,
      or(
        and(eq(schema.friendship.requesterId, userId), eq(schema.friendship.addresseeId, schema.user.id)),
        and(eq(schema.friendship.addresseeId, userId), eq(schema.friendship.requesterId, schema.user.id))
      )!
    )
    .where(eq(schema.friendship.status, 'accepted'))

  return friendships.map((f) => f.friendId)
}

export async function getFeedItems(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<FeedItemResult[]> {
  try {
    const friendIds = await getFriendIds(userId)
    const relevantUserIds = [userId, ...friendIds]

    const offset = (page - 1) * pageSize
    const feedItems = await db
      .select({
        id: schema.feedItem.id,
        userId: schema.feedItem.userId,
        userName: schema.user.name,
        type: schema.feedItem.type,
        referenceId: schema.feedItem.referenceId,
        createdAt: schema.feedItem.createdAt,
      })
      .from(schema.feedItem)
      .innerJoin(schema.user, eq(schema.feedItem.userId, schema.user.id))
      .where(inArray(schema.feedItem.userId, relevantUserIds))
      .orderBy(desc(schema.feedItem.createdAt))
      .limit(pageSize)
      .offset(offset)

    const enrichedItems: FeedItemResult[] = []

    for (const item of feedItems) {
      let content: string | null = null
      let targetUserName: string | null = null

      if (item.type === 'status_update' && item.referenceId) {
        const statusUpdates = await db
          .select()
          .from(schema.statusUpdate)
          .where(eq(schema.statusUpdate.id, item.referenceId))

        if (statusUpdates.length > 0) {
          content = statusUpdates[0].content
        }
      } else if (item.type === 'wall_post' && item.referenceId) {
        const wallPosts = await db
          .select({
            content: schema.wallPost.content,
            profileOwnerId: schema.wallPost.profileOwnerId,
          })
          .from(schema.wallPost)
          .where(eq(schema.wallPost.id, item.referenceId))

        if (wallPosts.length > 0) {
          content = wallPosts[0].content

          const owners = await db
            .select({ name: schema.user.name })
            .from(schema.user)
            .where(eq(schema.user.id, wallPosts[0].profileOwnerId))

          if (owners.length > 0) {
            targetUserName = owners[0].name
          }
        }
      } else if (item.type === 'friend_accepted' && item.referenceId) {
        const friendshipRecords = await db
          .select({
            requesterId: schema.friendship.requesterId,
            addresseeId: schema.friendship.addresseeId,
          })
          .from(schema.friendship)
          .where(eq(schema.friendship.id, item.referenceId))

        if (friendshipRecords.length > 0) {
          const friendship = friendshipRecords[0]
          const otherId = friendship.requesterId === item.userId ? friendship.addresseeId : friendship.requesterId

          const otherUsers = await db
            .select({ name: schema.user.name })
            .from(schema.user)
            .where(eq(schema.user.id, otherId))

          if (otherUsers.length > 0) {
            targetUserName = otherUsers[0].name
          }
        }
      }

      enrichedItems.push({
        id: item.id,
        userId: item.userId,
        userName: item.userName,
        type: item.type,
        content,
        targetUserName,
        createdAt: item.createdAt,
      })
    }

    return enrichedItems
  } catch (error) {
    return []
  }
}

export async function getFeedItemCount(userId: string): Promise<number> {
  try {
    const friendIds = await getFriendIds(userId)
    const relevantUserIds = [userId, ...friendIds]

    const result = await db
      .select({ count: schema.feedItem.id })
      .from(schema.feedItem)
      .where(inArray(schema.feedItem.userId, relevantUserIds))

    return result.length
  } catch (error) {
    return 0
  }
}
