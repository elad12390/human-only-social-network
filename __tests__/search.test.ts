import { describe, it, expect, beforeEach, vi } from 'vitest'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
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
  `)

  return db
}

describe('Search System', () => {
  let db: ReturnType<typeof drizzle>

  beforeEach(async () => {
    db = createTestDb()

    db.insert(schema.user)
      .values({
        id: 'user1',
        name: 'John Smith',
        email: 'john@test.com',
        isHuman: true,
      })
      .run()

    db.insert(schema.user)
      .values({
        id: 'user2',
        name: 'Jane Doe',
        email: 'jane@test.com',
        isHuman: true,
      })
      .run()

    db.insert(schema.user)
      .values({
        id: 'user3',
        name: 'John Doe',
        email: 'johndoe@test.com',
        isHuman: true,
      })
      .run()

    vi.doMock('@/lib/db', () => ({
      db: db,
    }))
  })

  it('should search users by name', async () => {
    const { searchUsers } = await import('@/lib/actions/search')
    const results = await searchUsers('John')
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.name)).toContain('John Smith')
    expect(results.map((r) => r.name)).toContain('John Doe')
  })

  it('should be case-insensitive', async () => {
    const { searchUsers } = await import('@/lib/actions/search')
    const results = await searchUsers('john')
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.name)).toContain('John Smith')
    expect(results.map((r) => r.name)).toContain('John Doe')
  })

  it('should return empty array for empty query', async () => {
    const { searchUsers } = await import('@/lib/actions/search')
    const results = await searchUsers('')
    expect(results).toHaveLength(0)
  })

  it('should exclude current user from results', async () => {
    const { searchUsers } = await import('@/lib/actions/search')
    const results = await searchUsers('John', 'user1')
    expect(results).toHaveLength(1)
    expect(results[0].name).toBe('John Doe')
    expect(results[0].id).toBe('user3')
  })
})
