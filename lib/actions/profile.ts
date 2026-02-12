'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq } from 'drizzle-orm'

export async function updateProfile(
  userId: string,
  bio: string,
  profilePhotoUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await db.select().from(schema.profile).where(eq(schema.profile.userId, userId))
    if (existing.length > 0) {
      await db.update(schema.profile).set({ bio, profilePhotoUrl }).where(eq(schema.profile.userId, userId))
    } else {
      await db.insert(schema.profile).values({ userId, bio, profilePhotoUrl })
    }
    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to update profile' }
  }
}

export async function getProfile(userId: string) {
  const profiles = await db.select().from(schema.profile).where(eq(schema.profile.userId, userId))
  return profiles[0] || null
}
