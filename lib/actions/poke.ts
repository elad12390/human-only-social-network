'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, and, or } from 'drizzle-orm'

export async function sendPoke(
  pokerId: string,
  pokedId: string
): Promise<{ success: boolean; error?: string }> {
  // Validate: can't poke self
  if (pokerId === pokedId) {
    return { success: false, error: 'Cannot poke yourself' }
  }

  try {
    // Check they are friends (bidirectional check)
    const friendship = await db
      .select()
      .from(schema.friendship)
      .where(
        and(
          or(
            and(
              eq(schema.friendship.requesterId, pokerId),
              eq(schema.friendship.addresseeId, pokedId)
            ),
            and(
              eq(schema.friendship.requesterId, pokedId),
              eq(schema.friendship.addresseeId, pokerId)
            )
          ),
          eq(schema.friendship.status, 'accepted')
        )
      )

    if (friendship.length === 0) {
      return { success: false, error: 'You must be friends to poke' }
    }

    // Check if there's an unseen poke from poker to poked already
    const existingPoke = await db
      .select()
      .from(schema.poke)
      .where(
        and(
          eq(schema.poke.pokerId, pokerId),
          eq(schema.poke.pokedId, pokedId),
          eq(schema.poke.seen, false)
        )
      )

    if (existingPoke.length > 0) {
      return { success: false, error: 'You already poked this person' }
    }

    const [inserted] = await db.insert(schema.poke).values({
      pokerId,
      pokedId,
      seen: false,
    }).returning({ id: schema.poke.id })

    const pokeId = inserted.id

    // Create notification for pokedId
    await db.insert(schema.notification).values({
      userId: pokedId,
      type: 'poke',
      referenceId: pokeId,
      referenceType: 'poke',
      fromUserId: pokerId,
    })

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to send poke' }
  }
}

export async function getUnseenPokes(
  userId: string
): Promise<Array<{ id: string; pokerId: string; pokerName: string; createdAt: Date | null }>> {
  try {
    const pokes = await db
      .select({
        id: schema.poke.id,
        pokerId: schema.poke.pokerId,
        pokerName: schema.user.name,
        createdAt: schema.poke.createdAt,
      })
      .from(schema.poke)
      .innerJoin(schema.user, eq(schema.poke.pokerId, schema.user.id))
      .where(
        and(
          eq(schema.poke.pokedId, userId),
          eq(schema.poke.seen, false)
        )
      )
      .orderBy((pokes) => pokes.createdAt)

    return pokes
  } catch (error) {
    return []
  }
}

export async function markPokeSeen(
  pokeId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch poke
    const pokes = await db
      .select()
      .from(schema.poke)
      .where(eq(schema.poke.id, pokeId))

    if (pokes.length === 0) {
      return { success: false, error: 'Poke not found' }
    }

    const poke = pokes[0]

    // Validate: user must be the pokedId
    if (poke.pokedId !== userId) {
      return { success: false, error: 'Only the poked user can mark as seen' }
    }

    // Update poke record: set seen = true
    await db
      .update(schema.poke)
      .set({ seen: true })
      .where(eq(schema.poke.id, pokeId))

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to mark poke as seen' }
  }
}

export async function pokeBack(
  pokeId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch poke
    const pokes = await db
      .select()
      .from(schema.poke)
      .where(eq(schema.poke.id, pokeId))

    if (pokes.length === 0) {
      return { success: false, error: 'Poke not found' }
    }

    const poke = pokes[0]

    // Validate: user must be the pokedId
    if (poke.pokedId !== userId) {
      return { success: false, error: 'Only the poked user can poke back' }
    }

    // Mark the original poke as seen
    const markResult = await markPokeSeen(pokeId, userId)
    if (!markResult.success) {
      return markResult
    }

    // Send a new poke back (from userId to the original poker)
    const sendResult = await sendPoke(userId, poke.pokerId)
    return sendResult
  } catch (error) {
    return { success: false, error: 'Failed to poke back' }
  }
}
