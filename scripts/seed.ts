import Database from 'better-sqlite3'

const sqlite = new Database('local.db')

// Enable WAL mode for better performance
sqlite.pragma('journal_mode = WAL')

// Create all tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS "user" (
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
    user_id TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    created_at INTEGER,
    updated_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
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
    user_id TEXT NOT NULL UNIQUE,
    bio TEXT,
    profile_photo_url TEXT,
    cover_photo_url TEXT
  );

  CREATE TABLE IF NOT EXISTS friendship (
    id TEXT PRIMARY KEY,
    requester_id TEXT NOT NULL,
    addressee_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS poke (
    id TEXT PRIMARY KEY,
    poker_id TEXT NOT NULL,
    poked_id TEXT NOT NULL,
    seen INTEGER DEFAULT 0,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS status_update (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS wall_post (
    id TEXT PRIMARY KEY,
    author_id TEXT NOT NULL,
    profile_owner_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS photo_album (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS photo (
    id TEXT PRIMARY KEY,
    album_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    blob_url TEXT NOT NULL,
    caption TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS photo_tag (
    id TEXT PRIMARY KEY,
    photo_id TEXT NOT NULL,
    tagged_user_id TEXT NOT NULL,
    tagged_by_user_id TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS message (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    recipient_id TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    "read" INTEGER DEFAULT 0,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS "group" (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    creator_id TEXT NOT NULL,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS group_membership (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS group_wall_post (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    author_id TEXT NOT NULL,
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
    creator_id TEXT NOT NULL,
    group_id TEXT,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS event_rsvp (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notification (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    reference_id TEXT,
    reference_type TEXT,
    from_user_id TEXT,
    "read" INTEGER DEFAULT 0,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS feed_item (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL,
    reference_id TEXT,
    created_at INTEGER
  );
`)

// Helper to generate UUIDs
function uuid(): string {
  return crypto.randomUUID()
}

// Helper for timestamps
const now = Math.floor(Date.now() / 1000)
const hour = 3600
const day = 86400

// Clear existing data
sqlite.exec('DELETE FROM feed_item')
sqlite.exec('DELETE FROM notification')
sqlite.exec('DELETE FROM event_rsvp')
sqlite.exec('DELETE FROM event')
sqlite.exec('DELETE FROM group_wall_post')
sqlite.exec('DELETE FROM group_membership')
sqlite.exec('DELETE FROM "group"')
sqlite.exec('DELETE FROM message')
sqlite.exec('DELETE FROM photo_tag')
sqlite.exec('DELETE FROM photo')
sqlite.exec('DELETE FROM photo_album')
sqlite.exec('DELETE FROM wall_post')
sqlite.exec('DELETE FROM status_update')
sqlite.exec('DELETE FROM poke')
sqlite.exec('DELETE FROM friendship')
sqlite.exec('DELETE FROM profile')
sqlite.exec('DELETE FROM account')
sqlite.exec('DELETE FROM session')
sqlite.exec('DELETE FROM "user"')

// ===== SEED USERS =====
// Note: passwords are hashed by Better Auth, so we create users with accounts
// For seed data, users can log in via the registration form
const users = [
  { id: 'user-1', name: 'Mark Human', email: 'mark@humanbook.com' },
  { id: 'user-2', name: 'Sarah Connor', email: 'sarah@humanbook.com' },
  { id: 'user-3', name: 'John Smith', email: 'john@humanbook.com' },
  { id: 'user-4', name: 'Jane Doe', email: 'jane@humanbook.com' },
  { id: 'user-5', name: 'Bob Wilson', email: 'bob@humanbook.com' },
  { id: 'user-6', name: 'Alice Johnson', email: 'alice@humanbook.com' },
  { id: 'user-7', name: 'Charlie Brown', email: 'charlie@humanbook.com' },
  { id: 'user-8', name: 'Diana Prince', email: 'diana@humanbook.com' },
  { id: 'user-9', name: 'Eve Adams', email: 'eve@humanbook.com' },
  { id: 'user-10', name: 'Frank Castle', email: 'frank@humanbook.com' },
]

const insertUser = sqlite.prepare('INSERT INTO "user" (id, name, email, is_human, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)')
for (const u of users) {
  insertUser.run(u.id, u.name, u.email, now - day * 30, now - day * 30)
}

// ===== PROFILES =====
const insertProfile = sqlite.prepare('INSERT INTO profile (id, user_id, bio) VALUES (?, ?, ?)')
const bios = [
  'Founder of HumanBook. Definitely not a robot.',
  'Come with me if you want to live.',
  'Just a regular human doing human things.',
  'I love coffee and long walks on the beach.',
  'Software engineer by day, human by night.',
  'Curiouser and curiouser.',
  'Good grief!',
  'Truth and justice for all.',
  'Knowledge is power.',
  'One batch, two batch, penny and dime.',
]
for (let i = 0; i < users.length; i++) {
  insertProfile.run(uuid(), users[i].id, bios[i])
}

// ===== FRIENDSHIPS (accepted) =====
const insertFriendship = sqlite.prepare('INSERT INTO friendship (id, requester_id, addressee_id, status, created_at) VALUES (?, ?, ?, ?, ?)')
const friendPairs = [
  ['user-1', 'user-2'], ['user-1', 'user-3'], ['user-1', 'user-4'],
  ['user-1', 'user-5'], ['user-2', 'user-3'], ['user-2', 'user-6'],
  ['user-3', 'user-4'], ['user-3', 'user-7'], ['user-4', 'user-8'],
  ['user-5', 'user-6'], ['user-5', 'user-9'], ['user-6', 'user-7'],
  ['user-7', 'user-8'], ['user-8', 'user-9'], ['user-9', 'user-10'],
  ['user-1', 'user-10'], ['user-2', 'user-10'],
]
for (const [a, b] of friendPairs) {
  insertFriendship.run(uuid(), a, b, 'accepted', now - day * 20)
}

// Pending friend request
insertFriendship.run(uuid(), 'user-6', 'user-1', 'pending', now - hour * 2)

// ===== STATUS UPDATES =====
const insertStatus = sqlite.prepare('INSERT INTO status_update (id, user_id, content, created_at) VALUES (?, ?, ?, ?)')
const statuses = [
  ['user-1', 'Mark Human is building the future of human connection.', now - day * 2],
  ['user-2', 'Sarah Connor is preparing for the future.', now - day * 1],
  ['user-3', 'John Smith is having a great day!', now - hour * 12],
  ['user-4', 'Jane Doe is reading a good book.', now - hour * 6],
  ['user-5', 'Bob Wilson is coding something awesome.', now - hour * 3],
  ['user-6', 'Alice Johnson is wondering about the meaning of life.', now - hour * 1],
]
for (const [userId, content, ts] of statuses) {
  insertStatus.run(uuid(), userId, content, ts)
}

// ===== WALL POSTS =====
const insertWallPost = sqlite.prepare('INSERT INTO wall_post (id, author_id, profile_owner_id, content, created_at) VALUES (?, ?, ?, ?, ?)')
const wallPosts = [
  ['user-2', 'user-1', 'Hey Mark! Welcome to HumanBook!', now - day * 15],
  ['user-3', 'user-1', 'Great site, very human-friendly.', now - day * 10],
  ['user-1', 'user-2', 'Thanks for joining Sarah!', now - day * 14],
  ['user-4', 'user-3', 'Happy birthday John!', now - day * 5],
  ['user-5', 'user-6', 'Nice profile pic Alice!', now - day * 3],
]
for (const [authorId, profileOwnerId, content, ts] of wallPosts) {
  insertWallPost.run(uuid(), authorId, profileOwnerId, content, ts)
}

// ===== POKES =====
const insertPoke = sqlite.prepare('INSERT INTO poke (id, poker_id, poked_id, seen, created_at) VALUES (?, ?, ?, ?, ?)')
insertPoke.run(uuid(), 'user-2', 'user-1', 0, now - hour * 1)
insertPoke.run(uuid(), 'user-5', 'user-1', 0, now - hour * 3)

// ===== MESSAGES =====
const insertMessage = sqlite.prepare('INSERT INTO message (id, sender_id, recipient_id, subject, body, "read", created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
insertMessage.run(uuid(), 'user-2', 'user-1', 'Welcome!', 'Hey Mark, welcome to the network!', 0, now - day * 10)
insertMessage.run(uuid(), 'user-3', 'user-1', 'Question', 'How do I upload photos?', 0, now - day * 5)
insertMessage.run(uuid(), 'user-1', 'user-2', 'Re: Welcome!', 'Thanks Sarah! Glad to have you here.', 1, now - day * 9)
insertMessage.run(uuid(), 'user-4', 'user-3', 'Party', 'Are you coming to the party this weekend?', 0, now - day * 2)

// ===== GROUPS =====
const groupId1 = uuid()
const groupId2 = uuid()
const groupId3 = uuid()
const insertGroup = sqlite.prepare('INSERT INTO "group" (id, name, description, creator_id, created_at) VALUES (?, ?, ?, ?, ?)')
insertGroup.run(groupId1, 'Humans Against AI', 'A group for humans who want to keep the internet human.', 'user-1', now - day * 20)
insertGroup.run(groupId2, 'Book Club', 'We read books. Because we are human and can read.', 'user-4', now - day * 15)
insertGroup.run(groupId3, 'Coffee Lovers', 'For those who appreciate a good cup of coffee.', 'user-6', now - day * 10)

const insertMembership = sqlite.prepare('INSERT INTO group_membership (id, group_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)')
// Group 1 members
insertMembership.run(uuid(), groupId1, 'user-1', 'admin', now - day * 20)
insertMembership.run(uuid(), groupId1, 'user-2', 'member', now - day * 18)
insertMembership.run(uuid(), groupId1, 'user-3', 'member', now - day * 17)
insertMembership.run(uuid(), groupId1, 'user-5', 'member', now - day * 15)
// Group 2 members
insertMembership.run(uuid(), groupId2, 'user-4', 'admin', now - day * 15)
insertMembership.run(uuid(), groupId2, 'user-1', 'member', now - day * 14)
insertMembership.run(uuid(), groupId2, 'user-6', 'member', now - day * 12)
// Group 3 members
insertMembership.run(uuid(), groupId3, 'user-6', 'admin', now - day * 10)
insertMembership.run(uuid(), groupId3, 'user-7', 'member', now - day * 9)
insertMembership.run(uuid(), groupId3, 'user-8', 'member', now - day * 8)

// Group wall posts
const insertGroupWallPost = sqlite.prepare('INSERT INTO group_wall_post (id, group_id, author_id, content, created_at) VALUES (?, ?, ?, ?, ?)')
insertGroupWallPost.run(uuid(), groupId1, 'user-1', 'Welcome to Humans Against AI! Remember: we are all human here.', now - day * 19)
insertGroupWallPost.run(uuid(), groupId1, 'user-2', 'I can confirm I am definitely human.', now - day * 17)
insertGroupWallPost.run(uuid(), groupId2, 'user-4', 'This month we are reading "1984" by George Orwell.', now - day * 10)

// ===== EVENTS =====
const eventId1 = uuid()
const eventId2 = uuid()
const eventId3 = uuid()
const insertEvent = sqlite.prepare('INSERT INTO event (id, name, description, location, start_time, end_time, creator_id, group_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
insertEvent.run(eventId1, 'Human Meetup 2026', 'Meet other verified humans in person!', 'Central Park, NYC', now + day * 30, now + day * 30 + hour * 4, 'user-1', null, now - day * 5)
insertEvent.run(eventId2, 'Book Club Meeting', 'Discussing "1984"', 'Local Library', now + day * 7, now + day * 7 + hour * 2, 'user-4', groupId2, now - day * 3)
insertEvent.run(eventId3, 'Coffee Tasting', 'Try coffees from around the world', 'Downtown Cafe', now + day * 14, now + day * 14 + hour * 3, 'user-6', groupId3, now - day * 1)

const insertRsvp = sqlite.prepare('INSERT INTO event_rsvp (id, event_id, user_id, status) VALUES (?, ?, ?, ?)')
insertRsvp.run(uuid(), eventId1, 'user-1', 'attending')
insertRsvp.run(uuid(), eventId1, 'user-2', 'attending')
insertRsvp.run(uuid(), eventId1, 'user-3', 'maybe')
insertRsvp.run(uuid(), eventId1, 'user-4', 'declined')
insertRsvp.run(uuid(), eventId2, 'user-4', 'attending')
insertRsvp.run(uuid(), eventId2, 'user-1', 'attending')
insertRsvp.run(uuid(), eventId2, 'user-6', 'maybe')
insertRsvp.run(uuid(), eventId3, 'user-6', 'attending')
insertRsvp.run(uuid(), eventId3, 'user-7', 'attending')

// ===== FEED ITEMS =====
const insertFeedItem = sqlite.prepare('INSERT INTO feed_item (id, user_id, type, reference_id, created_at) VALUES (?, ?, ?, ?, ?)')
for (const [userId, content, ts] of statuses) {
  insertFeedItem.run(uuid(), userId, 'status_update', null, ts as number)
}
for (const [a, b] of friendPairs.slice(0, 5)) {
  insertFeedItem.run(uuid(), a, 'friend_accepted', null, now - day * 20)
}
insertFeedItem.run(uuid(), 'user-1', 'group_created', groupId1, now - day * 20)
insertFeedItem.run(uuid(), 'user-1', 'event_created', eventId1, now - day * 5)

// ===== NOTIFICATIONS =====
const insertNotification = sqlite.prepare('INSERT INTO notification (id, user_id, type, reference_id, reference_type, from_user_id, "read", created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
insertNotification.run(uuid(), 'user-1', 'poke', null, null, 'user-2', 0, now - hour * 1)
insertNotification.run(uuid(), 'user-1', 'poke', null, null, 'user-5', 0, now - hour * 3)
insertNotification.run(uuid(), 'user-1', 'friend_request', null, null, 'user-6', 0, now - hour * 2)
insertNotification.run(uuid(), 'user-1', 'wall_post', null, null, 'user-3', 1, now - day * 10)

console.log('✅ Seed data inserted successfully!')
console.log(`   ${users.length} users`)
console.log(`   ${friendPairs.length} friendships + 1 pending`)
console.log(`   ${statuses.length} status updates`)
console.log(`   ${wallPosts.length} wall posts`)
console.log('   2 pokes')
console.log('   4 messages')
console.log('   3 groups with members and wall posts')
console.log('   3 events with RSVPs')
console.log('   Feed items and notifications')
console.log('')
console.log('Note: To log in as a seed user, register with the same email')
console.log('(e.g., mark@humanbook.com) through the registration form.')

sqlite.close()
