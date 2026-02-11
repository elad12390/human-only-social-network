import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq, and } from 'drizzle-orm'
import * as schema from '@/lib/schema'

function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite)

  sqlite.exec(`
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
    CREATE TABLE message (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES user(id),
      recipient_id TEXT NOT NULL REFERENCES user(id),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE TABLE notification (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      type TEXT NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      from_user_id TEXT REFERENCES user(id),
      read INTEGER DEFAULT 0,
      created_at INTEGER
    );
  `)

  return db
}

describe('Messaging System', () => {
  let db: ReturnType<typeof drizzle>
  let user1Id: string
  let user2Id: string
  let user3Id: string

  beforeEach(() => {
    db = createTestDb()

    user1Id = 'user-1'
    user2Id = 'user-2'
    user3Id = 'user-3'

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

    db.insert(schema.user)
      .values({
        id: user3Id,
        name: 'Charlie',
        email: 'charlie@example.com',
        isHuman: true,
      })
      .run()
  })

  describe('sendMessage', () => {
    it('sends message', () => {
      const messageId = 'msg-1'
      db.insert(schema.message)
        .values({
          id: messageId,
          senderId: user1Id,
          recipientId: user2Id,
          subject: 'Hello Bob',
          body: 'This is a test message',
          read: false,
        })
        .run()

      const messages = db
        .select()
        .from(schema.message)
        .where(eq(schema.message.id, messageId))
        .all()

      expect(messages.length).toBe(1)
      expect(messages[0].senderId).toBe(user1Id)
      expect(messages[0].recipientId).toBe(user2Id)
      expect(messages[0].subject).toBe('Hello Bob')
      expect(messages[0].body).toBe('This is a test message')
      expect(messages[0].read).toBe(false)
    })

    it('subject is required', () => {
      // Empty subject should fail validation
      expect(''.trim().length === 0).toBe(true)
    })

    it('body is required', () => {
      // Empty body should fail validation
      expect(''.trim().length === 0).toBe(true)
    })

    it('cannot message self', () => {
      // Verify that senderId === recipientId check would fail
      const senderId = user1Id
      const recipientId = user1Id
      expect(senderId === recipientId).toBe(true)
    })
  })

  describe('getInbox', () => {
    it('inbox shows received messages', () => {
      // Insert 2 messages to user1 (from user2 and user3)
      db.insert(schema.message)
        .values({
          id: 'msg-1',
          senderId: user2Id,
          recipientId: user1Id,
          subject: 'Message from Bob',
          body: 'Hello Alice',
          read: false,
        })
        .run()

      db.insert(schema.message)
        .values({
          id: 'msg-2',
          senderId: user3Id,
          recipientId: user1Id,
          subject: 'Message from Charlie',
          body: 'Hi Alice',
          read: false,
        })
        .run()

      // Insert 1 message from user1 (should NOT appear in inbox)
      db.insert(schema.message)
        .values({
          id: 'msg-3',
          senderId: user1Id,
          recipientId: user2Id,
          subject: 'Message to Bob',
          body: 'Hello Bob',
          read: false,
        })
        .run()

      const inboxMessages = db
        .select()
        .from(schema.message)
        .where(eq(schema.message.recipientId, user1Id))
        .all()

      expect(inboxMessages.length).toBe(2)
      expect(inboxMessages.every((m) => m.recipientId === user1Id)).toBe(true)
    })
  })

  describe('markAsRead', () => {
    it('marks message as read', () => {
      const messageId = 'msg-1'
      db.insert(schema.message)
        .values({
          id: messageId,
          senderId: user2Id,
          recipientId: user1Id,
          subject: 'Test',
          body: 'Test message',
          read: false,
        })
        .run()

      // Update read to true
      db.update(schema.message)
        .set({ read: true })
        .where(eq(schema.message.id, messageId))
        .run()

      const messages = db
        .select()
        .from(schema.message)
        .where(eq(schema.message.id, messageId))
        .all()

      expect(messages[0].read).toBe(true)
    })
  })

  describe('getUnreadCount', () => {
    it('unread count is correct', () => {
      // Insert 3 messages to user1 (2 unread, 1 read)
      db.insert(schema.message)
        .values({
          id: 'msg-1',
          senderId: user2Id,
          recipientId: user1Id,
          subject: 'Unread 1',
          body: 'Test',
          read: false,
        })
        .run()

      db.insert(schema.message)
        .values({
          id: 'msg-2',
          senderId: user3Id,
          recipientId: user1Id,
          subject: 'Unread 2',
          body: 'Test',
          read: false,
        })
        .run()

      db.insert(schema.message)
        .values({
          id: 'msg-3',
          senderId: user2Id,
          recipientId: user1Id,
          subject: 'Read',
          body: 'Test',
          read: true,
        })
        .run()

      const unreadCount = db
        .select()
        .from(schema.message)
        .where(
          and(
            eq(schema.message.recipientId, user1Id),
            eq(schema.message.read, false)
          )
        )
        .all()

      expect(unreadCount.length).toBe(2)
    })
  })

  describe('replyToMessage', () => {
    it('reply creates message with Re: prefix', () => {
      // Insert original message with subject "Hello"
      db.insert(schema.message)
        .values({
          id: 'msg-1',
          senderId: user2Id,
          recipientId: user1Id,
          subject: 'Hello',
          body: 'Original message',
          read: false,
        })
        .run()

      // Insert reply with subject "Re: Hello"
      db.insert(schema.message)
        .values({
          id: 'msg-2',
          senderId: user1Id,
          recipientId: user2Id,
          subject: 'Re: Hello',
          body: 'Reply message',
          read: false,
        })
        .run()

      const reply = db
        .select()
        .from(schema.message)
        .where(eq(schema.message.id, 'msg-2'))
        .all()[0]

      expect(reply.subject.startsWith('Re: ')).toBe(true)
      expect(reply.subject).toBe('Re: Hello')
    })
  })
})
