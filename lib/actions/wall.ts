'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

export async function createWallPost(
  authorId: string,
  profileOwnerId: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  if (!content || content.trim().length === 0) {
    return { success: false, error: 'Wall post content cannot be empty' }
  }

  if (content.length > 5000) {
    return { success: false, error: 'Wall post content cannot exceed 5000 characters' }
  }

  try {
    const sanitizedContent = content.trim()

    const wallPost = await db.insert(schema.wallPost).values({
      authorId,
      profileOwnerId,
      content: sanitizedContent,
    })

    await db.insert(schema.feedItem).values({
      userId: profileOwnerId,
      type: 'wall_post',
      referenceId: wallPost.lastInsertRowid?.toString() || '',
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to create wall post' }
  }
}

export async function getWallPosts(profileOwnerId: string) {
  try {
    const posts = await db
      .select({
        id: schema.wallPost.id,
        authorId: schema.wallPost.authorId,
        authorName: schema.user.name,
        content: schema.wallPost.content,
        createdAt: schema.wallPost.createdAt,
      })
      .from(schema.wallPost)
      .innerJoin(schema.user, eq(schema.wallPost.authorId, schema.user.id))
      .where(eq(schema.wallPost.profileOwnerId, profileOwnerId))
      .orderBy(desc(schema.wallPost.createdAt))

    return posts
  } catch (error) {
    return []
  }
}
