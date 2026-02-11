# Learnings

## 2026-02-11 Initialization
- Repo is completely clean: only .git/ and .sisyphus/ exist
- No commits yet on master branch
- All 19 tasks pending (0-18)
- Task 0 is the foundation — must complete before anything else

## 2026-02-11 Task 0: Project Scaffolding Complete

### Files Created
- `vitest.config.ts` - Uses Vite's defineConfig (not vitest/config), jsdom environment
- `drizzle.config.ts` - SQLite dialect, points to local.db
- `lib/db.ts` - Drizzle client using better-sqlite3 for dev
- `.env.local` - Placeholder env vars for Turso, auth, blob storage
- `__tests__/setup.test.ts` - Basic passing test

### Files Modified
- `app/page.tsx` - Simplified to just `<main><h1>Human-Only Social Network</h1></main>`
- `app/layout.tsx` - Removed Geist font classes, updated metadata
- `tsconfig.json` - Added strict: true (was already set), excluded vitest.config.ts and drizzle.config.ts from build

### Dependencies Installed
- vitest, vite, jsdom (testing)
- drizzle-kit, drizzle-orm, better-sqlite3, @types/better-sqlite3 (database)
- whatwg-url (jsdom dependency)

### Key Learnings
1. vitest.config.ts must use `import { defineConfig } from 'vite'` not 'vitest/config'
2. Config files (vitest.config.ts, drizzle.config.ts) must be excluded from tsconfig.json to prevent Next.js build errors
3. better-sqlite3 requires @types/better-sqlite3 for strict TypeScript
4. No Tailwind directives were present in globals.css (clean slate)
5. npx cache can be stale — use ./node_modules/.bin/ directly when needed

### Verification Results
✓ npx vitest run: 1 test passing
✓ npm run build: Succeeds with static page generation
✓ No Tailwind references in codebase
✓ tsconfig.json has strict: true

### Next Steps
- Task 1: Create CSS styles (Facebook 2007 theme)
- Task 2: Create database schema
- Task 3: Configure Better Auth

## 2026-02-11 Task 1: Facebook 2007 CSS System Complete

### Files Created
- `styles/base.css` - Core typography, resets, global styles (Lucida Grande 11px, white bg)
- `styles/forms.css` - Input fields, buttons, form layouts with 2007 styling
- `styles/navigator.css` - Top navigation bar (#3b5998 blue, white text)
- `styles/sidebar.css` - Left sidebar with login box and quick search
- `styles/footer.css` - Page footer with copyright and links
- `styles/tabs.css` - Tab navigation with active states
- `styles/errors.css` - Error messages, status alerts, explanation notes
- `styles/content.css` - Main content area, borders, headers, messages

### Files Modified
- `app/layout.tsx` - Removed Geist font imports, added 8 CSS imports from @/styles/
- `app/globals.css` - Emptied (all styles now in styles/ directory)

### Key Learnings
1. CSS organized per-feature, not monolithic - enables easy feature-specific styling later
2. All values from archived Facebook 2007 common.css (Wayback Machine)
3. No modern CSS (flexbox, grid, CSS variables, calc) - pure 2007 CSS
4. Font stack: "lucida grande", tahoma, verdana, arial, sans-serif at 11px
5. Primary color: #3b5998 (Facebook blue), secondary: #f7f7f7 (light gray)
6. No border-radius, box-shadow, transitions - authentic 2007 styling
7. Float-based layouts (float: left/right) for sidebar and content areas
8. Clearfix pattern used for float containment

### Verification Results
✓ All 8 CSS files created in styles/ directory
✓ app/layout.tsx imports all 8 CSS files correctly
✓ app/globals.css emptied
✓ npm run build succeeds with no errors
✓ Page renders with white background and correct font (Lucida Grande/Tahoma 11px)
✓ No TypeScript errors

### Next Steps
- Task 2: Create database schema (users, posts, comments, etc.)
- Task 3: Configure Better Auth for authentication
- Task 4+: Build feature-specific CSS files (profile.css, feed.css, etc.)

## Schema Creation (lib/schema.ts)

### Completed
- Created comprehensive Drizzle ORM SQLite schema with 24 tables
- All tables properly typed with drizzle-orm/sqlite-core
- Foreign key relationships established correctly
- Default functions for UUIDs and timestamps working
- Build verification passed with no TypeScript errors

### Schema Organization
Tables grouped into logical domains:
- **Auth**: user, session, account, verification (Better Auth compatible)
- **Profile**: profile (1:1 with user)
- **Social**: friendship, poke
- **Content**: statusUpdate, wallPost, photoAlbum, photo, photoTag
- **Messaging**: message
- **Community**: group, groupMembership, groupWallPost, event, eventRsvp
- **Notifications**: notification
- **Feed**: feedItem

### Key Design Decisions
- UUID primary keys with crypto.randomUUID() defaults
- Timestamp fields use integer mode with Date defaults
- Boolean fields use integer mode (SQLite compatibility)
- Enum fields use text with enum array validation
- Foreign key references properly typed
- Unique constraints on email and profile userId

## 2026-02-11 Task 2: Database Schema Tests Complete

### Files Created
- `__tests__/schema.test.ts` - Comprehensive schema validation tests

### Test Coverage
- Table creation without errors
- User insert and retrieval
- Unique email constraint enforcement
- Profile creation linked to user
- Friendship creation between users

### Key Learnings
1. In-memory SQLite databases (:memory:) work perfectly for testing
2. Foreign key constraints must be explicitly enabled with `pragma('foreign_keys = ON')`
3. WAL mode pragma is set but not required for in-memory databases
4. Drizzle ORM insert/select operations work seamlessly with test databases
5. Test isolation: each test gets a fresh in-memory database via createTestDb()

### Verification Results
✓ All 5 schema tests passing
✓ Total test suite: 6 tests passing (setup.test.ts + schema.test.ts)
✓ Commit created: "feat: define complete database schema for all social features"
✓ No TypeScript errors in test file

### Next Steps
- Task 3: Configure Better Auth for authentication
- Task 4: Build API routes for user management

## 2026-02-11 Task 3: Better Auth Configuration Complete

### Files Created
- `lib/auth.ts` - Server-side Better Auth configuration with Drizzle adapter
- `lib/auth-client.ts` - Client-side auth utilities (React hooks)
- `app/api/auth/[...all]/route.ts` - Next.js API route handler
- `__tests__/auth.test.ts` - Auth configuration and validation tests

### Key Implementation Details
1. **Server Config (lib/auth.ts)**
   - Uses `betterAuth()` with `drizzleAdapter(db, { provider: 'sqlite' })`
   - Enables `emailAndPassword: { enabled: true }`
   - Secret from env with fallback for testing: `process.env.BETTER_AUTH_SECRET || 'test-secret-do-not-use-in-production'`
   - Exports `auth` instance for use in API routes

2. **Client Config (lib/auth-client.ts)**
   - Uses `createAuthClient` from 'better-auth/react'
   - baseURL from env: `process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 'http://localhost:3000'`
   - Exports destructured methods: `signIn`, `signUp`, `signOut`, `useSession`, `getSession`
   - Marked with 'use client' directive

3. **API Route Handler (app/api/auth/[...all]/route.ts)**
   - Imports auth from `@/lib/auth`
   - Uses `toNextJsHandler(auth)` from 'better-auth/next-js'
   - Exports GET and POST handlers

### Test Coverage
- Auth instance exports correctly
- Auth handler can be created without errors
- Email format validation (regex pattern)
- Password requirements validation (minimum 8 characters)
- emailAndPassword plugin is enabled

### Key Learnings
1. Better Auth requires `BETTER_AUTH_SECRET` env var - provide fallback for testing
2. Drizzle adapter needs `provider: 'sqlite'` and schema mapping
3. Client-side auth uses `createAuthClient` from 'better-auth/react' (not 'better-auth/client')
4. Next.js API routes use `toNextJsHandler()` to mount auth handler
5. Test environment doesn't inherit .env.local - use fallback values in code
6. Build warning about "Base URL could not be determined" is expected - will be set in production

### Verification Results
✓ npm run build: Succeeds (warning about base URL is expected)
✓ npx vitest run: All 12 tests passing (3 test files)
✓ No TypeScript errors
✓ Commit created: "feat: configure Better Auth with Drizzle adapter and email/password"

### Next Steps
- Task 4: Build authentication UI components (login/signup forms)
- Task 5: Create user profile management endpoints
