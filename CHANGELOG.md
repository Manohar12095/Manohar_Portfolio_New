# S. Manohar — 3D Portfolio & Admin Architecture Manual
## Version 1.1.0 (Official Production Milestone)

> **Important Developer Notice**: This document serves as the complete technical architecture manual and chronological changelog for the **S. Manohar 3D Developer Portfolio (V 1.1.0)**. Any developer or AI coding agent upgrading or maintaining this repository can refer to this guide to understand how every component, database table, security rule, telemetry streamer, and UI flow works.

---

## 1. System Overview & Technology Stack

The portfolio is an enterprise-grade, full-stack 3D developer showcase built with a modular architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Vite + React 18)                 │
│                                                                        │
│   Public Portfolio          Certificates Hub         Personal Space    │
│   (Three.js 3D Canvas,      (Multi-page viewer,     (Confidential      │
│   Journey, Projects, Reels)  Analytics, Tags, Sort)   Vault & Editor)  │
│                                                                        │
│                    Admin Portal Suite (/admin)                         │
│                    (18 Management Tabs, RBAC, Gate)                    │
└───────────────────▲─────────────────────────────▲──────────────────────┘
                    │ Real-time WebSockets        │ CDN Stream & OAuth
                    ▼                             ▼
┌───────────────────────────────────────┐ ┌──────────────────────────────┐
│       SUPABASE POSTGRESQL (RLS)       │ │    GOOGLE DRIVE CLOUD        │
│                                       │ │                              │
│ • Telemetry Logs   • Security Alerts  │ │ • Apps Script Webhook        │
│ • Visitor Blocks   • RBAC Roles       │ │ • Multi-Page Marksheets      │
│ • Certificates     • Personal Items   │ │ • Direct CDN Image Stream    │
│ • Realtime Feed    • Health Latency   │ │ • Embedded PDF Previews      │
└───────────────────────────────────────┘ └──────────────────────────────┘
```

### Core Technologies
- **Frontend Core**: React 18.3 (`react`, `react-dom`), React Router v6 (`react-router-dom`)
- **Build Engine & Bundler**: Vite 5.4 with `@vitejs/plugin-react`
- **3D & Graphics**: Three.js (`three` 0.169), `@react-three/fiber` 8.17
- **Database & Auth**: Supabase PostgreSQL with `@supabase/supabase-js` 2.119, Row Level Security (RLS), and Realtime Channels
- **Icons & Styling**: Lucide React (`lucide-react`), Vanilla CSS Variables, Glassmorphic UI Design System
- **Cloud Document & Media Storage**: Google Drive API integrated via custom Google Apps Script (`apps-script/Code.gs`)
- **Deployment Platform**: Vercel Serverless with automatic Git branch continuous integration (`vercel.json` SPA rewrites)

---

## 2. Database Schema & Architecture

The database is hosted on Supabase PostgreSQL. Below is the complete schema definition for all 10 active public tables:

### 1. `visitor_telemetry`
Stores comprehensive, privacy-conscious visitor session telemetry updated in real time via a 5-second heartbeat.
- `session_id` (`text`, Primary Key): Unique client session UUID (`portfolio.visitor.session`).
- `visitor_name` (`text`): Name provided by visitor at the welcome gate.
- `device_type` (`text`): `desktop`, `tablet`, or `mobile`.
- `os` (`text`): Detected operating system (e.g. `Windows`, `macOS`, `Linux`, `Android`, `iOS`).
- `browser` (`text`): Browser engine & client (e.g. `Chrome`, `Edge`, `Firefox`, `Safari`, `Opera`).
- `screen_res` (`text`): Screen resolution (e.g. `1920x1080`).
- `viewport` (`text`): Current browser window viewport (e.g. `1440x900`).
- `dpr` (`numeric`): Device pixel ratio.
- `language` (`text`): Preferred client language (e.g. `en-US`).
- `timezone` (`text`): Detected client timezone (e.g. `Asia/Kolkata`).
- `network` (`jsonb`): Downlink speed, RTT, and effective connection type.
- `login_time` (`timestamptz`): Initial entry timestamp.
- `last_active_at` (`timestamptz`): Latest active heartbeat timestamp.
- `duration_seconds` (`integer`): Total active seconds spent on the website.
- `pages_viewed` (`jsonb` / array): History of sections and routes visited.
- `actions` (`jsonb` / array): Stream of user interactions (button clicks, modals opened, link clicks).
- `threat_level` (`text`): `normal`, `alert`, or `critical`.
- `is_blocked` (`boolean`): Active visitor block flag.
- `blocked_until` (`timestamptz`): Expiry timestamp if blocked temporarily.
- `block_reason` (`text`): Administrative justification for block.

### 2. `security_alerts`
Real-time intrusion detection and behavioral security alerts log.
- `id` (`uuid`, Primary Key): Unique alert identifier.
- `session_id` (`text`): Linked visitor session ID.
- `visitor_name` (`text`): Name of the visitor / attacker.
- `event_type` (`text`): Specific threat or activity identifier (e.g., `DEVTOOLS_INSPECT`, `SCREENSHOT_ATTEMPT`, `WEBSITE_LINK_CLICK`).
- `severity` (`text`): `green` (Safe activity), `yellow` (Warning), or `critical` (Red / Threat).
- `details` (`text`): Detailed incident description.
- `device_info` (`jsonb`): Snapshot of attacker's hardware and network details.
- `created_at` (`timestamptz`): Detection timestamp.
- `is_resolved` (`boolean`): Administrative acknowledgment flag.

### 3. `visitor_blocks`
Enforces temporary or permanent access restrictions across the website.
- `id` (`uuid`, Primary Key): Block record ID.
- `session_id` (`text`): Session target.
- `visitor_name` (`text`): Name of blocked visitor.
- `duration_type` (`text`): One of 10 duration types: `5m`, `1h`, `12h`, `1d`, `1w`, `1m`, `6m`, `1y`, `permanent`, `terminated`.
- `blocked_until` (`timestamptz`): Calculated UTC expiry timestamp (null for permanent).
- `reason` (`text`): Administrative block explanation.
- `blocked_by` (`text`): Admin email issuing the block.
- `is_active` (`boolean`): Active status flag.
- `created_at` / `updated_at` (`timestamptz`).

### 4. `admin_roles`
Database-level Role-Based Access Control (RBAC) mapping.
- `id` (`uuid`, Primary Key): User reference.
- `email` (`text`, Unique): Administrative account email.
- `role` (`text`): Permissions level: `superuser`, `editor`, or `viewer`.
- `is_blocked` (`boolean`): Account lockout flag.
- `created_at` / `updated_at` (`timestamptz`).

### 5. `certificates`
Official catalog of verified credentials, marksheets, and accreditations.
- `id` (`uuid`, Primary Key): Certificate identifier.
- `title` (`text`): Official award / certificate name.
- `category` (`text`): E.g., `Technical Activities`, `Medal`, `Awards`, `Digital Badges`, `Other Rewards`, `Academy`.
- `description` (`text`): Details, issuing institution, rank.
- `image_url` (`text`): Primary front page cover URL.
- `pages` (`jsonb` / array): Array of image URLs for multi-page documents (Page 1, Page 2, Page 3...).
- `file_url` (`text`): Direct downloadable document link (PDF).
- `visibility` (`text`): `public` (visible on `/certificates`), `private` (visible only in `/personal`), or `hidden`.
- `tags` (`jsonb` / array): Keywords and category tags.
- `sort_order` (`integer`): Custom ordering priority.

### 6. `certificate_views`
Granular engagement and view-duration analytics per certificate.
- `id` (`uuid`, Primary Key).
- `certificate_id` (`uuid`): Foreign key to `certificates.id`.
- `session_id` (`text`): Visitor session.
- `visitor_name` (`text`): Viewer name.
- `time_spent_ms` (`integer`): Exact milliseconds spent viewing the credential in the lightbox.
- `created_at` (`timestamptz`).

### 7. `personal_items`
Encrypted personal vault storing confidential records, marksheets, text notes, and private media.
- `id` (`text` / `uuid`, Primary Key).
- `title` (`text`): Document or note title.
- `type` (`text`): `text` (Note/Markdown), `document` (PDF/Marksheet), `photo`, `audio`, `video`.
- `category` (`text`): `Identity`, `Academic`, `Civil`, `Financial`, `Notes`.
- `content` (`text`): In-place editable text note body, description, or transcript.
- `media_url` (`text`): Google Drive share URL or direct media link.
- `sort_order` (`integer`).
- `created_at` / `updated_at` (`timestamptz`).

### 8. `contact_messages`
Inbound messages received from the public portfolio contact form.
- `id` (`uuid`, Primary Key).
- `name` (`text`), `email` (`text`), `subject` (`text`), `message` (`text`).
- `created_at` (`timestamptz`).

### 9. `portfolio_documents`
Public downloadable assets (official resume, curriculum vitae, brochures).

### 10. `keep_alive`
Heartbeat table used to measure database response latency (ping) and keep serverless PostgreSQL connections primed.

---

## 3. Core Subsystems & How They Work

### A. The 3D Interactive Canvas & Theme Engine
- **Three.js Scene (`src/components/SceneBackground.jsx`)**: Sits fixed behind the page. Dynamically renders 3D geometric meshes (icosahedrons, tetrahedrons, toruses) with smooth mouse parallax interaction and performance caps (max 1.5× DPR, auto-disabled if WebGL is unavailable or if `prefers-reduced-motion` is active).
- **Theme Engine (`src/data/themes.js`, `src/context/ThemeContext.jsx`)**: 13 built-in themes plus custom theme creator. Themes dynamically update CSS custom properties (`--accent`, `--bg`, `--surface`, `--ink`, `--glass-border`, 3D particle colors, and Google Fonts).

### B. "My Journey" Full Image Preview Frames
- **Problem Solved**: Standard 4:3 cropped media cards cut off the top and bottom of photo collages.
- **Implementation (`src/styles/global.css`)**: Removed rigid aspect ratios. Configured container with flexible natural aspect ratios (`max-height: 440px`, `object-fit: contain`). Collages, portrait photos, and certificates adjust automatically without clipping.

### C. Real-Time Telemetry & Visitor Streamers (`src/lib/telemetry.js`)
- **Initialization**: Triggered automatically when the visitor inputs their name at the neon welcome gate.
- **Heartbeat**: Every 5 seconds, calculates seconds elapsed, updates active route path, buffers user clicks/events, and sends a non-blocking upsert to Supabase `visitor_telemetry`.
- **Exit Flush**: Flushes final session metrics on `visibilitychange` (tab hidden) and `beforeunload`.

### D. 3-Tier Security Intrusion Detection System
Security alerts are monitored in real time and categorized into a strict 3-tier color system:

| Level | Badge & Row Color | Triggering Event Types | Description & Rules |
|---|---|---|---|
| **Green** | 🟢 **Green (Safe)** | `WEBSITE_LINK_CLICK`, `CERTIFICATE_DOWNLOAD`, `FILE_DOWNLOAD_ATTEMPT`, `WATCH_TIME_20S` | Normal engagement: browsing links, downloading certificates, or attentively watching content for > 20s. |
| **Yellow** | 🟡 **Yellow (Warning)** | `ADMIN_PORTAL_ACCESSED`, `DEVTOOLS_INSPECT` (F12) | Suspicious exploration: visitor navigates to `/admin` login screen or presses F12 on keyboard. |
| **Red** | 🔴 **Red (Critical)** | `SCREENSHOT_ATTEMPT`, `SCREEN_RECORDING_DETECTED`, `PRINT_PAGE_ATTEMPT`, `RIGHT_CLICK_INSPECT`, `CONTENT_COPY_ATTEMPT`, `CONTENT_SHARE_ATTEMPT`, `WRONG_ADMIN_PASSWORD`, `WRONG_ADMIN_PASSCODE`, `ADMIN_LOCKOUT` | Explicit intrusion attempts: PrintScreen, Windows Snipping Tool (Win+Shift+S), macOS screenshot shortcuts, `navigator.mediaDevices.getDisplayMedia` screen recording, text copying, right-click inspect, and failed password guesses. |

#### Super User Alert Suppression Rule
- When the Super User (`Manohar`, `manoharorignal@gmail.com`, or `pvcmanohar@gmail.com`) is logged in or browsing the portfolio:
  - Telemetry and navigation actions are tracked in `visitor_telemetry`.
  - **No intrusion alerts are written to `security_alerts`**, eliminating false-positive self-alerts when managing the admin panel.

### E. Visitor Blocking & Immediate Interception System
- Super Users can block any visitor directly from the **User Control** or **Users** tab in the admin panel.
- **10 Duration Options**: `5 Minutes`, `1 Hour`, `12 Hours`, `1 Day`, `1 Week`, `1 Month`, `6 Months`, `1 Year`, `Permanent`, or `Instant Termination`.
- **Interception (`src/components/BlockedScreen.jsx`)**: When a blocked session is detected, the website UI is immediately locked with a fullscreen red alert screen displaying the reason, IP metadata, and a live countdown timer until access is restored.

### F. Certificates & Accreditations Module (`src/pages/Certificates.jsx`)
- **Multi-Page Handling**: Displays certificates with multiple sheets (e.g. marksheets, transcripts) using slide or PDF viewer mode.
- **Categorization & Tags**: Filter by standard tags (`Medal`, `Awards`, `Digital Badges`, `Other Rewards`, `Certificate`) or categories.
- **Multi-Criteria Sorting**:
  1. *Year*: Newest first or oldest first.
  2. *Type Priority*: `Certificate` > `Medal` > `Awards` > `Digital Badges` > `Other Rewards` > `Others`.
  3. *Multiple Pages*: Prioritizes multi-page marksheets first.
  4. *Title*: Alphabetical A → Z or Z → A.
- **Analytics Tracking**: Automatically logs exact milliseconds spent viewing credentials to `certificate_views`.

### G. Manohar's Personal Space Vault (`src/pages/PersonalSpace.jsx`)
- **Protected Access**: Protected by Supabase Super User session or local passkey.
- **Rich Media Types**: Supports Text Notes, Documents/PDFs, Photos, Audios, and Videos.
- **In-Website Document & Text Viewer Modal**:
  - Clicking any card opens the document **directly inside the website** via a full-screen interactive modal.
  - **For PDFs / Documents**: Embeds high-resolution Google Drive preview iframe (`https://drive.google.com/file/d/${driveId}/preview`) with full-screen zoom and download.
  - **For Text Notes**: Displays full monospace formatted text reader with **"Copy Content"** and **"Edit Text"** buttons.
  - **For Audios / Videos**: Plays tracks and video recordings directly on the page.
- **In-Place Text Editor**: Enables Manohar to create new text documents or modify existing note contents directly on the page and save instantly to Supabase.
- **Search & Sort**: Real-time keyword filter across title, text, and categories; sort by Recently Modified, Date Added, Type, or Title.

### H. Role-Based Access Control (RBAC) & Admin Gate (`src/admin/Gate.jsx`)
- **Super User** (`manoharorignal@gmail.com`, `pvcmanohar@gmail.com`): Full unrestricted control over all 18 tabs, database backups, user management, visitor blocking, and personal vault.
- **Editor**: Can update content (Hero, About, Journey, Projects, Skills, Contact) but cannot view user activity, telemetry, database settings, backups, or personal space.
- **Viewer** (`temp@manohar.com`): Read-only preview of content; cannot view visitor logins, telemetry logs, database, backups, or personal space.
- **Secure Lock Button**: Clicking **Lock & Sign Out** executes `adapter.signOut()` and `supabase.auth.signOut()`, purging browser session tokens and requiring explicit re-authentication.

---

## 4. Chronological Version Changelog

### Version 1.1.0 — Production Milestone Release (Current)
- **Native Cloud Media Storage & Direct Upload Suite**: Implemented Supabase Storage `portfolio-media` public bucket and `src/lib/cloudStorage.js` service, eliminating reliance on external Google Apps Script web apps. Enabled direct drag-and-drop and 1-click uploads for all photos (JPG, PNG, WebP, GIF, AVIF) and videos (MP4, WebM, MOV) with instant CDN delivery. Added direct upload buttons across all admin media fields and Personal Space editor modal, while maintaining seamless Google Drive integration.
- **Personal Space Modal Stacking & Database Schema Patch**: Portalled both document preview and note editor modals to `document.body` via React `createPortal` with `z-index: 999999`, resolving stacking context issues where the global navbar overlapped modal headers. Added `category` column to `personal_items` table in Supabase PostgreSQL with schema cache reload and defensive client-side fallback handling.
- **Personal Space In-Website Previews & Editor**: Built interactive in-website document & text previewing system; added embedded Google Drive preview iframe modal, in-place text note editor, audio/video players, live search, and sorting.
- **Journey**: Implemented natural aspect ratio frames (`max-height: 440px`, `object-fit: contain`) so complete collage photos and group images display fully without clipping.
- **Admin Sidebar**: Added independent scrollable navigation (`.adm-nav`) with `max-height: calc(100vh - 100px)` and thin scrollbars, enabling easy access to all 18 tabs.
- **Security Alerts & Intrusion Detection**: Added Minimize / Expand toggle button in Monitoring tab; implemented 3-tier color classification (Green for links/downloads/>20s watch, Yellow for login/F12, Red for intrusion/screenshots/tampering).
- **Super User Alert Suppression**: Filtered Super User (Manohar) activity so admin management never floods security alerts with false alarms.
- **Certificates Hub**: Added tags (`Medal`, `Awards`, `Digital Badges`, `Other Rewards`); added Sort By dropdown (Year, Type Priority, Multi-page first, Title).
- **User Blocking**: Added 10 duration options (5m to permanent) with active session interception via `BlockedScreen`.
- **Lock Button**: Fixed logout flow to clear Supabase auth session, preventing unauthorized auto-unlock.
- **Automated Verification**: Created `scripts/verify_project_flow.cjs` verifying 10 database tables, telemetry streamers, blocking columns, personal items, and user auth sign-in.

### Version 1.0.0 (2026-11-23) — Foundation Release

### Version 1.3 (2026-11-19)
- Introduced Visitor Welcome Gate with avatar of S. Manohar and name input.
- Added client telemetry logging to Supabase `visitor_telemetry`.
- Added floating "Edit portfolio" quick-access button.
- Added Admin "Monitoring & SEO" tab with live visitor logs, device breakdown, and latency ping.

### Version 1.2 (2026-11-19)
- Integrated Supabase database adapter (`@supabase/supabase-js`).
- Implemented Supabase Auth for administrative write protection.
- Created `docs/DATABASE.md` and environment variable configuration templates.

### Version 1.1 (2026-11-18)
- Added `portfolio.bat` menu runner for Windows.
- Expanded Journey to 10 distinct categories with chronological year grouping.
- Added Projects showcase with category filtering (Security, AI, Tools, Web, Mobile).
- Added Media Library tab with Google Drive Google Apps Script connector (`apps-script/Code.gs`).

### Version 1.1.1 (2026-11-13)
- Initial release: Interactive Three.js 3D WebGL background, 13 customizable themes, hero video switcher, and base admin interface.

