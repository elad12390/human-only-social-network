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
