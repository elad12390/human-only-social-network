import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

// Auth tables (Better Auth compatible)
export const user = sqliteTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  image: text('image'),
  isHuman: integer('is_human', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const account = sqliteTable('account', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Profile
export const profile = sqliteTable('profile', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().unique().references(() => user.id),
  bio: text('bio'),
  profilePhotoUrl: text('profile_photo_url'),
  coverPhotoUrl: text('cover_photo_url'),
})

// Social
export const friendship = sqliteTable('friendship', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  requesterId: text('requester_id').notNull().references(() => user.id),
  addresseeId: text('addressee_id').notNull().references(() => user.id),
  status: text('status', { enum: ['pending', 'accepted', 'declined'] }).notNull().default('pending'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const poke = sqliteTable('poke', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  pokerId: text('poker_id').notNull().references(() => user.id),
  pokedId: text('poked_id').notNull().references(() => user.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  seen: integer('seen', { mode: 'boolean' }).default(false),
})

// Content
export const statusUpdate = sqliteTable('status_update', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const wallPost = sqliteTable('wall_post', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  authorId: text('author_id').notNull().references(() => user.id),
  profileOwnerId: text('profile_owner_id').notNull().references(() => user.id),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const photoAlbum = sqliteTable('photo_album', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const photo = sqliteTable('photo', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  albumId: text('album_id').notNull().references(() => photoAlbum.id),
  userId: text('user_id').notNull().references(() => user.id),
  blobUrl: text('blob_url').notNull(),
  caption: text('caption'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const photoTag = sqliteTable('photo_tag', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  photoId: text('photo_id').notNull().references(() => photo.id),
  taggedUserId: text('tagged_user_id').notNull().references(() => user.id),
  taggedByUserId: text('tagged_by_user_id').notNull().references(() => user.id),
})

// Messaging
export const message = sqliteTable('message', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  senderId: text('sender_id').notNull().references(() => user.id),
  recipientId: text('recipient_id').notNull().references(() => user.id),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Community
export const group = sqliteTable('group', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  creatorId: text('creator_id').notNull().references(() => user.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const groupMembership = sqliteTable('group_membership', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  groupId: text('group_id').notNull().references(() => group.id),
  userId: text('user_id').notNull().references(() => user.id),
  role: text('role', { enum: ['member', 'admin'] }).notNull().default('member'),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const groupWallPost = sqliteTable('group_wall_post', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  groupId: text('group_id').notNull().references(() => group.id),
  authorId: text('author_id').notNull().references(() => user.id),
  content: text('content').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const event = sqliteTable('event', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  location: text('location'),
  startTime: integer('start_time', { mode: 'timestamp' }),
  endTime: integer('end_time', { mode: 'timestamp' }),
  creatorId: text('creator_id').notNull().references(() => user.id),
  groupId: text('group_id').references(() => group.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

export const eventRsvp = sqliteTable('event_rsvp', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text('event_id').notNull().references(() => event.id),
  userId: text('user_id').notNull().references(() => user.id),
  status: text('status', { enum: ['attending', 'maybe', 'declined'] }).notNull(),
})

// Notifications
export const notification = sqliteTable('notification', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id),
  type: text('type').notNull(),
  referenceId: text('reference_id'),
  referenceType: text('reference_type'),
  fromUserId: text('from_user_id').references(() => user.id),
  read: integer('read', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})

// Feed
export const feedItem = sqliteTable('feed_item', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text('user_id').notNull().references(() => user.id),
  type: text('type').notNull(),
  referenceId: text('reference_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
})
