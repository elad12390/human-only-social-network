# Draft: Human-Only Social Network (Facebook 2007 Clone)

## Requirements (confirmed)
- **Concept**: "Human-only" social network — verified humans, NO AI-generated content
- **Framework**: Next.js
- **UI**: EXACT replica of Facebook 2007 visual design
- **Project setup**: Fresh Next.js project in this repo (replace existing MCP aggregator code)

## MVP Features (ALL selected)
1. Registration & Login
2. Profile Page & Wall
3. News Feed (Mini-Feed)
4. Friend System
5. Status Updates ("John is...")
6. Photos (albums, upload, tagging)
7. Messages/Inbox
8. Poke
9. Groups
10. Events

## Human-Only Mechanism
- **Verification**: Users must prove they're human to join
- **Content policy**: AI-generated content is banned
- Details TBD (how to verify? what constitutes AI content?)

## Research Findings: Facebook 2007 Design (CONFIRMED from Wayback Machine)

### Actual CSS (from web.archive.org, early 2008 capture)

**Source**: `http://static.ak.facebook.com/css/common.css.pkg.php` via Wayback Machine

**Typography**:
- Font stack: `"lucida grande", tahoma, verdana, arial, sans-serif`
- Base font size: `11px`
- Headings h1: `14px`, h2/h3: `13px`, h4/h5: `11px`
- Text color: `#333` (not pure black)
- Link color: `#3b5998`
- Link hover: underline (no color change)

**Layout**:
- `#book` wrapper: `width: 799px; margin: 0 auto`
- `#sidebar`: `width: 150px; float: left`
- `#widebar`: `width: 649px; float: left`
- Sidebar background: `#f7f7f7`
- Content border: `1px solid #b7b7b7` (left/right), `1px solid #3b5998` (bottom)
- Content shadow: background image `shadow_gray.gif` on right side

**Colors (EXACT)**:
- Primary blue: `#3B5998`
- Navigator active bg: `#5c75aa`
- Secondary blue: `#6D84B4`
- Light blue border: `#D8DFEA`
- Input border: `#BDC7D8`
- Content border: `#b7b7b7`
- Sidebar bg: `#f7f7f7`
- Error bg: `#ffebe8`, border: `#dd3c10`
- Status/notice bg: `#fff9d7`, border: `#e2c822`
- Footer text: `#777`
- Label color: `#666666`

**Buttons (`.inputsubmit`)**:
- Background: `#3b5998`
- Color: `#FFFFFF`
- Border: solid 1px — top/left: `#D9DFEA`, bottom/right: `#0e1f5b`
- Padding: `2px 15px 3px 15px`
- Font: `11px "lucida grande", tahoma, verdana, arial, sans-serif`

**Form Inputs (`.inputtext`)**:
- Border: `1px solid #bdc7d8`
- Font: `11px "lucida grande", tahoma, verdana, arial, sans-serif`
- Padding: `3px`

**Navigator (top bar)**:
- Background: gradient image (`navigator_bg.gif`)
- Padding: `9px 0 4px 0`
- Link color: white
- Active/hover bg: `#5c75aa`
- Font size: `13px` (main), `11px` (secondary)
- Secondary link color: `#c3cddf`
- Dropdown border: `1px solid #3b5998`

**Page Footer**:
- Height: `50px`
- Copyright color: `#777`

**Content Modules**:
- Gray header bg: `#f7f7f7`
- Border bottom: `1px solid #ccc`
- Padding: `15px 20px 10px`
- Tab active bg: `#3B5998`, text: white
- Tab hover bg: `#D8DFEA`

**Tabs (`.toggle_tabs`)**:
- Normal bg: `#f1f1f1` with gloss image
- Border: `1px solid #898989`
- Selected bg: `#6d84b4`
- Selected border: `1px solid #3b5998`

### HTML Structure (from Wayback Machine)

```
<body class="welcome">
  <div id="book">
    <div id="sidebar">
      <a class="go_home" /> (logo)
      <div id="sidebar_content">
        <div id="squicklogin"> (login form)
      </div>
    </div>
    <div id="widebar">
      <div id="navigator"> (top nav bar)
      <div id="page_body">
        <div id="content_shadow">
          <div id="content">
            <div id="content_frame">
              <div id="content_stage">
                ...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div id="pagefooter">
  </div>
</body>
```

### Key Design Features
- Login form in LEFT sidebar (not a separate page for logged-out users initially)
- "Facebook" logo as background image on a link, blue bg `#3b5998`
- Status format: "[Name] is..." (forced third-person)
- Wall: chronological posts from friends on your profile
- Mini-Feed: activity feed on profile
- News Feed: aggregated friend activity
- Poke: single-click interaction
- 799px fixed-width layout, NOT responsive

## Technical Decisions
- **Database**: Turso (libSQL) + Drizzle ORM (better-sqlite3 for local dev)
- **Auth**: Better Auth (native Drizzle + libSQL adapter, handles everything)
- **Image storage**: Vercel Blob (free tier 1GB)
- **Real-time**: Not needed for MVP (no chat — Facebook Chat didn't exist in 2007!)
- **Deployment**: Vercel
- **Human verification**: Honor system for now ("I am human" checkbox), build real verification later
- **AI content detection**: Honor system for now, add detection later
- **Photo tagging**: Simple dropdown (select users), NOT coordinate-based face clicking
- **Profile fields**: Minimal (name, bio, profile photo) — add more fields later
- **URL scheme**: `profile.php?id=123` style (authentic 2007 Facebook)
- **CSS approach**: Single global `facebook2007.css` — NO Tailwind, NO CSS frameworks
- **No responsive design**: Fixed 799px width (authentic)
- **No modern UX patterns**: No infinite scroll, no skeleton loaders, no toasts, no modals with blur
- **Test framework**: vitest — TDD for business logic, NOT for CSS/visual testing

## Open Questions
- (All resolved - see Technical Decisions above)
- Test strategy: TBD (will ask during plan generation)

## Scope Boundaries
- INCLUDE: All 10 MVP features listed above
- INCLUDE: 2007 Facebook pixel-perfect UI (from actual archived CSS)
- INCLUDE: Human verification system
- INCLUDE: AI content detection/prevention
- EXCLUDE: TBD
