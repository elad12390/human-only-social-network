'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function createGroup(
  creatorId: string,
  name: string,
  description?: string
): Promise<{ success: boolean; error?: string; groupId?: string }> {
  // Validate: name required
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Group name is required' }
  }

  // Validate: name max 200 chars
  if (name.trim().length > 200) {
    return { success: false, error: 'Group name must be 200 characters or less' }
  }

  try {
    const [inserted] = await db.insert(schema.group).values({
      name: name.trim(),
      description: description?.trim() || null,
      creatorId,
    }).returning({ id: schema.group.id })

    const groupId = inserted.id

    // Auto-create membership for creator with admin role
    await db.insert(schema.groupMembership).values({
      groupId,
      userId: creatorId,
      role: 'admin',
    })

    // Create feed item for group creation
    await db.insert(schema.feedItem).values({
      userId: creatorId,
      type: 'group_created',
      referenceId: groupId,
    })

    return { success: true, groupId }
  } catch (error) {
    return { success: false, error: 'Failed to create group' }
  }
}

export async function getGroups(): Promise<
  Array<{
    id: string
    name: string
    description: string | null
    creatorId: string
    createdAt: Date | null
  }>
> {
  try {
    const groups = await db
      .select({
        id: schema.group.id,
        name: schema.group.name,
        description: schema.group.description,
        creatorId: schema.group.creatorId,
        createdAt: schema.group.createdAt,
      })
      .from(schema.group)
      .orderBy(desc(schema.group.createdAt))
      .limit(20)

    return groups
  } catch (error) {
    return []
  }
}

export async function getGroup(
  groupId: string
): Promise<{
  id: string
  name: string
  description: string | null
  creatorId: string
  createdAt: Date | null
} | null> {
  try {
    const groups = await db
      .select({
        id: schema.group.id,
        name: schema.group.name,
        description: schema.group.description,
        creatorId: schema.group.creatorId,
        createdAt: schema.group.createdAt,
      })
      .from(schema.group)
      .where(eq(schema.group.id, groupId))

    if (groups.length === 0) {
      return null
    }

    return groups[0]
  } catch (error) {
    return null
  }
}

export async function joinGroup(
  userId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already a member
    const existingMembership = await db
      .select()
      .from(schema.groupMembership)
      .where(
        and(
          eq(schema.groupMembership.userId, userId),
          eq(schema.groupMembership.groupId, groupId)
        )
      )

    if (existingMembership.length > 0) {
      return { success: false, error: 'Already a member of this group' }
    }

    // Insert membership with role='member'
    await db.insert(schema.groupMembership).values({
      groupId,
      userId,
      role: 'member',
    })

    // Create feed item for group join
    await db.insert(schema.feedItem).values({
      userId,
      type: 'group_joined',
      referenceId: groupId,
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to join group' }
  }
}

export async function leaveGroup(
  userId: string,
  groupId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(schema.groupMembership)
      .where(
        and(
          eq(schema.groupMembership.userId, userId),
          eq(schema.groupMembership.groupId, groupId)
        )
      )

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to leave group' }
  }
}

export async function getGroupMembers(
  groupId: string
): Promise<
  Array<{
    id: string
    userId: string
    userName: string
    role: string
    joinedAt: Date | null
  }>
> {
  try {
    const members = await db
      .select({
        id: schema.groupMembership.id,
        userId: schema.groupMembership.userId,
        userName: schema.user.name,
        role: schema.groupMembership.role,
        joinedAt: schema.groupMembership.joinedAt,
      })
      .from(schema.groupMembership)
      .innerJoin(schema.user, eq(schema.groupMembership.userId, schema.user.id))
      .where(eq(schema.groupMembership.groupId, groupId))

    return members
  } catch (error) {
    return []
  }
}

export async function createGroupWallPost(
  groupId: string,
  authorId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  // Validate: content required
  if (!content || content.trim().length === 0) {
    return { success: false, error: 'Post content is required' }
  }

  // Validate: content max 5000 chars
  if (content.trim().length > 5000) {
    return { success: false, error: 'Post content must be 5000 characters or less' }
  }

  try {
    // Check author is a member of the group
    const membership = await db
      .select()
      .from(schema.groupMembership)
      .where(
        and(
          eq(schema.groupMembership.userId, authorId),
          eq(schema.groupMembership.groupId, groupId)
        )
      )

    if (membership.length === 0) {
      return { success: false, error: 'You must be a member of this group to post' }
    }

    // Insert wall post
    await db.insert(schema.groupWallPost).values({
      groupId,
      authorId,
      content: content.trim(),
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to create post' }
  }
}

export async function getGroupWallPosts(
  groupId: string
): Promise<
  Array<{
    id: string
    authorId: string
    authorName: string
    content: string
    createdAt: Date | null
  }>
> {
  try {
    const posts = await db
      .select({
        id: schema.groupWallPost.id,
        authorId: schema.groupWallPost.authorId,
        authorName: schema.user.name,
        content: schema.groupWallPost.content,
        createdAt: schema.groupWallPost.createdAt,
      })
      .from(schema.groupWallPost)
      .innerJoin(schema.user, eq(schema.groupWallPost.authorId, schema.user.id))
      .where(eq(schema.groupWallPost.groupId, groupId))
      .orderBy(desc(schema.groupWallPost.createdAt))

    return posts
  } catch (error) {
    return []
  }
}
