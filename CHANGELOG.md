# What changed

Newest first. Each entry says if it touches your own text or theme settings,
so you know what to pick in "Apply an update" (K = keep mine, N = use new).

## 2026-11-19  (portfolio.bat v1.3)

Changes src/data/content.js: no
Changes src/data/themes.js: no

- NEW Visitor Welcome Gate: dark card with neon cyan glow, live status dot,
  avatar of S. Manohar, and name input. Visitors must enter their name to explore.
- NEW Visitor Telemetry Tracking: automatically logs non-intrusive client metadata
  (device type, OS, browser, screen resolution, viewport, DPR, language, timezone,
  hardware concurrency, network info, referrer, login timestamp, live duration in
  seconds, and section/page history) to Supabase table `public.visitor_telemetry`.
- NEW Floating "Edit portfolio" button: fixed in the bottom corner of the public
  site, allowing direct access to the `/admin` control panel.
- NEW Admin "Monitoring & SEO" Tab: live real-time visitor logs, session duration
  stats, device breakdown, database latency ping, system health, and SEO audit checks.

## 2026-11-19  (portfolio.bat v1.2)

Changes src/data/content.js: no
Changes src/data/themes.js: no

- NEW Supabase database integration: installed @supabase/supabase-js and wired
  the storage adapter. When VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set
  in .env.local, the site saves to Supabase instead of localStorage.
- NEW Admin sign-in with Supabase Auth: after the passcode step, the admin now
  asks for email and password when a database adapter with signIn is connected.
  This enforces row-level security so only the owner can write.
- NEW src/data/adapters/supabase.js (copied from supabase.example.js).
- NEW .env.local (template, ignored by git) and .env.example (committed).
- Updated src/main.jsx: dynamically imports the Supabase adapter when env vars
  are present.
- Updated src/admin/Gate.jsx: two-step auth (passcode then Supabase sign-in).

Setup: see docs/DATABASE.md. Create a Supabase project, run the SQL, create
your owner account, disable sign-ups, fill in .env.local, and set the same
vars on Vercel.

## 2026-11-18  (portfolio.bat v1.1)

Changes src/data/content.js: YES. Choose N when you apply this update.
Changes src/data/themes.js: no

- NEW portfolio.bat: one file to start the site, open the admin, test on your phone,
  apply an update zip (with an automatic backup), build, push to GitHub,
  back up and restore.
- Journey now has your 10 categories (Extra-Curricular, Internship, Academy, Workshops,
  NCC, Sports, Social Activities, Projects, Technical Activities, Startup Entrepreneurship).
  Each page lists entries grouped by year, newest first. Entries with no extra text
  are plain rows, entries with text expand.
- Projects now has your 21 projects with description, status, category, live and GitHub links.
  New categories: Security, AI, Tools.
- NEW admin tab "Media": connect your Google Drive folder, upload photos and videos,
  and click "Choose from Drive" on any image or video field.
- NEW "Match files to cards": name Drive files after a card (ncc.jpg, ncc-2.jpg,
  aquasentinel-ai.png) and fill all matching covers with one click.
- NEW apps-script/Code.gs: the small Google Apps Script that lets the admin page
  write to your Drive folder. Setup steps: docs/DRIVE.md
- Admin: Journey entries have a new "Year" field.
- Journey pages hide the thumbnail strip when there is only one photo.

Setup you must do once for the Drive features: docs/DRIVE.md (about 5 minutes).
Your old browser edits are still saved in this browser. To see the new Journey and
Projects in the admin, open Data and security, then Reset content.

## 2026-11-13  (before portfolio.bat existed)

- Admin page at /admin, 13 themes you can customise, hero play button with an intro video.
