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
    CREATE TABLE "group" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      creator_id TEXT NOT NULL REFERENCES user(id),
      created_at INTEGER
    );
    CREATE TABLE group_membership (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES "group"(id),
      user_id TEXT NOT NULL REFERENCES user(id),
      role TEXT NOT NULL DEFAULT 'member',
      joined_at INTEGER
    );
    CREATE TABLE group_wall_post (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES "group"(id),
      author_id TEXT NOT NULL REFERENCES user(id),
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

  return db
}

describe('Groups System', () => {
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

  describe('createGroup', () => {
    it('creates group', () => {
      const groupId = 'group-1'
      const now = new Date()

      db.insert(schema.group)
        .values({
          id: groupId,
          name: 'Tech Enthusiasts',
          description: 'A group for tech lovers',
          creatorId: user1Id,
          createdAt: now,
        })
        .run()

      const groups = db
        .select()
        .from(schema.group)
        .where(eq(schema.group.id, groupId))
        .all()

      expect(groups.length).toBe(1)
      expect(groups[0].name).toBe('Tech Enthusiasts')
      expect(groups[0].description).toBe('A group for tech lovers')
      expect(groups[0].creatorId).toBe(user1Id)
      expect(groups[0].createdAt).toBeDefined()
    })
  })

  describe('groupMembership', () => {
    it('creator is admin', () => {
      const groupId = 'group-1'
      const membershipId = 'membership-1'
      const now = new Date()

      db.insert(schema.group)
        .values({
          id: groupId,
          name: 'Tech Enthusiasts',
          description: 'A group for tech lovers',
          creatorId: user1Id,
          createdAt: now,
        })
        .run()

      db.insert(schema.groupMembership)
        .values({
          id: membershipId,
          groupId: groupId,
          userId: user1Id,
          role: 'admin',
          joinedAt: now,
        })
        .run()

      const memberships = db
        .select()
        .from(schema.groupMembership)
        .where(eq(schema.groupMembership.id, membershipId))
        .all()

      expect(memberships.length).toBe(1)
      expect(memberships[0].role).toBe('admin')
      expect(memberships[0].userId).toBe(user1Id)
    })

    it('join group creates membership', () => {
      const groupId = 'group-1'
      const membershipId = 'membership-2'
      const now = new Date()

      db.insert(schema.group)
        .values({
          id: groupId,
          name: 'Tech Enthusiasts',
          description: 'A group for tech lovers',
          creatorId: user1Id,
          createdAt: now,
        })
        .run()

      db.insert(schema.groupMembership)
        .values({
          id: membershipId,
          groupId: groupId,
          userId: user2Id,
          role: 'member',
          joinedAt: now,
        })
        .run()

      const memberships = db
        .select()
        .from(schema.groupMembership)
        .where(eq(schema.groupMembership.id, membershipId))
        .all()

      expect(memberships.length).toBe(1)
      expect(memberships[0].userId).toBe(user2Id)
      expect(memberships[0].role).toBe('member')
    })

    it('leave group removes membership', () => {
      const groupId = 'group-1'
      const membershipId = 'membership-3'
      const now = new Date()

      db.insert(schema.group)
        .values({
          id: groupId,
          name: 'Tech Enthusiasts',
          description: 'A group for tech lovers',
          creatorId: user1Id,
          createdAt: now,
        })
        .run()

      db.insert(schema.groupMembership)
        .values({
          id: membershipId,
          groupId: groupId,
          userId: user2Id,
          role: 'member',
          joinedAt: now,
        })
        .run()

      db.delete(schema.groupMembership)
        .where(eq(schema.groupMembership.id, membershipId))
        .run()

      const memberships = db
        .select()
        .from(schema.groupMembership)
        .where(eq(schema.groupMembership.id, membershipId))
        .all()

      expect(memberships.length).toBe(0)
    })
  })

  describe('groupWallPost', () => {
    it('group wall post only by members', () => {
      const groupId = 'group-1'
      const membershipId = 'membership-4'
      const postId = 'post-1'
      const now = new Date()

      db.insert(schema.group)
        .values({
          id: groupId,
          name: 'Tech Enthusiasts',
          description: 'A group for tech lovers',
          creatorId: user1Id,
          createdAt: now,
        })
        .run()

      db.insert(schema.groupMembership)
        .values({
          id: membershipId,
          groupId: groupId,
          userId: user1Id,
          role: 'member',
          joinedAt: now,
        })
        .run()

      db.insert(schema.groupWallPost)
        .values({
          id: postId,
          groupId: groupId,
          authorId: user1Id,
          content: 'This is a wall post',
          createdAt: now,
        })
        .run()

      const posts = db
        .select()
        .from(schema.groupWallPost)
        .where(eq(schema.groupWallPost.id, postId))
        .all()

      expect(posts.length).toBe(1)
      expect(posts[0].content).toBe('This is a wall post')
      expect(posts[0].authorId).toBe(user1Id)

      const user2Memberships = db
        .select()
        .from(schema.groupMembership)
        .where(eq(schema.groupMembership.userId, user2Id))
        .all()

      expect(user2Memberships.length).toBe(0)
    })
  })

  describe('feedItem', () => {
    it('feed item created on group join', () => {
      const groupId = 'group-1'
      const membershipId = 'membership-5'
      const feedItemId = 'feed-1'
      const now = new Date()

      db.insert(schema.group)
        .values({
          id: groupId,
          name: 'Tech Enthusiasts',
          description: 'A group for tech lovers',
          creatorId: user1Id,
          createdAt: now,
        })
        .run()

      db.insert(schema.groupMembership)
        .values({
          id: membershipId,
          groupId: groupId,
          userId: user2Id,
          role: 'member',
          joinedAt: now,
        })
        .run()

      db.insert(schema.feedItem)
        .values({
          id: feedItemId,
          userId: user2Id,
          type: 'group_joined',
          referenceId: groupId,
          createdAt: now,
        })
        .run()

      const feedItems = db
        .select()
        .from(schema.feedItem)
        .where(eq(schema.feedItem.id, feedItemId))
        .all()

      expect(feedItems.length).toBe(1)
      expect(feedItems[0].type).toBe('group_joined')
      expect(feedItems[0].userId).toBe(user2Id)
      expect(feedItems[0].referenceId).toBe(groupId)
    })
  })
})
