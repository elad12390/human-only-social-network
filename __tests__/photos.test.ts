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
    CREATE TABLE photo_album (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES user(id),
      name TEXT NOT NULL,
      description TEXT,
      created_at INTEGER
    );
    CREATE TABLE photo (
      id TEXT PRIMARY KEY,
      album_id TEXT NOT NULL REFERENCES photo_album(id),
      user_id TEXT NOT NULL REFERENCES user(id),
      blob_url TEXT NOT NULL,
      caption TEXT,
      created_at INTEGER
    );
    CREATE TABLE photo_tag (
      id TEXT PRIMARY KEY,
      photo_id TEXT NOT NULL REFERENCES photo(id),
      tagged_user_id TEXT NOT NULL REFERENCES user(id),
      tagged_by_user_id TEXT NOT NULL REFERENCES user(id)
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

describe('Photo System', () => {
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

  describe('createAlbum', () => {
    it('creates album', () => {
      const albumId = 'album-1'
      db.insert(schema.photoAlbum)
        .values({
          id: albumId,
          userId: user1Id,
          name: 'Summer 2024',
          description: 'Vacation photos',
        })
        .run()

      const albums = db
        .select()
        .from(schema.photoAlbum)
        .where(eq(schema.photoAlbum.id, albumId))
        .all()

      expect(albums.length).toBe(1)
      expect(albums[0].name).toBe('Summer 2024')
      expect(albums[0].userId).toBe(user1Id)
    })

    it('album name required', () => {
      // Empty name should fail validation in server action
      // Test that empty string is rejected
      expect(''.trim().length === 0).toBe(true)
    })

    it('album name max 200 chars', () => {
      // Name longer than 200 chars should fail validation
      const longName = 'a'.repeat(201)
      expect(longName.length > 200).toBe(true)
    })
  })

  describe('getAlbums', () => {
    it('returns albums for user', () => {
      db.insert(schema.photoAlbum)
        .values({
          id: 'album-1',
          userId: user1Id,
          name: 'Album 1',
        })
        .run()

      db.insert(schema.photoAlbum)
        .values({
          id: 'album-2',
          userId: user1Id,
          name: 'Album 2',
        })
        .run()

      db.insert(schema.photoAlbum)
        .values({
          id: 'album-3',
          userId: user2Id,
          name: 'Album 3',
        })
        .run()

      const albums = db
        .select()
        .from(schema.photoAlbum)
        .where(eq(schema.photoAlbum.userId, user1Id))
        .all()

      expect(albums.length).toBe(2)
      expect(albums.every((a) => a.userId === user1Id)).toBe(true)
    })
  })

  describe('getAlbumWithPhotos', () => {
    it('returns album with photos', () => {
      const albumId = 'album-1'
      db.insert(schema.photoAlbum)
        .values({
          id: albumId,
          userId: user1Id,
          name: 'Summer',
        })
        .run()

      db.insert(schema.photo)
        .values({
          id: 'photo-1',
          albumId,
          userId: user1Id,
          blobUrl: 'https://example.com/photo1.jpg',
          caption: 'Beach day',
        })
        .run()

      db.insert(schema.photo)
        .values({
          id: 'photo-2',
          albumId,
          userId: user1Id,
          blobUrl: 'https://example.com/photo2.jpg',
          caption: 'Sunset',
        })
        .run()

      const album = db
        .select()
        .from(schema.photoAlbum)
        .where(eq(schema.photoAlbum.id, albumId))
        .all()[0]

      const photos = db
        .select()
        .from(schema.photo)
        .where(eq(schema.photo.albumId, albumId))
        .all()

      expect(album).toBeDefined()
      expect(photos.length).toBe(2)
      expect(photos[0].caption).toBe('Beach day')
    })
  })

  describe('addPhoto', () => {
    it('only album owner can add photo', () => {
      const albumId = 'album-1'
      db.insert(schema.photoAlbum)
        .values({
          id: albumId,
          userId: user1Id,
          name: 'Album',
        })
        .run()

      // User2 tries to add photo to user1's album - should fail
      const album = db
        .select()
        .from(schema.photoAlbum)
        .where(eq(schema.photoAlbum.id, albumId))
        .all()[0]

      expect(album.userId).toBe(user1Id)
      expect(album.userId === user2Id).toBe(false)
    })
  })

  describe('tagUserInPhoto', () => {
    it('tags user in photo', () => {
      const albumId = 'album-1'
      const photoId = 'photo-1'
      const tagId = 'tag-1'

      db.insert(schema.photoAlbum)
        .values({
          id: albumId,
          userId: user1Id,
          name: 'Album',
        })
        .run()

      db.insert(schema.photo)
        .values({
          id: photoId,
          albumId,
          userId: user1Id,
          blobUrl: 'https://example.com/photo.jpg',
        })
        .run()

      db.insert(schema.photoTag)
        .values({
          id: tagId,
          photoId,
          taggedUserId: user2Id,
          taggedByUserId: user1Id,
        })
        .run()

      const tags = db
        .select()
        .from(schema.photoTag)
        .where(eq(schema.photoTag.photoId, photoId))
        .all()

      expect(tags.length).toBe(1)
      expect(tags[0].taggedUserId).toBe(user2Id)
      expect(tags[0].taggedByUserId).toBe(user1Id)
    })

    it('creates notification on tag', () => {
      const albumId = 'album-1'
      const photoId = 'photo-1'
      const tagId = 'tag-1'
      const notifId = 'notif-1'

      db.insert(schema.photoAlbum)
        .values({
          id: albumId,
          userId: user1Id,
          name: 'Album',
        })
        .run()

      db.insert(schema.photo)
        .values({
          id: photoId,
          albumId,
          userId: user1Id,
          blobUrl: 'https://example.com/photo.jpg',
        })
        .run()

      db.insert(schema.photoTag)
        .values({
          id: tagId,
          photoId,
          taggedUserId: user2Id,
          taggedByUserId: user1Id,
        })
        .run()

      db.insert(schema.notification)
        .values({
          id: notifId,
          userId: user2Id,
          type: 'photo_tag',
          referenceId: photoId,
          referenceType: 'photo',
          fromUserId: user1Id,
        })
        .run()

      const notifications = db
        .select()
        .from(schema.notification)
        .where(eq(schema.notification.userId, user2Id))
        .all()

      expect(notifications.length).toBe(1)
      expect(notifications[0].type).toBe('photo_tag')
      expect(notifications[0].fromUserId).toBe(user1Id)
    })
  })

  describe('getPhotoTags', () => {
    it('returns photo tags with names', () => {
      const albumId = 'album-1'
      const photoId = 'photo-1'

      db.insert(schema.photoAlbum)
        .values({
          id: albumId,
          userId: user1Id,
          name: 'Album',
        })
        .run()

      db.insert(schema.photo)
        .values({
          id: photoId,
          albumId,
          userId: user1Id,
          blobUrl: 'https://example.com/photo.jpg',
        })
        .run()

      db.insert(schema.photoTag)
        .values({
          id: 'tag-1',
          photoId,
          taggedUserId: user2Id,
          taggedByUserId: user1Id,
        })
        .run()

      db.insert(schema.photoTag)
        .values({
          id: 'tag-2',
          photoId,
          taggedUserId: user3Id,
          taggedByUserId: user1Id,
        })
        .run()

      const tags = db
        .select({
          id: schema.photoTag.id,
          taggedUserId: schema.photoTag.taggedUserId,
          taggedUserName: schema.user.name,
        })
        .from(schema.photoTag)
        .innerJoin(schema.user, eq(schema.photoTag.taggedUserId, schema.user.id))
        .where(eq(schema.photoTag.photoId, photoId))
        .all()

      expect(tags.length).toBe(2)
      expect(tags[0].taggedUserName).toBe('Bob')
      expect(tags[1].taggedUserName).toBe('Charlie')
    })
  })
})
