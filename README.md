# HumanBook - A Facebook 2007 Clone

A pixel-faithful recreation of Facebook circa 2007, built entirely with modern tech (Next.js 16, React 19, Drizzle ORM) but styled and behaving exactly like the original. Full page reloads, `.php`-style URLs, 799px fixed-width layout, 11px Lucida Grande — the works.

The twist: this is a **human-only** social network. You must confirm you're a real human and pledge not to post AI-generated content.

## Live Demo

**[https://human-only-social-network.vercel.app](https://human-only-social-network.vercel.app)**

## Features

All 10 core Facebook 2007 features, fully functional:

- **Registration & Auth** - Email/password signup with human verification checkboxes. Session-based auth via Better Auth.
- **Profile & Wall** - Personal profile with Wall, Info, Photos, and Friends tabs. Wall posts from friends.
- **Status Updates** - "What's on your mind?" with character counter (255 max). Shows as "[Name] is [status]".
- **Friends** - Send/accept/decline friend requests. Unfriend. Friend count on profile. Pending requests page.
- **News Feed** - Aggregated feed of friend activity (status updates, wall posts, new friendships). Paginated.
- **Poke** - Poke friends from their profile. Poke-back from home page notifications.
- **Photos & Albums** - Create albums, upload photos via Vercel Blob storage. Photo grid view.
- **Messages** - Private inbox with compose, read, reply. Sent messages tab. Unread indicators.
- **Groups** - Create groups, join/leave, group wall posts. Member list with roles.
- **Events** - Create events with date/time/location. RSVP as Attending/Maybe/Declined. Guest list.
- **Search** - Find users by name. Sidebar quick-search and dedicated results page.

## Screenshots

| Landing Page | Home Feed | Profile |
|---|---|---|
| Registration form + sidebar login | News feed with status updates | Wall, Info, Photos, Friends tabs |

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Server Components + Client Components |
| Styling | Hand-written CSS (no Tailwind) matching 2007 Facebook pixel-for-pixel |
| Database | SQLite via `better-sqlite3` (dev) / Turso LibSQL (prod) |
| ORM | Drizzle ORM |
| Auth | Better Auth (email/password, session cookies) |
| File Storage | Vercel Blob |
| Testing | Playwright (E2E, browser-based, zero mocks) |

## Architecture

This intentionally mimics 2007-era web behavior:

- **Full page reloads** after every mutation (`window.location.reload()`) — no SPA state management
- **`.php`-style URL routes** — `/home.php`, `/profile.php?id=123`, `/groups.php`, `/event.php?id=456`
- **Server-rendered pages** — Next.js Server Components fetch data, Client Components handle forms
- **Server Actions** for mutations — no API routes, direct server function calls
- **799px fixed-width layout** centered on page, just like the original
- **11px Lucida Grande** typography throughout

### Database Schema

20 tables covering the full social network:

`user`, `session`, `account`, `verification`, `profile`, `friendship`, `poke`, `statusUpdate`, `wallPost`, `photoAlbum`, `photo`, `photoTag`, `message`, `group`, `groupMembership`, `groupWallPost`, `event`, `eventRsvp`, `notification`, `feedItem`

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
# Install dependencies
npm install

# Seed the database with test data (10 users, groups, events, posts)
npm run seed

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll see the registration page.

### Seed Data

Running `npm run seed` creates:

- **10 users** (password: `password123` for all)
  - Alice Human (`alice@humanbook.com`)
  - Bob Person (`bob@humanbook.com`)
  - Charlie Real (`charlie@humanbook.com`)
  - Diana Authentic (`diana@humanbook.com`)
  - And 6 more...
- **3 groups** — Coffee Lovers, Book Club, Humans Against AI
- **3 events** — with various RSVP states
- **Wall posts, status updates, friendships, pokes, messages** — pre-populated

### E2E Tests

Tests use Playwright against the real running app (zero mocks):

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with Playwright UI (interactive)
npm run test:e2e:ui
```

Tests cover: auth, profile, status, friends, feed, poke, messages, groups, events, search, photos, and visual QA (verifying 2007 CSS).

## Project Structure

```
app/
  page.tsx              # Landing page (registration form)
  home.php/page.tsx     # News feed (authenticated)
  profile.php/page.tsx  # User profile with tabs
  groups.php/page.tsx   # Groups list
  group.php/page.tsx    # Single group
  events.php/page.tsx   # Events list
  event.php/page.tsx    # Single event
  photos.php/page.tsx   # Photo albums
  album.php/page.tsx    # Single album
  search.php/page.tsx   # Search results
  reqs.php/page.tsx     # Friend requests
  inbox/
    page.tsx            # Messages inbox
    compose/page.tsx    # Compose message
    read/page.tsx       # Read message

components/
  RegistrationForm.tsx  # Sign-up form (client)
  SidebarLoginForm.tsx  # Login form (client)
  Sidebar.tsx           # Left sidebar with nav
  Navigator.tsx         # Top nav bar (server)
  StatusUpdateForm.tsx  # Status update input
  WallPostForm.tsx      # Wall post textarea
  FriendButton.tsx      # Add/remove friend
  PokeButton.tsx        # Poke user
  ...and more

lib/
  auth.ts               # Better Auth server config
  auth-client.ts        # Better Auth client exports
  db.ts                 # Drizzle + SQLite connection
  schema.ts             # All 20 database tables
  actions/              # Server actions for each feature

styles/
  base.css              # Body, #book, typography
  navigator.css         # Top nav styles
  sidebar.css           # Sidebar styles
  profile.css           # Profile page styles
  ...per-feature CSS files

e2e/
  helpers/test-utils.ts # Shared Playwright helpers
  auth.spec.ts          # Registration & login tests
  profile.spec.ts       # Profile & wall tests
  ...11 test files total
```

## Why?

Because the 2007 internet was a simpler, more human place. No algorithmic feeds, no AI-generated slop, no engagement-optimized dark patterns. Just people connecting with people.

This project is a love letter to that era — built with today's tools, styled with yesterday's pixels.

## License

MIT
