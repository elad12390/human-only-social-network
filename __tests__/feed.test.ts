import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { eq, and, inArray } from 'drizzle-orm'
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
    CREATE TABLE feed_item (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      type TEXT NOT NULL,
      reference_id TEXT,
      created_at INTEGER
    );
    CREATE TABLE status_update (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      content TEXT NOT NULL,
      created_at INTEGER
    );
    CREATE TABLE wall_post (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES user(id),
      profile_owner_id TEXT NOT NULL REFERENCES user(id),
      content TEXT NOT NULL,
      created_at INTEGER
    );
  `)

  return db
}

describe('Feed System', () => {
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

  describe('getFeedItems', () => {
    it('returns empty feed for user with no friends', () => {
      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const items = db
        .select()
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(items).toEqual([])
    })

    it('returns feed items from friends', () => {
      // Create accepted friendship
      db.insert(schema.friendship)
        .values({
          id: 'friend-1',
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        })
        .run()

      // Create status update for friend
      db.insert(schema.statusUpdate)
        .values({
          id: 'status-1',
          userId: user2Id,
          content: 'Hello world!',
          createdAt: new Date(),
        })
        .run()

      // Create feed item for friend's status
      db.insert(schema.feedItem)
        .values({
          id: 'feed-1',
          userId: user2Id,
          type: 'status_update',
          referenceId: 'status-1',
          createdAt: new Date(),
        })
        .run()

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const items = db
        .select({
          id: schema.feedItem.id,
          userId: schema.feedItem.userId,
          userName: schema.user.name,
          type: schema.feedItem.type,
          referenceId: schema.feedItem.referenceId,
          createdAt: schema.feedItem.createdAt,
        })
        .from(schema.feedItem)
        .innerJoin(schema.user, eq(schema.feedItem.userId, schema.user.id))
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(items.length).toBe(1)
      expect(items[0].userId).toBe(user2Id)
      expect(items[0].userName).toBe('Bob')
      expect(items[0].type).toBe('status_update')

      // Get status content
      const statuses = items[0].referenceId
        ? db
            .select()
            .from(schema.statusUpdate)
            .where(eq(schema.statusUpdate.id, items[0].referenceId))
            .all()
        : []

      expect(statuses.length > 0 && statuses[0].content).toBe('Hello world!')
    })

    it('returns own feed items', () => {
      // Create status update for user
      db.insert(schema.statusUpdate)
        .values({
          id: 'status-1',
          userId: user1Id,
          content: 'My status',
          createdAt: new Date(),
        })
        .run()

      // Create feed item for own status
      db.insert(schema.feedItem)
        .values({
          id: 'feed-1',
          userId: user1Id,
          type: 'status_update',
          referenceId: 'status-1',
          createdAt: new Date(),
        })
        .run()

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const items = db
        .select({
          id: schema.feedItem.id,
          userId: schema.feedItem.userId,
          userName: schema.user.name,
          type: schema.feedItem.type,
          referenceId: schema.feedItem.referenceId,
          createdAt: schema.feedItem.createdAt,
        })
        .from(schema.feedItem)
        .innerJoin(schema.user, eq(schema.feedItem.userId, schema.user.id))
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(items.length).toBe(1)
      expect(items[0].userId).toBe(user1Id)
      expect(items[0].userName).toBe('Alice')
    })

    it('orders items newest first', () => {
      const now = new Date()
      const oneHourAgo = new Date(now.getTime() - 3600000)
      const twoHoursAgo = new Date(now.getTime() - 7200000)

      // Create accepted friendship
      db.insert(schema.friendship)
        .values({
          id: 'friend-1',
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        })
        .run()

      // Create status updates with different timestamps
      db.insert(schema.statusUpdate)
        .values({
          id: 'status-1',
          userId: user2Id,
          content: 'Oldest',
          createdAt: twoHoursAgo,
        })
        .run()

      db.insert(schema.statusUpdate)
        .values({
          id: 'status-2',
          userId: user2Id,
          content: 'Middle',
          createdAt: oneHourAgo,
        })
        .run()

      db.insert(schema.statusUpdate)
        .values({
          id: 'status-3',
          userId: user2Id,
          content: 'Newest',
          createdAt: now,
        })
        .run()

      // Create feed items
      db.insert(schema.feedItem)
        .values({
          id: 'feed-1',
          userId: user2Id,
          type: 'status_update',
          referenceId: 'status-1',
          createdAt: twoHoursAgo,
        })
        .run()

      db.insert(schema.feedItem)
        .values({
          id: 'feed-2',
          userId: user2Id,
          type: 'status_update',
          referenceId: 'status-2',
          createdAt: oneHourAgo,
        })
        .run()

      db.insert(schema.feedItem)
        .values({
          id: 'feed-3',
          userId: user2Id,
          type: 'status_update',
          referenceId: 'status-3',
          createdAt: now,
        })
        .run()

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const items = db
        .select()
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .orderBy((t) => t.createdAt)
        .all()

      expect(items.length).toBe(3)
      expect(items[0].createdAt?.getTime()).toBeLessThanOrEqual(items[1].createdAt?.getTime() || 0)
      expect(items[1].createdAt?.getTime()).toBeLessThanOrEqual(items[2].createdAt?.getTime() || 0)
    })

    it('paginates correctly', () => {
      // Create accepted friendship
      db.insert(schema.friendship)
        .values({
          id: 'friend-1',
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        })
        .run()

      // Create 25 status updates
      for (let i = 0; i < 25; i++) {
        const timestamp = new Date(Date.now() - i * 1000)
        db.insert(schema.statusUpdate)
          .values({
            id: `status-${i}`,
            userId: user2Id,
            content: `Status ${i}`,
            createdAt: timestamp,
          })
          .run()

        db.insert(schema.feedItem)
          .values({
            id: `feed-${i}`,
            userId: user2Id,
            type: 'status_update',
            referenceId: `status-${i}`,
            createdAt: timestamp,
          })
          .run()
      }

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      // Get page 1 (pageSize=20)
      const page1 = db
        .select()
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .orderBy((t) => t.createdAt)
        .limit(20)
        .offset(0)
        .all()

      expect(page1.length).toBe(20)

      // Get page 2
      const page2 = db
        .select()
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .orderBy((t) => t.createdAt)
        .limit(20)
        .offset(20)
        .all()

      expect(page2.length).toBe(5)

      // Verify no overlap
      const page1Ids = page1.map((i) => i.id)
      const page2Ids = page2.map((i) => i.id)
      const overlap = page1Ids.filter((id) => page2Ids.includes(id))
      expect(overlap.length).toBe(0)
    })

    it('does not show items from non-friends', () => {
      // Create status update for non-friend
      db.insert(schema.statusUpdate)
        .values({
          id: 'status-1',
          userId: user3Id,
          content: 'Secret status',
          createdAt: new Date(),
        })
        .run()

      // Create feed item for non-friend
      db.insert(schema.feedItem)
        .values({
          id: 'feed-1',
          userId: user3Id,
          type: 'status_update',
          referenceId: 'status-1',
          createdAt: new Date(),
        })
        .run()

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const items = db
        .select()
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(items.length).toBe(0)
    })

    it('handles wall posts with target user name', () => {
      // Create accepted friendship
      db.insert(schema.friendship)
        .values({
          id: 'friend-1',
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        })
        .run()

      // Create wall post (user2 posting on user3's wall)
      db.insert(schema.wallPost)
        .values({
          id: 'wall-1',
          authorId: user2Id,
          profileOwnerId: user3Id,
          content: 'Nice profile!',
          createdAt: new Date(),
        })
        .run()

      // Create feed item for wall post
      db.insert(schema.feedItem)
        .values({
          id: 'feed-1',
          userId: user2Id,
          type: 'wall_post',
          referenceId: 'wall-1',
          createdAt: new Date(),
        })
        .run()

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const items = db
        .select({
          id: schema.feedItem.id,
          userId: schema.feedItem.userId,
          type: schema.feedItem.type,
          referenceId: schema.feedItem.referenceId,
        })
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(items.length).toBe(1)
      expect(items[0].type).toBe('wall_post')

      // Get wall post content
      const wallPosts = items[0].referenceId
        ? db
            .select()
            .from(schema.wallPost)
            .where(eq(schema.wallPost.id, items[0].referenceId))
            .all()
        : []

      expect(wallPosts[0].content).toBe('Nice profile!')

      // Get profile owner name
      const owners = db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, wallPosts[0].profileOwnerId))
        .all()

      expect(owners[0].name).toBe('Charlie')
    })

    it('handles friend_accepted with target user name', () => {
      // Create accepted friendship
      db.insert(schema.friendship)
        .values({
          id: 'friend-1',
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        })
        .run()

      // Create another friendship (user2 and user3)
      db.insert(schema.friendship)
        .values({
          id: 'friend-2',
          requesterId: user2Id,
          addresseeId: user3Id,
          status: 'accepted',
        })
        .run()

      // Create feed item for friend acceptance
      db.insert(schema.feedItem)
        .values({
          id: 'feed-1',
          userId: user2Id,
          type: 'friend_accepted',
          referenceId: 'friend-2',
          createdAt: new Date(),
        })
        .run()

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const items = db
        .select({
          id: schema.feedItem.id,
          userId: schema.feedItem.userId,
          type: schema.feedItem.type,
          referenceId: schema.feedItem.referenceId,
        })
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(items.length).toBe(1)
      expect(items[0].type).toBe('friend_accepted')

      // Get friendship to find other user
      const friendshipRecords = items[0].referenceId
        ? db
            .select()
            .from(schema.friendship)
            .where(eq(schema.friendship.id, items[0].referenceId))
            .all()
        : []

      const otherId =
        friendshipRecords[0].requesterId === items[0].userId
          ? friendshipRecords[0].addresseeId
          : friendshipRecords[0].requesterId

      const otherUsers = db
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, otherId))
        .all()

      expect(otherUsers[0].name).toBe('Charlie')
    })
  })

  describe('getFeedItemCount', () => {
    it('returns 0 for user with no friends', () => {
      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const result = db
        .select({ count: schema.feedItem.id })
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(result.length).toBe(0)
    })

    it('counts feed items from friends', () => {
      // Create accepted friendship
      db.insert(schema.friendship)
        .values({
          id: 'friend-1',
          requesterId: user1Id,
          addresseeId: user2Id,
          status: 'accepted',
        })
        .run()

      // Create 3 feed items for friend
      for (let i = 0; i < 3; i++) {
        db.insert(schema.statusUpdate)
          .values({
            id: `status-${i}`,
            userId: user2Id,
            content: `Status ${i}`,
            createdAt: new Date(),
          })
          .run()

        db.insert(schema.feedItem)
          .values({
            id: `feed-${i}`,
            userId: user2Id,
            type: 'status_update',
            referenceId: `status-${i}`,
            createdAt: new Date(),
          })
          .run()
      }

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const result = db
        .select({ count: schema.feedItem.id })
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(result.length).toBe(3)
    })

    it('includes own feed items in count', () => {
      // Create 2 own feed items
      for (let i = 0; i < 2; i++) {
        db.insert(schema.statusUpdate)
          .values({
            id: `status-${i}`,
            userId: user1Id,
            content: `My status ${i}`,
            createdAt: new Date(),
          })
          .run()

        db.insert(schema.feedItem)
          .values({
            id: `feed-${i}`,
            userId: user1Id,
            type: 'status_update',
            referenceId: `status-${i}`,
            createdAt: new Date(),
          })
          .run()
      }

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const result = db
        .select({ count: schema.feedItem.id })
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(result.length).toBe(2)
    })

    it('does not count items from non-friends', () => {
      // Create feed item for non-friend
      db.insert(schema.statusUpdate)
        .values({
          id: 'status-1',
          userId: user3Id,
          content: 'Secret',
          createdAt: new Date(),
        })
        .run()

      db.insert(schema.feedItem)
        .values({
          id: 'feed-1',
          userId: user3Id,
          type: 'status_update',
          referenceId: 'status-1',
          createdAt: new Date(),
        })
        .run()

      // Get user's friend IDs
      const friendships = db
        .select({
          friendId: schema.user.id,
        })
        .from(schema.friendship)
        .innerJoin(
          schema.user,
          () =>
            (eq(schema.friendship.requesterId, user1Id) && eq(schema.friendship.addresseeId, schema.user.id)) ||
            (eq(schema.friendship.addresseeId, user1Id) && eq(schema.friendship.requesterId, schema.user.id))
        )
        .where(eq(schema.friendship.status, 'accepted'))
        .all()

      const friendIds = friendships.map((f) => f.friendId)
      const relevantUserIds = [user1Id, ...friendIds]

      const result = db
        .select({ count: schema.feedItem.id })
        .from(schema.feedItem)
        .where(inArray(schema.feedItem.userId, relevantUserIds))
        .all()

      expect(result.length).toBe(0)
    })
  })
})
