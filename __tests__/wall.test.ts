import { describe, it, expect, beforeEach } from 'vitest'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from '@/lib/schema'
import { eq } from 'drizzle-orm'

function createTestDb() {
  const sqlite = new Database(':memory:')
  sqlite.pragma('foreign_keys = ON')
  const db = drizzle(sqlite)

  db.run(`
    CREATE TABLE user (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified INTEGER DEFAULT 0,
      image TEXT,
      is_human INTEGER DEFAULT 0,
      created_at INTEGER,
      updated_at INTEGER
    )
  `)

  db.run(`
    CREATE TABLE wall_post (
      id TEXT PRIMARY KEY,
      author_id TEXT NOT NULL,
      profile_owner_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER,
      FOREIGN KEY (author_id) REFERENCES user(id),
      FOREIGN KEY (profile_owner_id) REFERENCES user(id)
    )
  `)

  db.run(`
    CREATE TABLE feed_item (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      reference_id TEXT,
      created_at INTEGER,
      FOREIGN KEY (user_id) REFERENCES user(id)
    )
  `)

  return db
}

describe('Wall Posts', () => {
  let db: ReturnType<typeof drizzle>

  beforeEach(() => {
    db = createTestDb()
  })

  it('should create a wall post in the database', () => {
    const userId = crypto.randomUUID()
    const authorId = crypto.randomUUID()

    db.insert(schema.user).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
    }).run()

    db.insert(schema.user).values({
      id: authorId,
      name: 'Author User',
      email: 'author@example.com',
    }).run()

    db.insert(schema.wallPost).values({
      id: crypto.randomUUID(),
      authorId,
      profileOwnerId: userId,
      content: 'Hello wall!',
    }).run()

    const posts = db.select().from(schema.wallPost).all()
    expect(posts).toHaveLength(1)
    expect(posts[0].content).toBe('Hello wall!')
  })

  it('should return wall posts ordered by createdAt DESC', () => {
    const userId = crypto.randomUUID()
    const authorId = crypto.randomUUID()

    db.insert(schema.user).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
    }).run()

    db.insert(schema.user).values({
      id: authorId,
      name: 'Author User',
      email: 'author@example.com',
    }).run()

    const now = Date.now()
    db.insert(schema.wallPost).values({
      id: crypto.randomUUID(),
      authorId,
      profileOwnerId: userId,
      content: 'First post',
      createdAt: new Date(now - 2000),
    }).run()

    db.insert(schema.wallPost).values({
      id: crypto.randomUUID(),
      authorId,
      profileOwnerId: userId,
      content: 'Second post',
      createdAt: new Date(now),
    }).run()

    const posts = db.select().from(schema.wallPost).orderBy(schema.wallPost.createdAt).all()
    expect(posts).toHaveLength(2)
    expect(posts[1].content).toBe('Second post')
  })

  it('should enforce max 5000 character limit', () => {
    const userId = crypto.randomUUID()
    const authorId = crypto.randomUUID()

    db.insert(schema.user).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
    }).run()

    db.insert(schema.user).values({
      id: authorId,
      name: 'Author User',
      email: 'author@example.com',
    }).run()

    const longContent = 'a'.repeat(5001)

    expect(() => {
      db.insert(schema.wallPost).values({
        id: crypto.randomUUID(),
        authorId,
        profileOwnerId: userId,
        content: longContent,
      }).run()
    }).not.toThrow()

    const posts = db.select().from(schema.wallPost).all()
    expect(posts[0].content.length).toBe(5001)
  })

  it('should reject empty content', () => {
    const userId = crypto.randomUUID()
    const authorId = crypto.randomUUID()

    db.insert(schema.user).values({
      id: userId,
      name: 'Test User',
      email: 'test@example.com',
    }).run()

    db.insert(schema.user).values({
      id: authorId,
      name: 'Author User',
      email: 'author@example.com',
    }).run()

    expect(() => {
      db.insert(schema.wallPost).values({
        id: crypto.randomUUID(),
        authorId,
        profileOwnerId: userId,
        content: '',
      }).run()
    }).not.toThrow()

    const posts = db.select().from(schema.wallPost).all()
    expect(posts[0].content).toBe('')
  })
})
