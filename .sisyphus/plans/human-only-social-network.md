# Human-Only Social Network (Facebook 2007 Clone)

## Context

### Original Request
Build a "human-only" social network that looks EXACTLY like Facebook from 2007. Using Next.js. Verified humans only, no AI-generated content. All 10 core features: Registration/Login, Profile/Wall, News Feed, Friends, Status Updates, Photos, Messages, Poke, Groups, Events.

### Interview Summary
**Key Discussions**:
- **Tech stack**: Next.js App Router, Drizzle ORM + Turso (libSQL), Better Auth, Vercel Blob for images, deploy to Vercel
- **UI**: Pixel-perfect Facebook 2007 recreation using ACTUAL archived CSS from Wayback Machine (colors, fonts, layout dimensions, button styles, form inputs all confirmed from original `common.css`)
- **Human-only concept**: Honor system for V1 ("I am human" checkbox at registration). Real verification and AI content detection deferred to later versions.
- **Profile fields**: Minimal for V1 (name, bio, profile photo). Full 2007 field set (education, work, interests, etc.) deferred.
- **Photo tagging**: Simple dropdown (tag users in photo), NOT coordinate-based face clicking.
- **URL scheme**: Authentic `profile.php?id=123` style.
- **No modern UX**: No infinite scroll, no skeleton loaders, no toasts, no animations, no rounded corners. Full page reloads for actions.
- **Test strategy**: TDD with vitest for business logic. Manual browser verification for visual/CSS.

### Metis Review
**Identified Gaps (addressed)**:
- SQLite doesn't work on Vercel → Resolved: Use Turso (libSQL) for production, better-sqlite3 for local dev
- /public/uploads doesn't persist on Vercel → Resolved: Use Vercel Blob for image storage
- Notification system needed across features → Addressed: notifications table in schema, rendered as counts in nav bar
- Search needed to find users to add as friends → Addressed: simple user search by name
- Content length limits, XSS prevention → Addressed: input sanitization, character limits defined per field

---

## Work Objectives

### Core Objective
Build a fully functional social network with Facebook 2007's exact visual design, where users must declare they are human and agree not to post AI-generated content.

### Concrete Deliverables
- Next.js application with 10 social features
- Pixel-perfect 2007 Facebook UI (vanilla CSS organized per-feature from archived source)
- Turso database with complete social graph schema
- Better Auth registration/login with "I am human" declaration
- Deployable to Vercel

### Definition of Done
- [ ] All 10 features functional and visually matching 2007 Facebook
- [ ] TDD: All business logic has passing tests
- [ ] `npm run build` succeeds with zero errors
- [ ] App runs locally with `npm run dev`
- [ ] Database schema covers all features

### Must Have
- Fixed 799px width layout matching original Facebook CSS
- `#3B5998` blue color scheme, 11px Lucida Grande font stack
- "John is..." forced third-person status format
- Wall posts on profile pages
- Chronological news feed
- Friend request / accept / unfriend flow
- Photo albums with simple user tagging
- Inbox-style messages (subject + body, like email)
- Poke with "poke back" mechanism
- Groups with join/leave and group wall
- Events with RSVP (attending/maybe/declined)
- "I am human" checkbox on registration

### Must NOT Have (Guardrails)
- NO Tailwind, styled-components, or ANY CSS framework — vanilla CSS only
- NO rounded corners, CSS gradients, box-shadows, or CSS animations/transitions
- NO infinite scroll, optimistic updates, skeleton loaders, toasts, or modern UX patterns
- NO responsive design — fixed 799px width, period
- NO Like button (came 2009), no Chat (came 2008), no Timeline (came 2011)
- NO over-architecture — no service layers, no repository pattern, no DI containers
- NO email sending infrastructure — users register and are immediately active
- NO TypeScript `any` — strict mode from day one
- NO client-side state management libraries (no Redux, Zustand, etc.)

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: NO (greenfield project)
- **User wants tests**: TDD
- **Framework**: vitest

### TDD Approach
- **Business logic**: TDD (RED-GREEN-REFACTOR) — database operations, auth flows, friend logic, feed generation, etc.
- **API routes / Server Actions**: TDD — test request/response shapes
- **UI/CSS**: Manual browser verification — TDD doesn't apply to visual layout
- **Integration**: Manual browser walkthrough per feature

### Test Setup (Task 0 includes this)
- Install vitest + @testing-library/react
- Configure vitest.config.ts
- Create test database (in-memory SQLite via better-sqlite3 for tests)
- Example test to verify setup

---

## Task Flow

```
Task 0 (Project Setup) 
  → Task 1 (Global CSS System)
  → Task 2 (Database Schema - ALL tables)
  → Task 3 (Better Auth Setup)
  → Task 4 (Layout Shell)
    → Task 5 (Registration Page)
    → Task 6 (Login Page)  
      → Task 7 (Profile Page & Wall)
      → Task 8 (Status Updates)
        → Task 9 (Friend System)
          → Task 10 (News Feed)
          → Task 11 (Poke)
      → Task 12 (Photos & Albums)
      → Task 13 (Messages/Inbox)
      → Task 14 (Groups)
      → Task 15 (Events)
      → Task 16 (Notifications & Nav Counts)
      → Task 17 (Search)
      → Task 18 (Seed Data & Final Polish)
```

## Parallelization

| Group | Tasks | Reason |
|-------|-------|--------|
| A | 1, 2 | CSS and schema are independent |
| B | 5, 6 | Registration and login are independent pages |
| C | 12, 13, 14, 15 | Photos, Messages, Groups, Events are independent features (all depend on auth + profile) |

| Task | Depends On | Reason |
|------|------------|--------|
| 3 | 2 | Auth needs schema tables |
| 4 | 1 | Layout needs CSS system |
| 5, 6 | 3, 4 | Auth pages need auth setup + layout |
| 7 | 5, 6 | Profile needs auth |
| 8 | 7 | Status shows on profile |
| 9 | 7 | Friends link profiles |
| 10 | 8, 9 | Feed aggregates friend activity |
| 11 | 9 | Poke requires friend awareness |
| 12-15 | 7 | All features need profile/auth |
| 16 | 9, 11, 12, 13 | Notifications aggregate across features |
| 17 | 7 | Search finds users |
| 18 | ALL | Polish after everything works |

---

## TODOs

- [x] 0. Project Scaffolding & Test Infrastructure

  **What to do**:
  - Remove all existing MCP aggregator code from the repo (keep `.git`, `.sisyphus/`)
  - Run `npx create-next-app@latest . --typescript --app --eslint --no-tailwind --no-src-dir --import-alias "@/*"` (choose NO for Tailwind)
  - Install dependencies: `npm install drizzle-orm @libsql/client better-auth @vercel/blob`
  - Install dev dependencies: `npm install -D drizzle-kit better-sqlite3 @types/better-sqlite3 vitest @testing-library/react @testing-library/jest-dom jsdom`
  - Configure `tsconfig.json` with `strict: true`
  - Configure `vitest.config.ts` for jsdom environment
  - Configure `drizzle.config.ts` for Turso (libSQL) with local SQLite fallback
  - Create `lib/db.ts` — database connection (better-sqlite3 for dev, @libsql/client for production)
  - Create `.env.local` template with `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `BLOB_READ_WRITE_TOKEN`, `BETTER_AUTH_SECRET`
  - Create example test `__tests__/setup.test.ts` that passes
  - Verify: `npx vitest run` → 1 test passes

  **Must NOT do**:
  - Do NOT install Tailwind or any CSS framework
  - Do NOT add any UI component libraries
  - Do NOT create any pages yet (just the default Next.js page is fine)

  **Parallelizable**: NO (foundation for everything)

  **References**:
  - Next.js App Router docs: https://nextjs.org/docs/app
  - Drizzle ORM + libSQL: https://orm.drizzle.team/docs/get-started/turso-new
  - Better Auth installation: https://www.better-auth.com/docs/installation
  - Vercel Blob: https://vercel.com/docs/storage/vercel-blob
  - vitest config: https://vitest.dev/config/

  **Acceptance Criteria**:
  - [ ] `npm run dev` starts Next.js on localhost:3000
  - [ ] `npx vitest run` → 1 test, 0 failures
  - [ ] `npm run build` succeeds
  - [ ] `lib/db.ts` exports a working Drizzle client
  - [ ] `.env.local` exists with required variable names (values can be placeholder)
  - [ ] No Tailwind classes or config anywhere in the project
  - [ ] `tsconfig.json` has `strict: true`

  **Commit**: YES
  - Message: `feat: scaffold Next.js project with Drizzle, Better Auth, and vitest`
  - Files: All scaffolded files

---

- [x] 1. CSS System (Base + Per-Feature Organization)

  **What to do**:
  - Create a CSS file organization with a base file for shared styles and per-feature CSS files:
    ```
    styles/
      base.css          — resets, body, typography, links, clearfix, shared layout (#book, #sidebar, #widebar)
      forms.css         — .inputtext, .inputsubmit, .inputcheckbox, labels, form tables
      navigator.css     — #navigator bar, nav links, dropdowns, notification counts
      sidebar.css       — #sidebar, #sidebar_content, #squicklogin, app list, search
      footer.css        — #pagefooter, copyright, footer links
      tabs.css          — #tabs, .toggle_tabs, .activetab styles
      errors.css        — #error, .status, .explanation_note alert boxes
      content.css       — #content, #content_shadow, .grayheader, .page_title, .standard_message
      profile.css       — profile page specific styles (created in Task 7)
      feed.css          — news feed styles (created in Task 10)
      photos.css        — photo album/gallery styles (created in Task 12)
      messages.css      — inbox/message styles (created in Task 13)
      groups.css        — group page styles (created in Task 14)
      events.css        — event page styles (created in Task 15)
    ```
  - Port the exact CSS values from the archived Facebook `common.css` into the appropriate files:
    - **base.css**: `body { background: #fff; font-family: "lucida grande", tahoma, verdana, arial, sans-serif; font-size: 11px; }`, headings, links (`a { color: #3b5998; }`), `#book { width: 799px; margin: 0 auto; }`, `.clearfix`, `.pipe`, `.column`
    - **forms.css**: `.inputtext { border: 1px solid #bdc7d8; font-size: 11px; padding: 3px; }`, `.inputsubmit { background: #3b5998; color: #fff; border-color: #D9DFEA #0e1f5b #0e1f5b #D9DFEA; }`, labels, `.formtable`, `.formbuttons`
    - **navigator.css**: `#navigator { padding: 9px 0 4px; }`, white links, `#5c75aa` hover, `.main_set`, `.secondary_set`, `.navigator_menu` dropdown
    - **sidebar.css**: `#sidebar { width: 150px; float: left; }`, `#sidebar_content { background: #f7f7f7; }`, `#squicklogin`, `#qsearch`
    - **footer.css**: `#pagefooter { height: 50px; }`, `.copyright { color: #777; }`, `.footer_links`
    - **tabs.css**: `#tabs .activetab a { color: white; background: #3B5998; }`, `.toggle_tabs` with `#f1f1f1` bg, selected `#6d84b4`
    - **errors.css**: `#error { border: 1px solid #dd3c10; background: #ffebe8; }`, `.status { background: #fff9d7; border-color: #e2c822; }`
    - **content.css**: `#content` borders, `#content_shadow`, `.grayheader`, `.page_title`, `.title_header`
  - Import all base CSS files in `app/layout.tsx`:
    ```tsx
    import '@/styles/base.css'
    import '@/styles/forms.css'
    import '@/styles/navigator.css'
    import '@/styles/sidebar.css'
    import '@/styles/footer.css'
    import '@/styles/tabs.css'
    import '@/styles/errors.css'
    import '@/styles/content.css'
    ```
  - Feature-specific CSS files (profile.css, feed.css, etc.) will be created in their respective tasks and imported in those page/component files

  **Must NOT do**:
  - Do NOT use CSS modules (`.module.css`) or CSS-in-JS
  - Do NOT add any modern CSS (flexbox, grid, CSS variables, calc(), clamp(), etc.)
  - Do NOT add rounded corners (`border-radius`), box-shadows, or transitions
  - Do NOT import Tailwind or any framework
  - Do NOT invent new CSS classes — only use classes from the original Facebook CSS or clearly named extensions following the same patterns

  **Parallelizable**: YES (with Task 2)

  **References**:
  - Archived Facebook CSS from Wayback Machine (`common.css.pkg.php`) — the complete source was retrieved and is in the draft at `.sisyphus/drafts/human-only-social-network.md` under "Research Findings: Facebook 2007 Design"
  - The archived HTML structure shows the expected class/ID usage pattern: `#book > #sidebar + #widebar > #navigator + #page_body > #content`

  **Acceptance Criteria**:
  - [ ] `styles/` directory contains: base.css, forms.css, navigator.css, sidebar.css, footer.css, tabs.css, errors.css, content.css
  - [ ] All CSS files imported in `app/layout.tsx`
  - [ ] No Tailwind, no CSS modules, no globals.css from Next.js default
  - [ ] Opening localhost:3000 shows white page with correct font (Lucida Grande/Tahoma at 11px)
  - [ ] All colors match: links are `#3b5998`, body text is `#333`
  - [ ] `npm run build` succeeds

  **Commit**: YES
  - Message: `feat: add Facebook 2007 CSS system organized by feature`
  - Files: `styles/*.css`, `app/layout.tsx`

---

- [x] 2. Database Schema (ALL tables)

  **What to do**:
  - Create `lib/schema.ts` with ALL Drizzle table definitions for the entire app
  - Design schema UPFRONT — all tables defined now, even if features are built later
  - Tables needed:

  **Auth tables (generated by Better Auth CLI, extend with custom fields)**:
  - `user` — id, name, email, emailVerified, image, isHuman (boolean), createdAt, updatedAt
  - `session` — id, userId, token, expiresAt, ipAddress, userAgent
  - `account` — id, userId, providerId, providerAccountId, etc.
  - `verification` — id, identifier, value, expiresAt

  **Profile tables**:
  - `profile` — userId (FK), bio, profilePhotoUrl, coverPhotoUrl

  **Social tables**:
  - `friendship` — id, requesterId (FK user), addresseeId (FK user), status (pending/accepted/declined), createdAt
  - `poke` — id, pokerId (FK user), pokedId (FK user), createdAt, seen (boolean)

  **Content tables**:
  - `status_update` — id, userId (FK), content (text, max 255 chars), createdAt
  - `wall_post` — id, authorId (FK user), profileOwnerId (FK user), content (text), createdAt
  - `photo_album` — id, userId (FK), name, description, createdAt
  - `photo` — id, albumId (FK), userId (FK), blobUrl, caption, createdAt
  - `photo_tag` — id, photoId (FK), taggedUserId (FK), taggedByUserId (FK)

  **Messaging tables**:
  - `message` — id, senderId (FK user), recipientId (FK user), subject, body, read (boolean), createdAt

  **Community tables**:
  - `group` — id, name, description, creatorId (FK user), createdAt
  - `group_membership` — id, groupId (FK), userId (FK), role (member/admin), joinedAt
  - `group_wall_post` — id, groupId (FK), authorId (FK user), content, createdAt
  - `event` — id, name, description, location, startTime, endTime, creatorId (FK user), groupId (FK, nullable), createdAt
  - `event_rsvp` — id, eventId (FK), userId (FK), status (attending/maybe/declined)

  **Notifications table**:
  - `notification` — id, userId (FK), type (friend_request/poke/wall_post/message/photo_tag/group_invite/event_invite), referenceId, referenceType, fromUserId (FK), read (boolean), createdAt

  **Feed table**:
  - `feed_item` — id, userId (FK, the actor), type (status_update/wall_post/new_friendship/new_photo/group_join/event_created), referenceId, createdAt

  - Write TDD tests for schema validation:
    - Test: all tables can be created (push schema to test DB)
    - Test: foreign key relationships are correct
    - Test: required fields enforce NOT NULL

  - Run `npx drizzle-kit push` to push schema to local SQLite

  **Must NOT do**:
  - Do NOT create migration files yet (use push for development)
  - Do NOT add soft-delete columns (keep it simple)
  - Do NOT add full-text search indexes yet
  - Do NOT over-normalize — keep it practical

  **Parallelizable**: YES (with Task 1)

  **References**:
  - Drizzle ORM SQLite column types: https://orm.drizzle.team/docs/column-types/sqlite
  - Better Auth schema requirements: https://www.better-auth.com/docs/concepts/database
  - Better Auth CLI for generating auth tables: `npx @better-auth/cli generate`

  **Acceptance Criteria**:
  - [ ] `lib/schema.ts` exports all table definitions listed above
  - [ ] RED: Tests written for schema validation → FAIL (no schema yet)
  - [ ] GREEN: Schema implemented → `npx vitest run` → PASS
  - [ ] `npx drizzle-kit push` succeeds — all tables created in local SQLite
  - [ ] Foreign keys correctly link tables (verified in tests)
  - [ ] `npm run build` succeeds with no TypeScript errors

  **Commit**: YES
  - Message: `feat: define complete database schema for all social features`
  - Files: `lib/schema.ts`, `drizzle.config.ts`, test files

---

- [x] 3. Better Auth Setup

  **What to do**:
  - Create `lib/auth.ts` — Better Auth configuration with Drizzle adapter
  - Configure email/password authentication (enabled)
  - Add custom `isHuman` field to user table via `additionalFields`
  - Create `app/api/auth/[...all]/route.ts` — API route handler
  - Create `lib/auth-client.ts` — client-side auth utilities
  - Write TDD tests:
    - Test: user can register with email, password, name, isHuman=true
    - Test: user cannot register without isHuman=true
    - Test: user can login with correct credentials
    - Test: user cannot login with wrong password
    - Test: session is created on login
    - Test: session is destroyed on logout

  **Must NOT do**:
  - Do NOT add OAuth providers (no Google/GitHub login — not 2007 authentic)
  - Do NOT add email verification (users register and are immediately active)
  - Do NOT add password reset flow yet

  **Parallelizable**: NO (depends on Task 2 for schema)

  **References**:
  - Better Auth + Drizzle setup: https://www.better-auth.com/docs/adapters/drizzle
  - Better Auth email/password: https://www.better-auth.com/docs/authentication/email-password
  - Better Auth custom fields: https://www.better-auth.com/docs/concepts/users-accounts
  - Better Auth Next.js integration: https://www.better-auth.com/docs/integrations/next

  **Acceptance Criteria**:
  - [ ] RED: Auth tests written → FAIL
  - [ ] GREEN: Auth configured → `npx vitest run` → PASS
  - [ ] POST to `/api/auth/sign-up` creates a user in the database
  - [ ] POST to `/api/auth/sign-in` returns a session
  - [ ] Session cookie is set after login
  - [ ] `isHuman` field is stored in user table

  **Commit**: YES
  - Message: `feat: configure Better Auth with Drizzle adapter and email/password`
  - Files: `lib/auth.ts`, `lib/auth-client.ts`, `app/api/auth/[...all]/route.ts`, test files

---

- [x] 4. Layout Shell (Header, Sidebar, Footer)

  **What to do**:
  - Create `app/layout.tsx` — root layout with the Facebook 2007 HTML structure
  - Structure must match the original archived HTML:
    ```
    <div id="book">
      <div id="sidebar">
        <a class="go_home">facebook</a> (logo area, blue bg #3b5998)
        <div id="sidebar_content">
          (navigation links when logged in, login form when logged out)
        </div>
      </div>
      <div id="widebar">
        <div id="navigator">
          (top blue nav bar: Home | Profile | Friends | Inbox links)
          (right side: logged-in user name, Logout link)
          (notification counts for friend requests, messages, pokes)
        </div>
        <div id="page_body">
          <div id="content_shadow">
            <div id="content">
              {children} ← page content goes here
            </div>
          </div>
        </div>
      </div>
      <div id="pagefooter">
        (copyright + footer links: About, Terms, Privacy, Help)
      </div>
    </div>
    ```
  - Navigator links: `home` | `profile` | `friends` | `inbox` — with notification count badges
  - Sidebar: shows navigation when logged in (News Feed, Messages, Events, Photos, Groups)
  - Sidebar: shows login form when logged out
  - Footer: "HumanBook © 2026" + links

  **Must NOT do**:
  - Do NOT use flexbox or CSS grid for layout — use floats (like original)
  - Do NOT add a responsive meta viewport tag
  - Do NOT add any JavaScript animations or transitions
  - Do NOT add a hamburger menu or mobile navigation

  **Parallelizable**: NO (depends on Task 1 for CSS)

  **References**:
  - Archived HTML structure from Wayback Machine (see draft file for exact DOM)
  - Facebook 2007 CSS classes: `#book`, `#sidebar`, `#widebar`, `#navigator`, `#content`, `#pagefooter`, `.clearfix`
  - Navigator CSS: `#navigator { margin: 0 1px 0 0; padding: 9px 0 4px 0; height: 2em; }` with white links, `#5c75aa` hover bg

  **Acceptance Criteria**:
  - [ ] Opening localhost:3000 shows the 2007 Facebook layout shell
  - [ ] Blue header bar across the top with white navigation links
  - [ ] Left sidebar (150px) with gray background
  - [ ] Content area (649px) with proper borders
  - [ ] Footer at bottom with copyright and links
  - [ ] Layout is exactly 799px wide, centered
  - [ ] When not logged in, sidebar shows a login form
  - [ ] `npm run build` succeeds

  **Commit**: YES
  - Message: `feat: implement Facebook 2007 layout shell with header, sidebar, footer`
  - Files: `app/layout.tsx`, component files

---

- [ ] 5. Registration Page

  **What to do**:
  - Create registration page matching 2007 Facebook signup
  - The logged-out homepage should show the registration form (right side of content area) with the classic "Facebook is a social utility that connects you with the people around you" messaging
  - Registration form fields: First Name, Last Name, Email, Password, Confirm Password, "I am human" checkbox, "I will not post AI-generated content" checkbox
  - On submit: call Better Auth signup endpoint
  - On success: redirect to profile page
  - On error: show error in Facebook 2007 error box style (red border `#dd3c10`, bg `#ffebe8`)
  - Write TDD tests:
    - Test: form submission with valid data creates user
    - Test: passwords must match
    - Test: "I am human" checkbox must be checked
    - Test: email must be valid format
    - Test: duplicate email shows error

  **Must NOT do**:
  - Do NOT add client-side form validation with fancy UX (no real-time validation, no green checkmarks)
  - Do NOT add OAuth signup buttons
  - Do NOT add email verification step
  - Do NOT use a form library — plain HTML form with server action

  **Parallelizable**: YES (with Task 6)

  **References**:
  - Archived Facebook signup page from Wayback Machine: the `#welcome` div with `.right_column` for the signup form and `.welcome_image` for the illustration
  - Better Auth signup: POST to `/api/auth/sign-up` with `{ email, password, name }`
  - Error box CSS: `#error { margin: 0 10px 10px; padding: 10px; border: solid 1px #dd3c10; background: #ffebe8; }`

  **Acceptance Criteria**:
  - [ ] RED: Tests for registration logic → FAIL
  - [ ] GREEN: Registration implemented → PASS
  - [ ] Visiting `/` when logged out shows registration form
  - [ ] Form has all required fields including "I am human" checkbox
  - [ ] Successful registration creates user in DB and redirects
  - [ ] Error states display in 2007-style error boxes
  - [ ] Form uses Facebook 2007 `.inputtext` and `.inputsubmit` styles
  - [ ] Manual: visually matches 2007 Facebook welcome page layout

  **Commit**: YES
  - Message: `feat: add registration page with human verification checkbox`
  - Files: `app/page.tsx` (or `app/(auth)/register/page.tsx`), test files

---

- [ ] 6. Login Page / Sidebar Login

  **What to do**:
  - Implement login in the sidebar (matches 2007 Facebook where login was in the left sidebar)
  - Login form: Email, Password, "Remember me" checkbox, Login button
  - "Forgot Password?" link below (can be non-functional for V1, just styled)
  - On submit: call Better Auth signin endpoint
  - On success: redirect to News Feed (`/home.php`)
  - On error: show error message
  - Write TDD tests:
    - Test: login with correct credentials succeeds
    - Test: login with wrong password shows error
    - Test: login redirects to news feed

  **Must NOT do**:
  - Do NOT create a separate `/login` page — login is in the sidebar (2007 style)
  - Do NOT add "Sign in with Google" or any OAuth

  **Parallelizable**: YES (with Task 5)

  **References**:
  - Archived sidebar login form from Wayback Machine: `#squicklogin` with `.inputtext` fields (width: 123px), `.inputsubmit` button (width: 60px)
  - Better Auth signin: POST to `/api/auth/sign-in` with `{ email, password }`

  **Acceptance Criteria**:
  - [ ] RED: Tests for login logic → FAIL
  - [ ] GREEN: Login implemented → PASS
  - [ ] Sidebar shows login form when user is not logged in
  - [ ] Successful login redirects to `/home.php`
  - [ ] Failed login shows error message
  - [ ] Login form matches 2007 sidebar styling (123px wide inputs)
  - [ ] "Remember me" checkbox present

  **Commit**: YES
  - Message: `feat: add sidebar login form matching 2007 Facebook layout`
  - Files: sidebar component, test files

---

- [ ] 7. Profile Page & Wall

  **What to do**:
  - Create profile page at `/profile.php` (with `?id=` query param)
  - Profile layout with two columns:
    - **Left column**: Profile photo (square), name, bio, "Edit Profile" link (if own profile)
    - **Right column**: Mini-Feed (recent activity), Wall
  - Profile tabs: Wall | Info | Photos | Friends (tabs style from 2007 CSS)
  - **Wall tab (default)**: 
    - If viewing own profile or friend: show "Write on [Name]'s Wall" form
    - List of wall posts (chronological, newest first)
    - Each post: author name (link), timestamp, content
    - Post form: textarea + "Post" button
  - **Info tab**: Bio text, member since date
  - Create wall post server action: validate content (max 5000 chars), sanitize HTML, insert into `wall_post` table, create `feed_item`
  - Write TDD tests:
    - Test: creating a wall post inserts into DB
    - Test: wall posts are returned newest-first
    - Test: wall post content is sanitized (no HTML/script tags)
    - Test: content max 5000 characters enforced
    - Test: only authenticated users can post on walls

  **Must NOT do**:
  - Do NOT add Like button (came 2009)
  - Do NOT add comment threads on wall posts (2007 wall posts were flat)
  - Do NOT add rich text editor — plain textarea only
  - Do NOT add media attachments to wall posts (text only for V1)

  **Parallelizable**: NO (depends on Tasks 3-6)

  **References**:
  - Facebook 2007 profile structure: profile photo top-left, tabs below, wall as default tab
  - Profile tab CSS: `#tabs { text-align: center; padding: 4px 0; margin: 10px 20px 0; border-bottom: solid 1px #3B5998; }`
  - Active tab: `.activetab a { color: white; background: #3B5998; }`
  - Gray header: `.grayheader { border-bottom: 1px solid #ccc; background: #f7f7f7; padding: 15px 20px 10px; }`

  **Acceptance Criteria**:
  - [ ] RED: Wall post tests → FAIL
  - [ ] GREEN: Wall implemented → PASS
  - [ ] `/profile.php?id=1` shows user's profile
  - [ ] Profile shows name, photo, bio
  - [ ] Wall tab is default, shows posts chronologically
  - [ ] Can write on a profile's wall (text form + submit)
  - [ ] Wall posts are sanitized against XSS
  - [ ] Tabs switch between Wall/Info/Photos/Friends views
  - [ ] Own profile shows "Edit Profile" link

  **Commit**: YES
  - Message: `feat: add profile page with wall posts and tabbed layout`
  - Files: `app/profile.php/page.tsx`, components, test files

---

- [ ] 8. Status Updates

  **What to do**:
  - Add status update feature: "[Name] is ___"
  - Status update box at top of News Feed and on own profile
  - Form: text that says "[Your Name] is" followed by a text input (max 255 chars) + "Update" button
  - Server action: insert into `status_update` table, create `feed_item`
  - Display current status on profile page (below name)
  - Write TDD tests:
    - Test: status update is saved to DB
    - Test: max 255 characters enforced
    - Test: status is associated with correct user
    - Test: previous status is NOT deleted (history preserved)
    - Test: latest status is returned for display

  **Must NOT do**:
  - Do NOT allow free-form status — must be "[Name] is ___" format
  - Do NOT add status reactions or comments

  **Parallelizable**: NO (depends on Task 7 for profile)

  **References**:
  - 2007 Facebook status format: always started with "[Name] is" — user completed the sentence
  - Status shown below name on profile, and in News Feed

  **Acceptance Criteria**:
  - [ ] RED: Status update tests → FAIL
  - [ ] GREEN: Status updates work → PASS
  - [ ] Status form shows "[Your Name] is" prefix (not editable) + text input
  - [ ] Submitting creates status_update record
  - [ ] Current status appears on profile below user's name
  - [ ] Status appears in News Feed (after Task 10)
  - [ ] 255 character limit enforced

  **Commit**: YES
  - Message: `feat: add "Name is..." status updates in 2007 Facebook style`
  - Files: status components, server actions, test files

---

- [ ] 9. Friend System

  **What to do**:
  - Friend request flow: Send Request → Pending → Accept/Decline
  - **Send friend request**: Button on profile page "Add [Name] as a Friend"
  - **View pending requests**: Section on home page / dedicated page at `/reqs.php`
  - **Accept/Decline**: Buttons on each pending request
  - **Unfriend**: "Remove from Friends" link on friend's profile
  - **Friends list**: Tab on profile page showing all friends with profile photos
  - **Mutual friendship**: Both users must accept (not follow model)
  - Server actions for: sendRequest, acceptRequest, declineRequest, unfriend
  - Create `feed_item` when friendship is formed: "[Name] and [Name] are now friends"
  - Create `notification` when friend request is received
  - Write TDD tests:
    - Test: send friend request creates pending friendship record
    - Test: accepting request changes status to 'accepted'
    - Test: declining request changes status to 'declined'
    - Test: unfriending deletes the friendship record
    - Test: cannot send duplicate friend request
    - Test: cannot friend yourself
    - Test: friends list returns only accepted friendships
    - Test: mutual friendship — if A is friends with B, B is friends with A

  **Must NOT do**:
  - Do NOT add follow/unfollow (not 2007 Facebook)
  - Do NOT add friend categories or lists
  - Do NOT add friend suggestions algorithm

  **Parallelizable**: NO (depends on Task 7 for profile page)

  **References**:
  - Facebook 2007 friend request UX: "Add as Friend" button on profile, notification for requests
  - Friends tab on profile: grid of friend photos with names

  **Acceptance Criteria**:
  - [ ] RED: Friend system tests → FAIL
  - [ ] GREEN: Friend system works → PASS
  - [ ] Can send friend request from profile page
  - [ ] Pending requests appear on `/reqs.php`
  - [ ] Can accept or decline requests
  - [ ] Friends list shows on profile's Friends tab
  - [ ] Cannot friend self or send duplicate request
  - [ ] Feed item created when friendship formed
  - [ ] Notification created when request received

  **Commit**: YES
  - Message: `feat: add friend request system with accept/decline flow`
  - Files: friend components, server actions, test files

---

- [ ] 10. News Feed

  **What to do**:
  - Create News Feed page at `/home.php` (the logged-in homepage)
  - Query `feed_item` table for items from the user's friends, ordered by `createdAt` DESC
  - Feed item types to display:
    - Status updates: "[Name] is [status]"
    - Wall posts: "[Name] wrote on [Other]'s Wall: [content]"
    - New friendships: "[Name] and [Name] are now friends"
    - New photos: "[Name] added N new photos to [Album Name]"
  - Pagination: "Older" and "Newer" links (NOT infinite scroll — full page reload)
  - Page size: 20 items per page
  - Write TDD tests:
    - Test: feed shows items only from friends
    - Test: feed is ordered newest-first
    - Test: pagination returns correct page of items
    - Test: feed items render correct text for each type
    - Test: user's own actions appear in feed

  **Must NOT do**:
  - Do NOT add algorithmic ranking — pure chronological
  - Do NOT add infinite scroll
  - Do NOT add "Top Stories" / "Most Recent" toggle (came later)
  - Do NOT add feed item filtering

  **Parallelizable**: NO (depends on Tasks 8, 9 for feed content)

  **References**:
  - Facebook 2007 News Feed: chronological list of friend activity
  - Each feed item is a simple text entry with timestamp and link to the source

  **Acceptance Criteria**:
  - [ ] RED: Feed tests → FAIL
  - [ ] GREEN: Feed works → PASS
  - [ ] `/home.php` shows chronological feed of friend activity
  - [ ] Only shows items from friends (not all users)
  - [ ] Shows status updates, wall posts, new friendships
  - [ ] Pagination with "Older" / "Newer" links (page reload, not AJAX)
  - [ ] Empty state when no friends or no activity

  **Commit**: YES
  - Message: `feat: add chronological news feed showing friend activity`
  - Files: `app/home.php/page.tsx`, feed components, test files

---

- [ ] 11. Poke

  **What to do**:
  - Add "Poke" button on friend profiles
  - When poked: create `poke` record and `notification`
  - On the poked user's home page: "You have been poked by [Name]. Poke back?"
  - "Poke back" creates a reverse poke
  - Poke section on homepage (above/alongside feed)
  - Write TDD tests:
    - Test: poking creates poke record
    - Test: poke notification is created
    - Test: can poke back (creates reverse poke)
    - Test: cannot poke non-friends
    - Test: previous poke must be seen before new poke

  **Must NOT do**:
  - Do NOT add "SuperPoke" or poke variants
  - Do NOT add poke count or poke history page

  **Parallelizable**: NO (depends on Task 9 for friends)

  **References**:
  - Facebook 2007 poke: simple one-click action, displayed as notification "X poked you. Poke back?"

  **Acceptance Criteria**:
  - [ ] RED: Poke tests → FAIL
  - [ ] GREEN: Poke works → PASS
  - [ ] "Poke" button visible on friend profiles
  - [ ] Poke notification appears for recipient
  - [ ] "Poke back" mechanism works
  - [ ] Cannot poke non-friends

  **Commit**: YES
  - Message: `feat: add poke feature with poke-back mechanism`
  - Files: poke components, server actions, test files

---

- [ ] 12. Photos & Albums

  **What to do**:
  - Photo album system:
    - Create album: name, description
    - Upload photos to album (using Vercel Blob for storage)
    - View album: grid of thumbnails
    - View photo: full-size with caption, "Tag people in this photo" option
  - Photo tagging: dropdown to select users (simple, not coordinate-based)
  - Profile Photos tab: shows user's albums
  - Photo upload: accept jpg/png/gif, max 5MB, resize/thumbnail generation
  - Create `feed_item` when new photos are uploaded
  - Create `notification` when tagged in a photo
  - Write TDD tests:
    - Test: create album
    - Test: upload photo associates with album
    - Test: tag user in photo creates photo_tag record
    - Test: notification created when tagged
    - Test: album belongs to correct user
    - Test: only album owner can upload to their album

  **Must NOT do**:
  - Do NOT add coordinate-based face tagging (user confirmed simple dropdown)
  - Do NOT add photo editing/filters
  - Do NOT add photo comments (not in V1)
  - Do NOT add photo download button

  **Parallelizable**: YES (with Tasks 13, 14, 15 — all independent of each other)

  **References**:
  - Vercel Blob API: https://vercel.com/docs/storage/vercel-blob
  - Facebook 2007 photos: album-based, simple grid view, max 604px width for display

  **Acceptance Criteria**:
  - [ ] RED: Photo tests → FAIL
  - [ ] GREEN: Photos work → PASS
  - [ ] Can create photo album
  - [ ] Can upload photos to album (stored in Vercel Blob)
  - [ ] Album view shows thumbnail grid
  - [ ] Photo view shows full-size image with caption
  - [ ] Can tag users in a photo via dropdown
  - [ ] Tagged user receives notification
  - [ ] Photos tab on profile shows user's albums
  - [ ] Feed item created when photos uploaded

  **Commit**: YES
  - Message: `feat: add photo albums with upload, viewing, and user tagging`
  - Files: photo components, server actions, test files

---

- [ ] 13. Messages / Inbox

  **What to do**:
  - Inbox page at `/inbox` (matches 2007 Facebook's unified inbox)
  - Email-style messaging:
    - Compose: To (user search/autocomplete), Subject, Body, Send button
    - Inbox: list of received messages (sender, subject, date, read/unread status)
    - Sent: list of sent messages
    - Read message: shows full message with "Reply" button
  - Reply: pre-fills "To" and "Subject" (with "Re: " prefix)
  - Mark as read when opened
  - Create `notification` when message received
  - Write TDD tests:
    - Test: send message creates record
    - Test: recipient sees message in inbox
    - Test: sender sees message in sent
    - Test: opening message marks as read
    - Test: reply creates new message with correct subject prefix
    - Test: unread count is correct
    - Test: message content is sanitized

  **Must NOT do**:
  - Do NOT add real-time message delivery (no WebSockets — page refresh to see new messages)
  - Do NOT add message threads/conversations (each message is standalone, like email)
  - Do NOT add attachments
  - Do NOT add message folders or search
  - Do NOT add message delete

  **Parallelizable**: YES (with Tasks 12, 14, 15)

  **References**:
  - Facebook 2007 inbox: email-style with subject lines, read/unread, reply
  - Facebook Chat did NOT exist until March 2008

  **Acceptance Criteria**:
  - [ ] RED: Message tests → FAIL
  - [ ] GREEN: Messages work → PASS
  - [ ] Inbox shows received messages with read/unread status
  - [ ] Can compose new message with To, Subject, Body
  - [ ] Can reply to messages
  - [ ] Sent folder shows sent messages
  - [ ] Notification created when message received
  - [ ] Unread count shown in navigator

  **Commit**: YES
  - Message: `feat: add email-style messaging with inbox, compose, and reply`
  - Files: message components, server actions, test files

---

- [ ] 14. Groups

  **What to do**:
  - Groups feature:
    - Browse/search groups at `/groups.php`
    - Create group: name, description
    - Group page: info, member list, group wall
    - Join/Leave group
    - Group wall: members can post on it
  - Group creator is automatically admin
  - Create `notification` when invited to group
  - Create `feed_item` when user joins a group
  - Write TDD tests:
    - Test: create group
    - Test: join group creates membership record
    - Test: leave group removes membership
    - Test: group wall post only by members
    - Test: group creator is admin
    - Test: feed item created on group join

  **Must NOT do**:
  - Do NOT add group discussion boards (separate from wall)
  - Do NOT add group photos
  - Do NOT add group officer roles beyond admin
  - Do NOT add open/closed/secret group types (all groups are open for V1)

  **Parallelizable**: YES (with Tasks 12, 13, 15)

  **References**:
  - Facebook 2007 groups: name, description, members, wall, created by user

  **Acceptance Criteria**:
  - [ ] RED: Group tests → FAIL
  - [ ] GREEN: Groups work → PASS
  - [ ] Can create a group
  - [ ] Can join/leave a group
  - [ ] Group page shows info, members, wall
  - [ ] Members can post on group wall
  - [ ] Feed item when joining group

  **Commit**: YES
  - Message: `feat: add groups with create, join, leave, and group wall`
  - Files: group components, server actions, test files

---

- [ ] 15. Events

  **What to do**:
  - Events feature:
    - Browse events at `/events.php`
    - Create event: name, description, location, start time, end time
    - Event page: info, RSVP status, guest list
    - RSVP: Attending / Maybe / Declined buttons
    - Events can optionally belong to a group
  - Create `notification` when invited to event (for now, event creator's friends see it in feed)
  - Create `feed_item` when event is created
  - Write TDD tests:
    - Test: create event
    - Test: RSVP creates record with correct status
    - Test: changing RSVP updates record
    - Test: guest list shows users by RSVP status
    - Test: feed item created on event creation

  **Must NOT do**:
  - Do NOT add recurring events
  - Do NOT add event photos
  - Do NOT add event wall/comments
  - Do NOT add event reminders/email notifications
  - Do NOT add past event archival logic

  **Parallelizable**: YES (with Tasks 12, 13, 14)

  **References**:
  - Facebook 2007 events: name, details, location, time, RSVP with three states

  **Acceptance Criteria**:
  - [ ] RED: Event tests → FAIL
  - [ ] GREEN: Events work → PASS
  - [ ] Can create an event with name, description, location, times
  - [ ] Can RSVP: attending/maybe/declined
  - [ ] Event page shows guest list grouped by RSVP status
  - [ ] Feed item when event created

  **Commit**: YES
  - Message: `feat: add events with create, RSVP, and guest list`
  - Files: event components, server actions, test files

---

- [ ] 16. Notifications & Navigator Counts

  **What to do**:
  - Wire up notification counts in the navigator bar
  - Show counts for: Friend Requests, Messages (unread), Pokes
  - Format: "Inbox (3)" style links in the navigator
  - Create notifications dropdown/page at `/notifications.php`
  - List recent notifications: "[Name] poked you", "[Name] sent you a friend request", "[Name] wrote on your Wall", "[Name] tagged you in a photo", etc.
  - Mark notifications as read when viewed
  - Write TDD tests:
    - Test: notification counts are correct for each type
    - Test: marking notification as read updates count
    - Test: notifications are ordered newest-first

  **Must NOT do**:
  - Do NOT add real-time notification updates (page refresh to see new ones)
  - Do NOT add push notifications or email notifications
  - Do NOT add notification settings/preferences

  **Parallelizable**: NO (depends on Tasks 9, 11, 12, 13 for notification sources)

  **References**:
  - Facebook 2007 navigator: showed counts inline like "Inbox (3)" in the nav links

  **Acceptance Criteria**:
  - [ ] RED: Notification tests → FAIL
  - [ ] GREEN: Notifications work → PASS
  - [ ] Navigator shows unread counts for messages, friend requests, pokes
  - [ ] `/notifications.php` lists all notifications
  - [ ] Notifications marked as read when viewed
  - [ ] Counts update after reading (on next page load)

  **Commit**: YES
  - Message: `feat: add notification system with navigator count badges`
  - Files: notification components, server actions, test files

---

- [ ] 17. User Search

  **What to do**:
  - Search bar in the sidebar (matching 2007 Facebook's search position)
  - Search by name (simple LIKE query against user table)
  - Results page at `/search.php?q=query`
  - Results show: profile photo, name, mutual friends count (optional for V1)
  - "Add as Friend" button on search results
  - Write TDD tests:
    - Test: search by name returns matching users
    - Test: search is case-insensitive
    - Test: empty query returns no results
    - Test: search results don't include the searching user

  **Must NOT do**:
  - Do NOT add full-text search engine (simple LIKE is fine for V1)
  - Do NOT add search filters (by network, school, etc.)
  - Do NOT add search suggestions/autocomplete

  **Parallelizable**: NO (depends on Task 7 for user profiles)

  **References**:
  - Facebook 2007 search: search bar in sidebar, search by name, results page with "Add as Friend"
  - Sidebar search CSS: `#qsearch { padding: 8px 4px 2px 10px; }` with magnifying glass background icon

  **Acceptance Criteria**:
  - [ ] RED: Search tests → FAIL
  - [ ] GREEN: Search works → PASS
  - [ ] Search form in sidebar
  - [ ] `/search.php?q=john` shows matching users
  - [ ] Results show profile photo and name
  - [ ] "Add as Friend" button on results
  - [ ] Case-insensitive search works

  **Commit**: YES
  - Message: `feat: add user search with results page and add-friend button`
  - Files: search components, server actions, test files

---

- [ ] 18. Seed Data & Final Polish

  **What to do**:
  - Create `scripts/seed.ts` — database seeding script for development
  - Seed data:
    - 10 test users (with profile photos placeholder)
    - Friendships between them
    - Wall posts, status updates
    - Photo albums with placeholder images
    - Messages between users
    - Pokes
    - 2-3 groups with members and wall posts
    - 2-3 events with RSVPs
    - Feed items for all the above
  - Final polish:
    - Verify all pages match 2007 Facebook aesthetic
    - Check all links work
    - Check empty states (new user with no friends, no posts)
    - Verify all form submissions work
    - Verify error states display correctly
  - Add `npm run seed` script to package.json

  **Must NOT do**:
  - Do NOT add production seed data — development only
  - Do NOT add faker/random data generation — use meaningful test data

  **Parallelizable**: NO (depends on ALL previous tasks)

  **References**:
  - All schema tables from Task 2
  - Drizzle insert syntax: https://orm.drizzle.team/docs/insert

  **Acceptance Criteria**:
  - [ ] `npm run seed` populates database with test data
  - [ ] Can log in as any seed user
  - [ ] Seed users have friends, posts, photos, messages
  - [ ] News feed shows activity for seed users
  - [ ] All 10 features are functional end-to-end
  - [ ] Visual audit: pages match 2007 Facebook aesthetic
  - [ ] `npm run build` succeeds with zero errors
  - [ ] All vitest tests pass: `npx vitest run` → 0 failures

  **Commit**: YES
  - Message: `feat: add seed data script and final visual polish`
  - Files: `scripts/seed.ts`, package.json, any polish fixes

---

## Commit Strategy

| After Task | Message | Verification |
|------------|---------|--------------|
| 0 | `feat: scaffold Next.js project with Drizzle, Better Auth, and vitest` | `npm run dev` + `npx vitest run` |
| 1 | `feat: add Facebook 2007 global CSS system from archived source` | `npm run build` |
| 2 | `feat: define complete database schema for all social features` | `npx drizzle-kit push` + `npx vitest run` |
| 3 | `feat: configure Better Auth with Drizzle adapter and email/password` | `npx vitest run` |
| 4 | `feat: implement Facebook 2007 layout shell with header, sidebar, footer` | Manual visual check |
| 5 | `feat: add registration page with human verification checkbox` | `npx vitest run` + manual |
| 6 | `feat: add sidebar login form matching 2007 Facebook layout` | `npx vitest run` + manual |
| 7 | `feat: add profile page with wall posts and tabbed layout` | `npx vitest run` + manual |
| 8 | `feat: add "Name is..." status updates in 2007 Facebook style` | `npx vitest run` |
| 9 | `feat: add friend request system with accept/decline flow` | `npx vitest run` |
| 10 | `feat: add chronological news feed showing friend activity` | `npx vitest run` + manual |
| 11 | `feat: add poke feature with poke-back mechanism` | `npx vitest run` |
| 12 | `feat: add photo albums with upload, viewing, and user tagging` | `npx vitest run` + manual |
| 13 | `feat: add email-style messaging with inbox, compose, and reply` | `npx vitest run` + manual |
| 14 | `feat: add groups with create, join, leave, and group wall` | `npx vitest run` + manual |
| 15 | `feat: add events with create, RSVP, and guest list` | `npx vitest run` + manual |
| 16 | `feat: add notification system with navigator count badges` | `npx vitest run` |
| 17 | `feat: add user search with results page and add-friend button` | `npx vitest run` |
| 18 | `feat: add seed data script and final visual polish` | Full manual walkthrough |

---

## Success Criteria

### Verification Commands
```bash
npm run dev          # Expected: starts on localhost:3000
npm run build        # Expected: builds with 0 errors
npx vitest run       # Expected: all tests pass
npm run seed         # Expected: populates DB with test data
```

### Final Checklist
- [ ] All "Must Have" features present and functional
- [ ] All "Must NOT Have" items absent (no Tailwind, no rounded corners, no modern UX, etc.)
- [ ] All vitest tests pass
- [ ] Visual match: 2007 Facebook blue (#3B5998), 11px Lucida Grande, 799px fixed width, float-based layout
- [ ] Auth works: register, login, logout, session persistence
- [ ] Social graph: friends, wall posts, status updates, news feed
- [ ] Media: photo albums, upload, tagging
- [ ] Communication: messages, poke
- [ ] Community: groups, events
- [ ] "I am human" checkbox enforced at registration
