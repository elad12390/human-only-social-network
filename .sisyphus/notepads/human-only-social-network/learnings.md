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

## 2026-02-11 Task 4: Facebook 2007 Layout Shell Complete

### Files Created
- `components/Navigator.tsx` - Top blue navigation bar with main links (home, profile, friends, inbox) and secondary links (settings, logout)
- `components/Sidebar.tsx` - Left sidebar with logo, login form (#squicklogin), and search form (#qsearch)
- `components/Footer.tsx` - Page footer with copyright and footer links (About, Terms, Privacy, Help)

### Files Modified
- `app/layout.tsx` - Updated with full Facebook 2007 HTML structure:
  - `#book` container (799px centered)
  - `#sidebar` (150px float left) with Sidebar component
  - `#widebar` (649px float left) with Navigator and content area
  - `#page_body` → `#content_shadow` → `#content` nesting for proper styling
  - Footer component at bottom
  - Clearfix div for float containment

### Key Implementation Details
1. **Component Structure**
   - All components are Server Components (no 'use client')
   - Navigator: Static links with placeholder logout/settings
   - Sidebar: Static login form with email/password inputs, search form
   - Footer: Static copyright and footer links

2. **HTML Structure Matches Archived Facebook 2007**
   - Exact div IDs and class names from Wayback Machine source
   - Float-based layout: sidebar 150px + widebar 649px = 799px total
   - Proper nesting for content shadow effect
   - Clearfix pattern for float containment

3. **CSS Integration**
   - All 8 CSS files imported in layout.tsx
   - No new CSS files created (all styles pre-existing from Task 1)
   - Styles automatically apply to component structure

### Verification Results
✓ All 3 components created with proper TypeScript types
✓ app/layout.tsx updated with exact HTML structure
✓ npm run build succeeds with no errors
✓ No TypeScript diagnostics (lsp_diagnostics clean)
✓ Build output shows static page generation working
✓ Commit created: "feat: implement Facebook 2007 layout shell with header, sidebar, footer"

### Next Steps
- Task 5: Add authentication UI (login/signup forms with Better Auth integration)
- Task 6: Create home feed page with status updates
- Task 7: Build profile pages

### Design Notes
- Layout uses authentic 2007 Facebook styling with float-based layout
- No flexbox or CSS grid (2007 authentic)
- Blue navigation bar (#3b5998) with white text
- Gray sidebar (#f7f7f7) with login form
- Content area with borders and shadow effect
- All interactive elements ready for auth integration in next tasks

## 2026-02-11 Task 5: Registration Page with Human Verification Complete

### Files Created
- `components/RegistrationForm.tsx` - Client component with form validation and Better Auth integration
- `styles/welcome.css` - Facebook 2007 welcome/registration page layout styles

### Files Modified
- `app/page.tsx` - Updated to render RegistrationForm component
- `app/layout.tsx` - Added import for welcome.css
- `lib/auth-client.ts` - Fixed exports to properly reference authClient methods

### Key Implementation Details

1. **RegistrationForm Component**
   - Client component ('use client') with form state management
   - Fields: First Name, Last Name, Email, Password, Confirm Password
   - Checkboxes: "I am a human being" and "I will not post AI-generated content"
   - Client-side validation: all fields required, passwords must match, both checkboxes required
   - Uses `authClient.signUp.email()` method from Better Auth
   - On success: redirects to `/home.php`
   - On error: displays error in `#error` div with red border and pink background
   - Loading state disables form during submission

2. **Welcome Page Layout (welcome.css)**
   - Two-column layout: left column (300px) for welcome message, right column (300px) for form
   - Float-based layout matching 2007 Facebook style
   - Form container: light gray background (#f7f7f7) with border
   - Checkbox rows with proper spacing and alignment
   - All inputs use `.inputtext` class, buttons use `.inputsubmit` class

3. **Better Auth Client Integration**
   - Fixed auth-client.ts exports to properly reference authClient methods
   - signUp method accessed via `authClient.signUp.email()`
   - Takes object with: email, password, name (full name)
   - Returns result object with error property if signup fails

### Key Learnings

1. Better Auth client methods are accessed as properties on the authClient object, not direct exports
   - Correct: `authClient.signUp.email({ email, password, name })`
   - Incorrect: `signUp({ email, password, name })`

2. Email/password signup uses `.email()` method on signUp object
   - This is the emailAndPassword plugin method

3. Form validation should be comprehensive:
   - All fields required (empty string check)
   - Password confirmation must match
   - Checkboxes must be explicitly checked
   - Validation errors shown in error box before API call

4. Client component state management for forms:
   - Use useState for form data object
   - Use separate error and loading states
   - Disable form inputs during submission to prevent double-submit

5. CSS layout for welcome page:
   - Float-based two-column layout (no flexbox for 2007 authenticity)
   - Proper clearfix for float containment
   - Form styling matches existing form.css classes

### Verification Results
✓ npm run build: Succeeds with no TypeScript errors
✓ All form fields render correctly
✓ Error box styling matches Facebook 2007 theme
✓ Commit created: "feat: add registration page with human verification checkboxes"
✓ No TypeScript diagnostics

### Next Steps
- Task 6: Create login page and authentication flow
- Task 7: Build home feed page with status updates
- Task 8: Create user profile pages

## 2026-02-11 Task 6: Sidebar Login Form Complete

### Files Created
- `components/SidebarLoginForm.tsx` - Client component with login form and Better Auth integration
- `app/home.php/page.tsx` - Placeholder home page for logged-in users

### Files Modified
- `components/Sidebar.tsx` - Made client component, added auth-aware rendering

### Key Implementation Details

1. **SidebarLoginForm Component**
   - Client component ('use client') with form state management
   - Fields: email, password inputs with proper styling
   - "Remember me" checkbox (stored in state, not yet persisted)
   - Uses `signIn.email({ email, password })` from Better Auth
   - Error display with red border and pink background (#fdd)
   - Loading state disables form during submission
   - On success: redirects to `/home.php`
   - On error: displays error message from Better Auth

2. **Sidebar Component Updates**
   - Made client component to use `useSession()` hook
   - Conditional rendering:
     - When logged out: shows SidebarLoginForm + search form
     - When logged in: shows navigation links (News Feed, Messages, Events, Photos, Groups) + search form
   - Navigation links point to placeholder pages (messages.php, events.php, etc.)

3. **Home Page Placeholder**
   - Simple page at `/home.php` with welcome message
   - Will be fully built in Task 10 (news feed)

### Key Learnings

1. **Better Auth Client Methods**
   - signIn is accessed as `signIn.email()` not `signIn()`
   - Returns object with `error` property if login fails
   - Error object has `message` property for user-facing error text

2. **useSession Hook Behavior**
   - Returns `{ data: session }` where session is null when logged out
   - Automatically refetches on mount and after auth state changes
   - Safe to use in client components for conditional rendering

3. **Form Error Display**
   - Inline error messages work better than separate error boxes for sidebar
   - Used inline styling to match 2007 Facebook error styling
   - Error clears on new submission attempt

4. **Client Component in Layout**
   - Sidebar must be client component to use useSession hook
   - This is acceptable since Sidebar is primarily UI/interaction
   - Layout itself remains server component

### Verification Results
✓ npm run build: Succeeds with no TypeScript errors
✓ npx tsc --noEmit: No diagnostics
✓ All 5 files created/modified correctly
✓ Commit created: "feat: add sidebar login form matching 2007 Facebook layout"
✓ Routes generated: / (static), /home.php (static), /api/auth/[...all] (dynamic)

### Next Steps
- Task 7: Create profile pages
- Task 8: Build friend request system
- Task 9: Implement wall posts and comments
- Task 10: Build news feed with status updates

## 2026-02-11 Task 7: Profile Page with Wall Posts Complete

### Files Created
- `styles/profile.css` - Profile page layout with float-based design
- `lib/actions/wall.ts` - Server actions for wall post creation and retrieval
- `components/WallPostForm.tsx` - Client component for wall post form
- `app/profile.php/page.tsx` - Profile page server component with tabs
- `__tests__/wall.test.ts` - Wall post functionality tests

### Files Modified
- `app/layout.tsx` - Added import for profile.css

### Key Implementation Details

1. **Profile Page Structure**
   - Server component at `/profile.php?id=USER_ID`
   - Reads user ID from searchParams, defaults to logged-in user
   - Displays profile photo (placeholder if none), name, member since date, bio
   - Shows "Edit Profile" link only on own profile
   - Tabbed interface with Wall (active), Info, Photos, Friends tabs

2. **Wall Post Functionality**
   - `createWallPost(authorId, profileOwnerId, content)` validates and creates posts
   - Max 5000 character limit enforced
   - Empty content rejected
   - Creates both wall_post and feed_item records
   - `getWallPosts(profileOwnerId)` returns posts ordered by createdAt DESC with author info

3. **WallPostForm Component**
   - Client component with textarea input
   - Character counter (max 5000)
   - Error display for validation failures
   - Loading state during submission
   - Calls server action on form submit

4. **CSS Styling**
   - Float-based layout (no flexbox/grid for 2007 authenticity)
   - Profile photo: 200x200px with border
   - Wall posts: simple text display with author name and timestamp
   - Form styling matches existing form.css classes
   - Clearfix pattern for float containment

### Key Learnings

1. **Database Queries in Next.js**
   - Use `db.select().from(schema.table).where()` pattern instead of `db.query.table.findFirst()`
   - The query API requires proper schema typing that may not be available in all contexts
   - Direct select/where pattern is more reliable for server components

2. **Server Actions with Database**
   - Server actions can directly import and use db instance
   - Validation should happen in server action before DB insert
   - Return success/error objects for client-side handling
   - Feed items should be created alongside content items for activity tracking

3. **Profile Page Architecture**
   - Server component fetches all data (user, profile, wall posts)
   - WallPostForm is client component for interactivity
   - Tabs are static links (no client-side tab switching in 2007 style)
   - Own profile check uses session comparison

4. **Testing Wall Posts**
   - In-memory SQLite works well for testing
   - Test database setup requires manual table creation (not using Drizzle migrations)
   - Foreign key constraints must be explicitly enabled
   - Tests verify DB operations directly without server actions

### Verification Results
✓ All 16 tests passing (4 test files)
✓ npm run build succeeds with no TypeScript errors
✓ npx tsc --noEmit: No diagnostics
✓ Commit created: "feat: add profile page with wall posts and tabbed layout"
✓ Routes generated: /profile.php (dynamic), /home.php (static), / (static)

### Next Steps
- Task 8: Build friend request system
- Task 9: Implement wall post comments (if needed for 2007 feature set)
- Task 10: Create news feed with status updates
