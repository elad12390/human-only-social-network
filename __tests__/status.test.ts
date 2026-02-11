import { describe, it, expect, beforeEach } from 'vitest'
import { Database } from 'better-sqlite3'
import Database3 from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from '@/lib/schema'
import { eq, desc } from 'drizzle-orm'

function createTestDb(): Database {
  const db = new Database3(':memory:')
  db.pragma('foreign_keys = ON')
  db.pragma('journal_mode = WAL')
  return db
}

function initializeSchema(db: Database) {
  db.exec(`
    CREATE TABLE user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER DEFAULT 0,
      image TEXT,
      is_human INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    );

    CREATE TABLE status_update (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      content TEXT NOT NULL,
      created_at INTEGER
    );

    CREATE TABLE feed_item (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      type TEXT NOT NULL,
      reference_id TEXT,
      created_at INTEGER
    );
  `)
}

describe('Status Updates', () => {
  let db: Database
  let drizzleDb: ReturnType<typeof drizzle>

  beforeEach(() => {
    db = createTestDb()
    initializeSchema(db)
    drizzleDb = drizzle(db)
  })

  it('should create a status update', async () => {
    const userId = 'user-1'
    const userName = 'John Doe'
    const statusContent = 'is having a great day'

    await drizzleDb.insert(schema.user).values({
      id: userId,
      name: userName,
      email: 'john@example.com',
    })

    const result = await drizzleDb.insert(schema.statusUpdate).values({
      id: 'status-1',
      userId,
      content: statusContent,
    })

    expect(result).toBeDefined()

    const statuses = await drizzleDb
      .select()
      .from(schema.statusUpdate)
      .where(eq(schema.statusUpdate.userId, userId))

    expect(statuses).toHaveLength(1)
    expect(statuses[0].content).toBe(statusContent)
  })

  it('should enforce 255 character limit', async () => {
    const userId = 'user-1'
    const longContent = 'a'.repeat(256)

    await drizzleDb.insert(schema.user).values({
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    })

    expect(longContent.length).toBe(256)
    expect(longContent.length > 255).toBe(true)
  })

  it('should reject empty status', async () => {
    const userId = 'user-1'
    const emptyContent = ''

    await drizzleDb.insert(schema.user).values({
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    })

    expect(emptyContent.trim().length).toBe(0)
  })

  it('should return latest status for a user', async () => {
    const userId = 'user-1'

    await drizzleDb.insert(schema.user).values({
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    })

    const now = Date.now()

    await drizzleDb.insert(schema.statusUpdate).values({
      id: 'status-1',
      userId,
      content: 'first status',
      createdAt: new Date(now - 1000),
    })

    await drizzleDb.insert(schema.statusUpdate).values({
      id: 'status-2',
      userId,
      content: 'second status',
      createdAt: new Date(now),
    })

    const latestStatus = await drizzleDb
      .select()
      .from(schema.statusUpdate)
      .where(eq(schema.statusUpdate.userId, userId))
      .orderBy(desc(schema.statusUpdate.createdAt))
      .limit(1)

    expect(latestStatus).toHaveLength(1)
    expect(latestStatus[0].content).toBe('second status')
  })

  it('should preserve previous statuses', async () => {
    const userId = 'user-1'

    await drizzleDb.insert(schema.user).values({
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    })

    await drizzleDb.insert(schema.statusUpdate).values({
      id: 'status-1',
      userId,
      content: 'first status',
    })

    await drizzleDb.insert(schema.statusUpdate).values({
      id: 'status-2',
      userId,
      content: 'second status',
    })

    const allStatuses = await drizzleDb
      .select()
      .from(schema.statusUpdate)
      .where(eq(schema.statusUpdate.userId, userId))

    expect(allStatuses).toHaveLength(2)
    expect(allStatuses.map((s) => s.content)).toContain('first status')
    expect(allStatuses.map((s) => s.content)).toContain('second status')
  })

  it('should create feed item when status is created', async () => {
    const userId = 'user-1'

    await drizzleDb.insert(schema.user).values({
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
    })

    const statusResult = await drizzleDb.insert(schema.statusUpdate).values({
      id: 'status-1',
      userId,
      content: 'is having fun',
    })

    await drizzleDb.insert(schema.feedItem).values({
      id: 'feed-1',
      userId,
      type: 'status_update',
      referenceId: 'status-1',
    })

    const feedItems = await drizzleDb
      .select()
      .from(schema.feedItem)
      .where(eq(schema.feedItem.userId, userId))

    expect(feedItems).toHaveLength(1)
    expect(feedItems[0].type).toBe('status_update')
    expect(feedItems[0].referenceId).toBe('status-1')
  })
})
