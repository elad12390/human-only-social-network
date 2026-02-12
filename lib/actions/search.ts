'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { like, and, not, eq } from 'drizzle-orm'

export async function searchUsers(
  query: string,
  currentUserId?: string
): Promise<Array<{ id: string; name: string; email: string; image: string | null }>> {
  if (!query || query.trim().length === 0) {
    return []
  }

  const pattern = `%${query.trim()}%`

  try {
    const whereClause = currentUserId
      ? and(like(schema.user.name, pattern), not(eq(schema.user.id, currentUserId)))
      : like(schema.user.name, pattern)

    const results = await db
      .selectDistinct({
        id: schema.user.id,
        name: schema.user.name,
        email: schema.user.email,
        image: schema.user.image,
      })
      .from(schema.user)
      .where(whereClause)
      .limit(20)

    return results
  } catch (error) {
    return []
  }
}
