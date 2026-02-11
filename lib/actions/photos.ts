'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, and, desc, count } from 'drizzle-orm'

export async function createAlbum(
  userId: string,
  name: string,
  description?: string
): Promise<{ success: boolean; error?: string; albumId?: string }> {
  // Validate: name required
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Album name is required' }
  }

  // Validate: max 200 chars
  if (name.length > 200) {
    return { success: false, error: 'Album name must be 200 characters or less' }
  }

  try {
    const result = await db.insert(schema.photoAlbum).values({
      userId,
      name: name.trim(),
      description: description?.trim() || null,
    })

    const albumId = result.lastInsertRowid?.toString() || ''

    return { success: true, albumId }
  } catch (error) {
    return { success: false, error: 'Failed to create album' }
  }
}

export async function getAlbums(
  userId: string
): Promise<
  Array<{
    id: string
    name: string
    description: string | null
    createdAt: Date | null
    photoCount: number
  }>
> {
  try {
    const albums = await db
      .select({
        id: schema.photoAlbum.id,
        name: schema.photoAlbum.name,
        description: schema.photoAlbum.description,
        createdAt: schema.photoAlbum.createdAt,
      })
      .from(schema.photoAlbum)
      .where(eq(schema.photoAlbum.userId, userId))
      .orderBy(desc(schema.photoAlbum.createdAt))

    // Get photo counts for each album
    const albumsWithCounts = await Promise.all(
      albums.map(async (album) => {
        const photoCountResult = await db
          .select({ count: count() })
          .from(schema.photo)
          .where(eq(schema.photo.albumId, album.id))

        return {
          ...album,
          photoCount: photoCountResult[0]?.count || 0,
        }
      })
    )

    return albumsWithCounts
  } catch (error) {
    return []
  }
}

export async function getAlbumWithPhotos(
  albumId: string
): Promise<{
  album: {
    id: string
    userId: string
    name: string
    description: string | null
    createdAt: Date | null
  }
  photos: Array<{
    id: string
    blobUrl: string
    caption: string | null
    createdAt: Date | null
  }>
} | null> {
  try {
    // Get album
    const albums = await db
      .select({
        id: schema.photoAlbum.id,
        userId: schema.photoAlbum.userId,
        name: schema.photoAlbum.name,
        description: schema.photoAlbum.description,
        createdAt: schema.photoAlbum.createdAt,
      })
      .from(schema.photoAlbum)
      .where(eq(schema.photoAlbum.id, albumId))

    if (albums.length === 0) {
      return null
    }

    const album = albums[0]

    // Get photos
    const photos = await db
      .select({
        id: schema.photo.id,
        blobUrl: schema.photo.blobUrl,
        caption: schema.photo.caption,
        createdAt: schema.photo.createdAt,
      })
      .from(schema.photo)
      .where(eq(schema.photo.albumId, albumId))
      .orderBy(desc(schema.photo.createdAt))

    return { album, photos }
  } catch (error) {
    return null
  }
}

export async function addPhoto(
  albumId: string,
  userId: string,
  blobUrl: string,
  caption?: string
): Promise<{ success: boolean; error?: string; photoId?: string }> {
  try {
    // Validate: album must belong to user
    const albums = await db
      .select()
      .from(schema.photoAlbum)
      .where(eq(schema.photoAlbum.id, albumId))

    if (albums.length === 0) {
      return { success: false, error: 'Album not found' }
    }

    const album = albums[0]

    if (album.userId !== userId) {
      return { success: false, error: 'Only album owner can add photos' }
    }

    // Insert photo
    const photoResult = await db.insert(schema.photo).values({
      albumId,
      userId,
      blobUrl,
      caption: caption?.trim() || null,
    })

    const photoId = photoResult.lastInsertRowid?.toString() || ''

    // Create feed item
    await db.insert(schema.feedItem).values({
      userId,
      type: 'new_photo',
      referenceId: photoId,
    })

    return { success: true, photoId }
  } catch (error) {
    return { success: false, error: 'Failed to add photo' }
  }
}

export async function tagUserInPhoto(
  photoId: string,
  taggedUserId: string,
  taggedByUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Insert photo tag
    await db.insert(schema.photoTag).values({
      photoId,
      taggedUserId,
      taggedByUserId,
    })

    // Create notification for tagged user
    await db.insert(schema.notification).values({
      userId: taggedUserId,
      type: 'photo_tag',
      referenceId: photoId,
      referenceType: 'photo',
      fromUserId: taggedByUserId,
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to tag user in photo' }
  }
}

export async function getPhotoTags(
  photoId: string
): Promise<Array<{ id: string; taggedUserId: string; taggedUserName: string }>> {
  try {
    const tags = await db
      .select({
        id: schema.photoTag.id,
        taggedUserId: schema.photoTag.taggedUserId,
        taggedUserName: schema.user.name,
      })
      .from(schema.photoTag)
      .innerJoin(schema.user, eq(schema.photoTag.taggedUserId, schema.user.id))
      .where(eq(schema.photoTag.photoId, photoId))

    return tags
  } catch (error) {
    return []
  }
}
