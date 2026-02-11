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
