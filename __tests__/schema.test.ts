import { describe, it, expect, beforeEach } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { sql } from 'drizzle-orm'
import * as schema from '@/lib/schema'

function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite, { schema })
  return { db, sqlite }
}

function pushSchema(sqlite: Database.Database) {
  // Create all tables manually for testing
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER DEFAULT 0,
      image TEXT,
      is_human INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS session (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS account (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      access_token TEXT,
      refresh_token TEXT,
      access_token_expires_at INTEGER,
      refresh_token_expires_at INTEGER,
      scope TEXT,
      id_token TEXT,
      password TEXT,
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS verification (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER,
      updated_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS profile (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE REFERENCES user(id),
      bio TEXT,
      profile_photo_url TEXT,
      cover_photo_url TEXT
    );
    CREATE TABLE IF NOT EXISTS friendship (
      id TEXT PRIMARY KEY,
      requester_id TEXT NOT NULL REFERENCES user(id),
      addressee_id TEXT NOT NULL REFERENCES user(id),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS poke (
      id TEXT PRIMARY KEY,
      poker_id TEXT NOT NULL REFERENCES user(id),
      poked_id TEXT NOT NULL REFERENCES user(id),
      created_at INTEGER,
      seen INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS status_update (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      content TEXT NOT NULL,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS wall_post (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL REFERENCES user(id),
      profile_owner_id TEXT NOT NULL REFERENCES user(id),
      content TEXT NOT NULL,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS photo_album (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS photo (
      id TEXT PRIMARY KEY,
      album_id TEXT NOT NULL REFERENCES photo_album(id),
      user_id TEXT NOT NULL REFERENCES user(id),
      blob_url TEXT NOT NULL,
      caption TEXT,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS photo_tag (
      id TEXT PRIMARY KEY,
      photo_id TEXT NOT NULL REFERENCES photo(id),
      tagged_user_id TEXT NOT NULL REFERENCES user(id),
      tagged_by_user_id TEXT NOT NULL REFERENCES user(id)
    );
    CREATE TABLE IF NOT EXISTS message (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL REFERENCES user(id),
      recipient_id TEXT NOT NULL REFERENCES user(id),
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      read INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS "group" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      creator_id TEXT NOT NULL REFERENCES user(id),
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS group_membership (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES "group"(id),
      user_id TEXT NOT NULL REFERENCES user(id),
      role TEXT NOT NULL DEFAULT 'member',
      joined_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS group_wall_post (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES "group"(id),
      author_id TEXT NOT NULL REFERENCES user(id),
      content TEXT NOT NULL,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS event (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      location TEXT,
      start_time INTEGER,
      end_time INTEGER,
      creator_id TEXT NOT NULL REFERENCES user(id),
      group_id TEXT REFERENCES "group"(id),
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS event_rsvp (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES event(id),
      user_id TEXT NOT NULL REFERENCES user(id),
      status TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notification (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      type TEXT NOT NULL,
      reference_id TEXT,
      reference_type TEXT,
      from_user_id TEXT REFERENCES user(id),
      read INTEGER DEFAULT 0,
      created_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS feed_item (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      type TEXT NOT NULL,
      reference_id TEXT,
      created_at INTEGER
    );
  `)
}

describe('Database Schema', () => {
  it('should create all tables without errors', () => {
    const { sqlite } = createTestDb()
    expect(() => pushSchema(sqlite)).not.toThrow()
    sqlite.close()
  })

  it('should insert and retrieve a user', () => {
    const { db, sqlite } = createTestDb()
    pushSchema(sqlite)
    
    db.insert(schema.user).values({
      id: 'user-1',
      name: 'John Doe',
      email: 'john@example.com',
      isHuman: true,
    }).run()

    const users = db.select().from(schema.user).all()
    expect(users).toHaveLength(1)
    expect(users[0].name).toBe('John Doe')
    expect(users[0].email).toBe('john@example.com')
    sqlite.close()
  })

  it('should enforce unique email constraint', () => {
    const { db, sqlite } = createTestDb()
    pushSchema(sqlite)
    
    db.insert(schema.user).values({
      id: 'user-1',
      name: 'John',
      email: 'john@example.com',
    }).run()

    expect(() => {
      db.insert(schema.user).values({
        id: 'user-2',
        name: 'Jane',
        email: 'john@example.com',
      }).run()
    }).toThrow()
    sqlite.close()
  })

  it('should create a profile linked to a user', () => {
    const { db, sqlite } = createTestDb()
    pushSchema(sqlite)
    
    db.insert(schema.user).values({
      id: 'user-1',
      name: 'John',
      email: 'john@example.com',
    }).run()

    db.insert(schema.profile).values({
      id: 'profile-1',
      userId: 'user-1',
      bio: 'Hello world',
    }).run()

    const profiles = db.select().from(schema.profile).all()
    expect(profiles).toHaveLength(1)
    expect(profiles[0].bio).toBe('Hello world')
    sqlite.close()
  })

  it('should create a friendship between two users', () => {
    const { db, sqlite } = createTestDb()
    pushSchema(sqlite)
    
    db.insert(schema.user).values({ id: 'user-1', name: 'Alice', email: 'alice@example.com' }).run()
    db.insert(schema.user).values({ id: 'user-2', name: 'Bob', email: 'bob@example.com' }).run()

    db.insert(schema.friendship).values({
      id: 'friend-1',
      requesterId: 'user-1',
      addresseeId: 'user-2',
      status: 'pending',
    }).run()

    const friendships = db.select().from(schema.friendship).all()
    expect(friendships).toHaveLength(1)
    expect(friendships[0].status).toBe('pending')
    sqlite.close()
  })
})
