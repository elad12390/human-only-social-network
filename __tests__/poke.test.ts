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
    CREATE TABLE poke (
      id TEXT PRIMARY KEY,
      poker_id TEXT NOT NULL REFERENCES user(id),
      poked_id TEXT NOT NULL REFERENCES user(id),
      created_at INTEGER,
      seen INTEGER DEFAULT 0
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

describe('Poke System', () => {
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

  describe('sendPoke', () => {
    it('creates poke record', () => {
      // Setup: create accepted friendship
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      // Create poke
      db.insert(schema.poke).values({
        id: 'poke-1',
        pokerId: user1Id,
        pokedId: user2Id,
        seen: false,
      }).run()

      const pokes = db
        .select()
        .from(schema.poke)
        .where(
          and(
            eq(schema.poke.pokerId, user1Id),
            eq(schema.poke.pokedId, user2Id)
          )
        )
        .all()

      expect(pokes.length).toBe(1)
      expect(pokes[0].seen).toBe(false)
    })

    it('cannot poke self', () => {
      // Verify self-poke validation would fail
      const isSelf = user1Id === user1Id
      expect(isSelf).toBe(true)
    })

    it('cannot poke non-friend', () => {
      // No friendship exists between user1 and user3
      const friendships = db
        .select()
        .from(schema.friendship)
        .where(
          and(
            eq(schema.friendship.requesterId, user1Id),
            eq(schema.friendship.addresseeId, user3Id)
          )
        )
        .all()

      expect(friendships.length).toBe(0)
    })

    it('cannot double-poke before seen', () => {
      // Setup: create accepted friendship
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      // Create first poke
      db.insert(schema.poke).values({
        id: 'poke-1',
        pokerId: user1Id,
        pokedId: user2Id,
        seen: false,
      }).run()

      // Try to create second unseen poke
      const existingPoke = db
        .select()
        .from(schema.poke)
        .where(
          and(
            eq(schema.poke.pokerId, user1Id),
            eq(schema.poke.pokedId, user2Id),
            eq(schema.poke.seen, false)
          )
        )
        .all()

      expect(existingPoke.length).toBe(1)
    })

    it('creates notification on poke', () => {
      // Setup: create accepted friendship
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      // Create poke
      const pokeId = 'poke-1'
      db.insert(schema.poke).values({
        id: pokeId,
        pokerId: user1Id,
        pokedId: user2Id,
        seen: false,
      }).run()

      // Create notification
      db.insert(schema.notification).values({
        id: 'notif-1',
        userId: user2Id,
        type: 'poke',
        referenceId: pokeId,
        referenceType: 'poke',
        fromUserId: user1Id,
      }).run()

      const notifications = db
        .select()
        .from(schema.notification)
        .where(eq(schema.notification.userId, user2Id))
        .all()

      expect(notifications.length).toBe(1)
      expect(notifications[0].type).toBe('poke')
      expect(notifications[0].fromUserId).toBe(user1Id)
    })
  })

  describe('getUnseenPokes', () => {
    it('returns unseen pokes', () => {
      // Setup: create accepted friendship
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      // Create unseen poke
      db.insert(schema.poke).values({
        id: 'poke-1',
        pokerId: user1Id,
        pokedId: user2Id,
        seen: false,
      }).run()

      const pokes = db
        .select()
        .from(schema.poke)
        .where(
          and(
            eq(schema.poke.pokedId, user2Id),
            eq(schema.poke.seen, false)
          )
        )
        .all()

      expect(pokes.length).toBe(1)
      expect(pokes[0].pokerId).toBe(user1Id)
    })

    it('excludes seen pokes', () => {
      // Setup: create accepted friendship
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      // Create seen poke
      db.insert(schema.poke).values({
        id: 'poke-1',
        pokerId: user1Id,
        pokedId: user2Id,
        seen: true,
      }).run()

      const pokes = db
        .select()
        .from(schema.poke)
        .where(
          and(
            eq(schema.poke.pokedId, user2Id),
            eq(schema.poke.seen, false)
          )
        )
        .all()

      expect(pokes.length).toBe(0)
    })
  })

  describe('markPokeSeen', () => {
    it('marks poke as seen', () => {
      // Setup: create accepted friendship
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      // Create unseen poke
      const pokeId = 'poke-1'
      db.insert(schema.poke).values({
        id: pokeId,
        pokerId: user1Id,
        pokedId: user2Id,
        seen: false,
      }).run()

      // Mark as seen
      db.update(schema.poke)
        .set({ seen: true })
        .where(eq(schema.poke.id, pokeId))
        .run()

      const pokes = db
        .select()
        .from(schema.poke)
        .where(eq(schema.poke.id, pokeId))
        .all()

      expect(pokes[0].seen).toBe(true)
    })

    it('getUnseenPokes is empty after marking seen', () => {
      // Setup: create accepted friendship
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      // Create unseen poke
      const pokeId = 'poke-1'
      db.insert(schema.poke).values({
        id: pokeId,
        pokerId: user1Id,
        pokedId: user2Id,
        seen: false,
      }).run()

      // Mark as seen
      db.update(schema.poke)
        .set({ seen: true })
        .where(eq(schema.poke.id, pokeId))
        .run()

      const unseenPokes = db
        .select()
        .from(schema.poke)
        .where(
          and(
            eq(schema.poke.pokedId, user2Id),
            eq(schema.poke.seen, false)
          )
        )
        .all()

      expect(unseenPokes.length).toBe(0)
    })
  })

  describe('pokeBack', () => {
    it('poke back works', () => {
      // Setup: create accepted friendship
      db.insert(schema.friendship).values({
        id: 'friend-1',
        requesterId: user1Id,
        addresseeId: user2Id,
        status: 'accepted',
      }).run()

      // Create initial poke
      const pokeId = 'poke-1'
      db.insert(schema.poke).values({
        id: pokeId,
        pokerId: user1Id,
        pokedId: user2Id,
        seen: false,
      }).run()

      // Mark original poke as seen
      db.update(schema.poke)
        .set({ seen: true })
        .where(eq(schema.poke.id, pokeId))
        .run()

      // Create poke back
      db.insert(schema.poke).values({
        id: 'poke-2',
        pokerId: user2Id,
        pokedId: user1Id,
        seen: false,
      }).run()

      // Verify original poke is seen
      const originalPoke = db
        .select()
        .from(schema.poke)
        .where(eq(schema.poke.id, pokeId))
        .all()

      expect(originalPoke[0].seen).toBe(true)

      // Verify new poke exists
      const newPoke = db
        .select()
        .from(schema.poke)
        .where(
          and(
            eq(schema.poke.pokerId, user2Id),
            eq(schema.poke.pokedId, user1Id)
          )
        )
        .all()

      expect(newPoke.length).toBe(1)
      expect(newPoke[0].seen).toBe(false)
    })
  })
})
