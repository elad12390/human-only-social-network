'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, and, or, inArray } from 'drizzle-orm'

export interface FeedItemResult {
  id: string
  userId: string
  userName: string
  type: string
  content: string | null
  targetUserName: string | null
  createdAt: Date | null
}

export async function getFeedItems(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<FeedItemResult[]> {
  try {
    // Get user's friend IDs (accepted friendships)
    const friendships = await db
      .select({
        friendId: schema.user.id,
      })
      .from(schema.friendship)
      .innerJoin(
        schema.user,
        () =>
          (eq(schema.friendship.requesterId, userId) && eq(schema.friendship.addresseeId, schema.user.id)) ||
          (eq(schema.friendship.addresseeId, userId) && eq(schema.friendship.requesterId, schema.user.id))
      )
      .where(eq(schema.friendship.status, 'accepted'))

    const friendIds = friendships.map((f) => f.friendId)

    // Include user's own ID in the list
    const relevantUserIds = [userId, ...friendIds]

    // Query feed items with pagination
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
      .orderBy((t) => t.createdAt)
      .limit(pageSize)
      .offset(offset)

    // Enrich each feed item based on type
    const enrichedItems: FeedItemResult[] = []

    for (const item of feedItems) {
      let content: string | null = null
      let targetUserName: string | null = null

      if (item.type === 'status_update' && item.referenceId) {
        // Query status update content
        const statusUpdates = await db
          .select()
          .from(schema.statusUpdate)
          .where(eq(schema.statusUpdate.id, item.referenceId))

        if (statusUpdates.length > 0) {
          content = statusUpdates[0].content
        }
      } else if (item.type === 'wall_post' && item.referenceId) {
        // Query wall post content and profile owner
        const wallPosts = await db
          .select({
            content: schema.wallPost.content,
            profileOwnerId: schema.wallPost.profileOwnerId,
          })
          .from(schema.wallPost)
          .where(eq(schema.wallPost.id, item.referenceId))

        if (wallPosts.length > 0) {
          content = wallPosts[0].content

          // Get profile owner name
          const owners = await db
            .select({ name: schema.user.name })
            .from(schema.user)
            .where(eq(schema.user.id, wallPosts[0].profileOwnerId))

          if (owners.length > 0) {
            targetUserName = owners[0].name
          }
        }
      } else if (item.type === 'friend_accepted' && item.referenceId) {
        // Query friendship to get both user names
        const friendshipRecords = await db
          .select({
            requesterId: schema.friendship.requesterId,
            addresseeId: schema.friendship.addresseeId,
          })
          .from(schema.friendship)
          .where(eq(schema.friendship.id, item.referenceId))

        if (friendshipRecords.length > 0) {
          const friendship = friendshipRecords[0]
          // Get the other user's name (not the feed item creator)
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
    // Get user's friend IDs (accepted friendships)
    const friendships = await db
      .select({
        friendId: schema.user.id,
      })
      .from(schema.friendship)
      .innerJoin(
        schema.user,
        () =>
          (eq(schema.friendship.requesterId, userId) && eq(schema.friendship.addresseeId, schema.user.id)) ||
          (eq(schema.friendship.addresseeId, userId) && eq(schema.friendship.requesterId, schema.user.id))
      )
      .where(eq(schema.friendship.status, 'accepted'))

    const friendIds = friendships.map((f) => f.friendId)

    // Include user's own ID in the list
    const relevantUserIds = [userId, ...friendIds]

    // Count feed items
    const result = await db
      .select({ count: schema.feedItem.id })
      .from(schema.feedItem)
      .where(inArray(schema.feedItem.userId, relevantUserIds))

    return result.length
  } catch (error) {
    return 0
  }
}
