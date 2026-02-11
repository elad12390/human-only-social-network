import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq, desc } from 'drizzle-orm'
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
    CREATE TABLE notification (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id),
      type TEXT NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      from_user_id TEXT REFERENCES "user"(id),
      "read" INTEGER DEFAULT 0,
      created_at INTEGER
    );
  `)

  return { db, sqlite }
}

describe('Notifications System', () => {
  let db: ReturnType<typeof drizzle>
  let sqlite: Database.Database
  let user1Id: string
  let user2Id: string

  beforeEach(() => {
    const result = createTestDb()
    db = result.db
    sqlite = result.sqlite

    user1Id = 'user-1'
    user2Id = 'user-2'

    db.insert(schema.user)
      .values({
        id: user1Id,
        name: 'Test User',
        email: 'test@test.com',
      })
      .run()

    db.insert(schema.user)
      .values({
        id: user2Id,
        name: 'Other User',
        email: 'other@test.com',
      })
      .run()
  })

  describe('notification operations', () => {
    it('should get notifications ordered newest first', () => {
      sqlite.exec(`
        INSERT INTO notification VALUES ('n1', '${user1Id}', 'poke', 'ref1', NULL, '${user2Id}', 0, 1000);
        INSERT INTO notification VALUES ('n2', '${user1Id}', 'friend_request', 'ref2', NULL, '${user2Id}', 0, 2000);
      `)

      const notifications = db
        .select({
          id: schema.notification.id,
          userId: schema.notification.userId,
          type: schema.notification.type,
          referenceId: schema.notification.referenceId,
          referenceType: schema.notification.referenceType,
          fromUserId: schema.notification.fromUserId,
          fromUserName: schema.user.name,
          read: schema.notification.read,
          createdAt: schema.notification.createdAt,
        })
        .from(schema.notification)
        .leftJoin(schema.user, eq(schema.notification.fromUserId, schema.user.id))
        .where(eq(schema.notification.userId, user1Id))
        .orderBy(desc(schema.notification.createdAt))
        .all()

      expect(notifications.length).toBe(2)
      expect(notifications[0].id).toBe('n2')
      expect(notifications[0].type).toBe('friend_request')
      expect(notifications[1].id).toBe('n1')
      expect(notifications[1].type).toBe('poke')
      expect(notifications[0].fromUserName).toBe('Other User')
    })

    it('should mark notification as read', () => {
      sqlite.exec(`
        INSERT INTO notification VALUES ('n1', '${user1Id}', 'poke', 'ref1', NULL, '${user2Id}', 0, 1000);
      `)

      db.update(schema.notification)
        .set({ read: true })
        .where(eq(schema.notification.id, 'n1'))
        .run()

      const notifications = db
        .select()
        .from(schema.notification)
        .where(eq(schema.notification.id, 'n1'))
        .all()

      expect(notifications.length).toBe(1)
      expect(notifications[0].read).toBe(true)
    })

    it('should count unread notifications', () => {
      sqlite.exec(`
        INSERT INTO notification VALUES ('n1', '${user1Id}', 'poke', 'ref1', NULL, '${user2Id}', 0, 1000);
        INSERT INTO notification VALUES ('n2', '${user1Id}', 'friend_request', 'ref2', NULL, '${user2Id}', 0, 2000);
        INSERT INTO notification VALUES ('n3', '${user1Id}', 'new_message', 'ref3', NULL, '${user2Id}', 1, 3000);
      `)

      const notifications = db
        .select()
        .from(schema.notification)
        .where(eq(schema.notification.userId, user1Id))
        .all()

      const unreadCount = notifications.filter((n) => !n.read).length

      expect(unreadCount).toBe(2)
    })
  })
})
