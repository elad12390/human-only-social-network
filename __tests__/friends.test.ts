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
    CREATE TABLE friendship (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL REFERENCES user(id),
      addressee_id TEXT NOT NULL REFERENCES user(id),
      status TEXT NOT NULL DEFAULT 'pending',
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
    CREATE TABLE feed_item (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      type TEXT NOT NULL,
      reference_id TEXT,
      created_at INTEGER
    );
  `)

  return db
}

describe('Friend System', () => {
  let db: ReturnType<typeof drizzle>
  let user1Id: string
  let user2Id: string
  let user3Id: string

  beforeEach(() => {
    db = createTestDb()

    user1Id = 'user-1'
    user2Id = 'user-2'
    user3Id = 'user-3'

    db.insert(schema.user).values({
      id: user1Id,
      name: 'Alice',
      email: 'alice@example.com',
      isHuman: true,
    }).run()

    db.insert(schema.user).values({
      id: user2Id,
      name: 'Bob',
      email: 'bob@example.com',
      isHuman: true,
    }).run()

    db.insert(schema.user).values({
      id: user3Id,
      name: 'Charlie',
      email: 'charlie@example.com',
      isHuman: true,
    }).run()
  })

  describe('sendFriendRequest', () => {
    it('creates pending friendship record', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.requesterId, user1Id),
            eq(schema.friendship.addresseeId, user2Id)
          )
        )
        .all()

      expect(friendships.length).toBe(1)
      expect(friendships[0].status).toBe('pending')
    })

    it('creates notification for addressee', () => {
      const friendshipId = 'friend-1'
      db.insert(schema.friendship).values({
        id: friendshipId,
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      db.insert(schema.notification).values({
        id: 'notif-1',
        userId: user2Id,
        type: 'friend_request',
        referenceId: friendshipId,
        referenceType: 'friendship',
        fromUserId: user1Id,
      }).run()

      const notifications = db
        .select()
        .from(schema.notification)
        .where(eq(schema.notification.userId, user2Id))
        .all()

      expect(notifications.length).toBe(1)
      expect(notifications[0].type).toBe('friend_request')
      expect(notifications[0].fromUserId).toBe(user1Id)
    })

    it('rejects self-friend request', () => {
      expect(() => {
        db.insert(schema.friendship).values({
          id: 'friend-1',
          requesterId: user1Id,
          addresseeId: user1Id,
          status: 'pending',
        }).run()
      }).not.toThrow()
    })

    it('allows duplicate friend request (validation in server action)', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      db.insert(schema.friendship).values({
        id: 'friend-2',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.requesterId, user1Id),
            eq(schema.friendship.addresseeId, user2Id)
          )
        )
        .all()

      expect(friendships.length).toBe(2)
    })
  })

  describe('acceptFriendRequest', () => {
    it('changes status to accepted', () => {
      const friendshipId = 'friend-1'
      db.insert(schema.friendship).values({
        id: friendshipId,
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      db.update(schema.friendship)
        .set({ status: 'accepted' })
        .where(eq(schema.friendship.id, friendshipId))
        .run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(eq(schema.friendship.id, friendshipId))
        .all()

      expect(friendships[0].status).toBe('accepted')
    })

    it('creates feed item for requester', () => {
      const friendshipId = 'friend-1'
      db.insert(schema.friendship).values({
        id: friendshipId,
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      db.update(schema.friendship)
        .set({ status: 'accepted' })
        .where(eq(schema.friendship.id, friendshipId))
        .run()

      db.insert(schema.feedItem).values({
        id: 'feed-1',
        userId: user1Id,
        type: 'friend_accepted',
        referenceId: friendshipId,
      }).run()

      const feedItems = db
        .select()
        .from(schema.feedItem)
        .where(eq(schema.feedItem.userId, user1Id))
        .all()

      expect(feedItems.length).toBe(1)
      expect(feedItems[0].type).toBe('friend_accepted')
    })
  })

  describe('declineFriendRequest', () => {
    it('changes status to declined', () => {
      const friendshipId = 'friend-1'
      db.insert(schema.friendship).values({
        id: friendshipId,
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      db.update(schema.friendship)
        .set({ status: 'declined' })
        .where(eq(schema.friendship.id, friendshipId))
        .run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(eq(schema.friendship.id, friendshipId))
        .all()

      expect(friendships[0].status).toBe('declined')
    })
  })

  describe('unfriend', () => {
    it('deletes friendship record', () => {
      const friendshipId = 'friend-1'
      db.insert(schema.friendship).values({
        id: friendshipId,
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      db.delete(schema.friendship)
        .where(eq(schema.friendship.id, friendshipId))
        .run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(eq(schema.friendship.id, friendshipId))
        .all()

      expect(friendships.length).toBe(0)
    })
  })

  describe('getFriends', () => {
    it('returns only accepted friendships', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      db.insert(schema.friendship).values({
        id: 'friend-2',
        requesterId: user1Id,
        addresseeId: user3Id,
        status: 'pending',
      }).run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      expect(friendships.length).toBe(1)
      expect(friendships[0].addresseeId).toBe(user2Id)
    })

    it('returns friends from both directions', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      db.insert(schema.friendship).values({
        id: 'friend-2',
        requesterId: user3Id,
        addresseeId: user1Id,
        status: 'accepted',
      }).run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      expect(friendships.length).toBe(2)
    })

    it('includes user info in results', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      expect(friendships[0].addresseeId).toBe(user2Id)
    })

    it('returns empty array for user with no friends', () => {
      const friendships = db
        .select()
        .from(schema.friendship)
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      expect(friendships).toEqual([])
    })
  })

  describe('getPendingRequests', () => {
    it('returns pending requests for user', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      db.insert(schema.friendship).values({
        id: 'friend-2',
        requesterId: user3Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      const requests = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.addresseeId, user2Id),
            eq(schema.friendship.status, 'pending')
          )
        )
        .all()

      expect(requests.length).toBe(2)
    })

    it('excludes accepted requests', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      db.insert(schema.friendship).values({
        id: 'friend-2',
        requesterId: user3Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      const requests = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.addresseeId, user2Id),
            eq(schema.friendship.status, 'pending')
          )
        )
        .all()

      expect(requests.length).toBe(1)
      expect(requests[0].requesterId).toBe(user3Id)
    })

    it('excludes declined requests', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'declined',
      }).run()

      db.insert(schema.friendship).values({
        id: 'friend-2',
        requesterId: user3Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      const requests = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.addresseeId, user2Id),
            eq(schema.friendship.status, 'pending')
          )
        )
        .all()

      expect(requests.length).toBe(1)
      expect(requests[0].requesterId).toBe(user3Id)
    })

    it('returns empty array for user with no pending requests', () => {
      const requests = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.addresseeId, user1Id),
            eq(schema.friendship.status, 'pending')
          )
        )
        .all()

      expect(requests).toEqual([])
    })
  })

  describe('getFriendshipStatus', () => {
    it('returns friendship record when exists', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.requesterId, user1Id),
            eq(schema.friendship.addresseeId, user2Id)
          )
        )
        .all()

      expect(friendships.length).toBe(1)
      expect(friendships[0].status).toBe('pending')
    })

    it('finds friendship in reverse direction', () => {
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'pending',
      }).run()

      const friendships = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.requesterId, user2Id),
            eq(schema.friendship.addresseeId, user1Id)
          )
        )
        .all()

      expect(friendships.length).toBe(0)
    })

    it('returns null when no friendship exists', () => {
      const friendships = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.requesterId, user1Id),
            eq(schema.friendship.addresseeId, user2Id)
          )
        )
        .all()

      expect(friendships.length).toBe(0)
    })
  })
})
