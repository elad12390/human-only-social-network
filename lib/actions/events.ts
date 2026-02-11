'use server'

import { db } from '@/lib/db'
import * as schema from '@/lib/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function createEvent(
  creatorId: string,
  name: string,
  description?: string,
  location?: string,
  startTime?: Date,
  endTime?: Date,
  groupId?: string
): Promise<{ success: boolean; error?: string; eventId?: string }> {
  // Validate: name required
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Event name is required' }
  }

  // Validate: name max 200 chars
  if (name.trim().length > 200) {
    return { success: false, error: 'Event name must be 200 characters or less' }
  }

  try {
    // Insert event
    const eventResult = await db.insert(schema.event).values({
      name: name.trim(),
      description: description?.trim() || null,
      location: location?.trim() || null,
      startTime: startTime || null,
      endTime: endTime || null,
      creatorId,
      groupId: groupId || null,
    })

    const eventId = eventResult.lastInsertRowid?.toString() || ''

    // Create feed item for event creation
    await db.insert(schema.feedItem).values({
      userId: creatorId,
      type: 'event_created',
      referenceId: eventId,
    })

    return { success: true, eventId }
  } catch (error) {
    return { success: false, error: 'Failed to create event' }
  }
}

export async function getEvents(): Promise<
  Array<{
    id: string
    name: string
    description: string | null
    location: string | null
    startTime: Date | null
    endTime: Date | null
    creatorId: string
    groupId: string | null
    createdAt: Date | null
  }>
> {
  try {
    const events = await db
      .select({
        id: schema.event.id,
        name: schema.event.name,
        description: schema.event.description,
        location: schema.event.location,
        startTime: schema.event.startTime,
        endTime: schema.event.endTime,
        creatorId: schema.event.creatorId,
        groupId: schema.event.groupId,
        createdAt: schema.event.createdAt,
      })
      .from(schema.event)
      .orderBy(desc(schema.event.createdAt))

    return events
  } catch (error) {
    return []
  }
}

export async function getEvent(
  eventId: string
): Promise<{
  id: string
  name: string
  description: string | null
  location: string | null
  startTime: Date | null
  endTime: Date | null
  creatorId: string
  groupId: string | null
  createdAt: Date | null
} | null> {
  try {
    const events = await db
      .select({
        id: schema.event.id,
        name: schema.event.name,
        description: schema.event.description,
        location: schema.event.location,
        startTime: schema.event.startTime,
        endTime: schema.event.endTime,
        creatorId: schema.event.creatorId,
        groupId: schema.event.groupId,
        createdAt: schema.event.createdAt,
      })
      .from(schema.event)
      .where(eq(schema.event.id, eventId))

    if (events.length === 0) {
      return null
    }

    return events[0]
  } catch (error) {
    return null
  }
}

export async function rsvpEvent(
  userId: string,
  eventId: string,
  status: 'attending' | 'maybe' | 'declined'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user already has an RSVP for this event
    const existingRsvp = await db
      .select()
      .from(schema.eventRsvp)
      .where(
        and(
          eq(schema.eventRsvp.userId, userId),
          eq(schema.eventRsvp.eventId, eventId)
        )
      )

    if (existingRsvp.length > 0) {
      // Update existing RSVP
      await db
        .update(schema.eventRsvp)
        .set({ status })
        .where(
          and(
            eq(schema.eventRsvp.userId, userId),
            eq(schema.eventRsvp.eventId, eventId)
          )
        )
    } else {
      // Insert new RSVP
      await db.insert(schema.eventRsvp).values({
        eventId,
        userId,
        status,
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: 'Failed to RSVP to event' }
  }
}

export async function getEventRsvps(
  eventId: string
): Promise<
  Array<{
    id: string
    userId: string
    userName: string
    status: string
  }>
> {
  try {
    const rsvps = await db
      .select({
        id: schema.eventRsvp.id,
        userId: schema.eventRsvp.userId,
        userName: schema.user.name,
        status: schema.eventRsvp.status,
      })
      .from(schema.eventRsvp)
      .innerJoin(schema.user, eq(schema.eventRsvp.userId, schema.user.id))
      .where(eq(schema.eventRsvp.eventId, eventId))

    return rsvps
  } catch (error) {
    return []
  }
}

export async function getEventRsvpStatus(
  userId: string,
  eventId: string
): Promise<'attending' | 'maybe' | 'declined' | null> {
  try {
    const rsvps = await db
      .select({
        status: schema.eventRsvp.status,
      })
      .from(schema.eventRsvp)
      .where(
        and(
          eq(schema.eventRsvp.userId, userId),
          eq(schema.eventRsvp.eventId, eventId)
        )
      )

    if (rsvps.length === 0) {
      return null
    }

    return rsvps[0].status as 'attending' | 'maybe' | 'declined'
  } catch (error) {
    return null
  }
}
