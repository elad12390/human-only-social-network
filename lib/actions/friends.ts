'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, and } from 'drizzle-orm'

export async function sendFriendRequest(
  requesterId: string,
  addresseeId: string
): Promise<{ success: boolean; error?: string; friendshipId?: string }> {
  // Validate: can't friend self
  if (requesterId === addresseeId) {
    return { success: false, error: 'Cannot send friend request to yourself' }
  }

  try {
    // Check for existing friendship (any status)
    const existing = await db
      .select()
      .from(schema.friendship)
      .where(
        and(
          eq(schema.friendship.requesterId, requesterId),
          eq(schema.friendship.addresseeId, addresseeId)
        )
      )

    if (existing.length > 0) {
      return { success: false, error: 'Friend request already exists' }
    }

    // Check for reverse friendship
    const reverse = await db
      .select()
      .from(schema.friendship)
      .where(
        and(
          eq(schema.friendship.requesterId, addresseeId),
          eq(schema.friendship.addresseeId, requesterId)
        )
      )

    if (reverse.length > 0) {
      return { success: false, error: 'Friendship already exists' }
    }

    // Create friendship with pending status
    const result = await db.insert(schema.friendship).values({
      requesterId,
      addresseeId,
      status: 'pending',
    })

    const friendshipId = result.lastInsertRowid?.toString() || ''

    // Create notification for addressee
    await db.insert(schema.notification).values({
      userId: addresseeId,
      type: 'friend_request',
      referenceId: friendshipId,
      referenceType: 'friendship',
      fromUserId: requesterId,
    })

    return { success: true, friendshipId }
  } catch (error) {
    return { success: false, error: 'Failed to send friend request' }
  }
}

export async function acceptFriendRequest(
  friendshipId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch friendship
    const friendships = await db
      .select()
      .from(schema.friendship)
      .where(eq(schema.friendship.id, friendshipId))

    if (friendships.length === 0) {
      return { success: false, error: 'Friendship not found' }
    }

    const friendship = friendships[0]

    // Validate: user must be addressee
    if (friendship.addresseeId !== userId) {
      return { success: false, error: 'Only addressee can accept friend request' }
    }

    // Update status to accepted
    await db
      .update(schema.friendship)
      .set({ status: 'accepted' })
      .where(eq(schema.friendship.id, friendshipId))

    // Create feed item for requester
    await db.insert(schema.feedItem).values({
      userId: friendship.requesterId,
      type: 'friend_accepted',
      referenceId: friendshipId,
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to accept friend request' }
  }
}

export async function declineFriendRequest(
  friendshipId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch friendship
    const friendships = await db
      .select()
      .from(schema.friendship)
      .where(eq(schema.friendship.id, friendshipId))

    if (friendships.length === 0) {
      return { success: false, error: 'Friendship not found' }
    }

    const friendship = friendships[0]

    // Validate: user must be addressee
    if (friendship.addresseeId !== userId) {
      return { success: false, error: 'Only addressee can decline friend request' }
    }

    // Update status to declined
    await db
      .update(schema.friendship)
      .set({ status: 'declined' })
      .where(eq(schema.friendship.id, friendshipId))

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to decline friend request' }
  }
}

export async function unfriend(
  friendshipId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch friendship
    const friendships = await db
      .select()
      .from(schema.friendship)
      .where(eq(schema.friendship.id, friendshipId))

    if (friendships.length === 0) {
      return { success: false, error: 'Friendship not found' }
    }

    const friendship = friendships[0]

    // Validate: user must be participant
    if (friendship.requesterId !== userId && friendship.addresseeId !== userId) {
      return { success: false, error: 'Only participants can unfriend' }
    }

    // Delete friendship
    await db.delete(schema.friendship).where(eq(schema.friendship.id, friendshipId))

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to unfriend' }
  }
}

export async function getFriends(userId: string) {
  try {
    const friendships = await db
      .select({
        id: schema.friendship.id,
        friendId: schema.user.id,
        friendName: schema.user.name,
        friendEmail: schema.user.email,
        friendImage: schema.user.image,
      })
      .from(schema.friendship)
      .innerJoin(
        schema.user,
        () =>
          (eq(schema.friendship.requesterId, userId) && eq(schema.friendship.addresseeId, schema.user.id)) ||
          (eq(schema.friendship.addresseeId, userId) && eq(schema.friendship.requesterId, schema.user.id))
      )
      .where(eq(schema.friendship.status, 'accepted'))

    return friendships
  } catch (error) {
    return []
  }
}

export async function getPendingRequests(userId: string) {
  try {
    // Get pending requests where user is addressee
    const requests = await db
      .select({
        id: schema.friendship.id,
        requesterId: schema.friendship.requesterId,
        requesterName: schema.user.name,
        requesterEmail: schema.user.email,
        requesterImage: schema.user.image,
        createdAt: schema.friendship.createdAt,
      })
      .from(schema.friendship)
      .innerJoin(schema.user, eq(schema.friendship.requesterId, schema.user.id))
      .where(
        and(
          eq(schema.friendship.addresseeId, userId),
          eq(schema.friendship.status, 'pending')
        )
      )

    return requests
  } catch (error) {
    return []
  }
}

export async function getFriendshipStatus(userId1: string, userId2: string) {
  try {
    // Check if friendship exists in either direction
    const friendships = await db
      .select()
      .from(schema.friendship)
      .where(
        (friendship) =>
          (eq(friendship.requesterId, userId1) && eq(friendship.addresseeId, userId2)) ||
          (eq(friendship.requesterId, userId2) && eq(friendship.addresseeId, userId1))
      )

    return friendships.length > 0 ? friendships[0] : null
  } catch (error) {
    return null
  }
}
