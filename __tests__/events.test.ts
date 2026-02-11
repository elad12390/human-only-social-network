import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq } from 'drizzle-orm'
import * as schema from '@/lib/schema'

function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite)

  sqlite.exec(`
    CREATE TABLE "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER DEFAULT 0,
      image TEXT,
      is_human INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE "event" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_time INTEGER,
      end_time INTEGER,
      creator_id TEXT NOT NULL REFERENCES "user"(id),
      group_id TEXT,
      created_at INTEGER
    );
    CREATE TABLE event_rsvp (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES "event"(id),
      user_id TEXT NOT NULL REFERENCES "user"(id),
      status TEXT NOT NULL
    );
    CREATE TABLE feed_item (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id),
      type TEXT NOT NULL,
      reference_id TEXT,
      created_at INTEGER
    );
  `)

  return db
}

describe('Events System', () => {
  let db: ReturnType<typeof drizzle>
  let user1Id: string
  let user2Id: string

  beforeEach(() => {
    db = createTestDb()

    user1Id = 'user-1'
    user2Id = 'user-2'

    db.insert(schema.user)
      .values({
        id: user1Id,
        name: 'Alice',
        email: 'alice@example.com',
        isHuman: true,
      })
      .run()

    db.insert(schema.user)
      .values({
        id: user2Id,
        name: 'Bob',
        email: 'bob@example.com',
        isHuman: true,
      })
      .run()
  })

  it('should create an event', () => {
    const eventId = 'event-1'
    const now = new Date()

    db.insert(schema.event)
      .values({
        id: eventId,
        name: 'Tech Meetup',
        description: 'A tech meetup event',
        location: null,
        startTime: null,
        endTime: null,
        creatorId: user1Id,
        groupId: null,
        createdAt: now,
      })
      .run()

    const events = db
      .select()
      .from(schema.event)
      .where(eq(schema.event.id, eventId))
      .all()

    expect(events.length).toBe(1)
    expect(events[0].name).toBe('Tech Meetup')
    expect(events[0].description).toBe('A tech meetup event')
    expect(events[0].creatorId).toBe(user1Id)
  })

  it('should create feed item when event is created', () => {
    const eventId = 'event-1'
    const feedItemId = 'feed-1'
    const now = new Date()

    db.insert(schema.event)
      .values({
        id: eventId,
        name: 'Tech Meetup',
        description: 'A tech meetup event',
        location: null,
        startTime: null,
        endTime: null,
        creatorId: user1Id,
        groupId: null,
        createdAt: now,
      })
      .run()

    db.insert(schema.feedItem)
      .values({
        id: feedItemId,
        userId: user1Id,
        type: 'event_created',
        referenceId: eventId,
        createdAt: now,
      })
      .run()

    const feedItems = db
      .select()
      .from(schema.feedItem)
      .where(eq(schema.feedItem.referenceId, eventId))
      .all()

    expect(feedItems.length).toBe(1)
    expect(feedItems[0].type).toBe('event_created')
    expect(feedItems[0].userId).toBe(user1Id)
    expect(feedItems[0].referenceId).toBe(eventId)
  })

  it('should RSVP to an event', () => {
    const eventId = 'event-1'
    const rsvpId = 'rsvp-1'
    const now = new Date()

    db.insert(schema.event)
      .values({
        id: eventId,
        name: 'Tech Meetup',
        description: null,
        location: null,
        startTime: null,
        endTime: null,
        creatorId: user1Id,
        groupId: null,
        createdAt: now,
      })
      .run()

    db.insert(schema.eventRsvp)
      .values({
        id: rsvpId,
        eventId: eventId,
        userId: user2Id,
        status: 'attending',
      })
      .run()

    const rsvps = db
      .select()
      .from(schema.eventRsvp)
      .where(eq(schema.eventRsvp.eventId, eventId))
      .all()

    expect(rsvps.length).toBe(1)
    expect(rsvps[0].userId).toBe(user2Id)
    expect(rsvps[0].status).toBe('attending')
  })

  it('should update RSVP status', () => {
    const eventId = 'event-1'
    const rsvpId = 'rsvp-1'
    const now = new Date()

    db.insert(schema.event)
      .values({
        id: eventId,
        name: 'Tech Meetup',
        description: null,
        location: null,
        startTime: null,
        endTime: null,
        creatorId: user1Id,
        groupId: null,
        createdAt: now,
      })
      .run()

    db.insert(schema.eventRsvp)
      .values({
        id: rsvpId,
        eventId: eventId,
        userId: user2Id,
        status: 'attending',
      })
      .run()

    db.update(schema.eventRsvp)
      .set({ status: 'declined' })
      .where(eq(schema.eventRsvp.id, rsvpId))
      .run()

    const rsvps = db
      .select()
      .from(schema.eventRsvp)
      .where(eq(schema.eventRsvp.eventId, eventId))
      .all()

    expect(rsvps.length).toBe(1)
    expect(rsvps[0].status).toBe('declined')
  })

  it('should get event RSVPs with user names', () => {
    const eventId = 'event-1'
    const rsvpId = 'rsvp-1'
    const now = new Date()

    db.insert(schema.event)
      .values({
        id: eventId,
        name: 'Tech Meetup',
        description: null,
        location: null,
        startTime: null,
        endTime: null,
        creatorId: user1Id,
        groupId: null,
        createdAt: now,
      })
      .run()

    db.insert(schema.eventRsvp)
      .values({
        id: rsvpId,
        eventId: eventId,
        userId: user2Id,
        status: 'attending',
      })
      .run()

    const rsvps = db
      .select({
        id: schema.eventRsvp.id,
        userId: schema.eventRsvp.userId,
        userName: schema.user.name,
        status: schema.eventRsvp.status,
      })
      .from(schema.eventRsvp)
      .innerJoin(schema.user, eq(schema.eventRsvp.userId, schema.user.id))
      .where(eq(schema.eventRsvp.eventId, eventId))
      .all()

    expect(rsvps.length).toBe(1)
    expect(rsvps[0].userId).toBe(user2Id)
    expect(rsvps[0].userName).toBe('Bob')
    expect(rsvps[0].status).toBe('attending')
  })
})
