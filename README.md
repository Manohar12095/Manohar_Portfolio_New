# Manohar: 3D Portfolio with an Admin Panel

A 3D portfolio built with **React + Vite + Three.js**. A WebGL scene sits behind the page, and the hero photo has a small play button that swaps the photo for a short intro video. You edit everything from a built-in **admin page** (`/admin`), pick from **13 themes**, and design your own.

## Run it (Windows): `portfolio.bat`

Double-click **`portfolio.bat`**. It shows a menu:

| Key | What it does |
|---|---|
| 1 | Starts the site and opens it in your browser. It installs the packages the first time, and again whenever `package.json` changes. |
| 2 | Same, but opens the admin page. |
| 3 | Same, but also on your Wi-Fi so you can open it on your phone (use the Network address it prints). |
| 4 | **Applies an update zip from Claude.** It backs up first, never overwrites your photos and videos, and asks if you want to keep your own text and theme settings. You can also drag the zip onto `portfolio.bat`. |
| 5 | Builds the final site (`dist`) and offers to preview it. |
| 6 | Saves your changes with Git and pushes to GitHub, so Vercel publishes them. |
| 7 / 8 | Back up now / restore a backup (backups live in `_backups`; delete old ones whenever you like). |
| 9 | Fixes most "it won't start" problems by reinstalling the packages. |
| N | Shows what changed in each version (`CHANGELOG.md`). |

You need **Node.js 18 or newer** (https://nodejs.org). Option 6 needs **Git**. Every time the project changes how it runs, `portfolio.bat` and `CHANGELOG.md` are updated together. The version is shown in the menu header.

### Or by hand

```bash
npm install        # downloads everything (once)
npm run dev        # starts the site at http://localhost:5173
```

- Portfolio: `http://localhost:5173/`
- Admin: `http://localhost:5173/admin`

```bash
npm run build      # makes the production site in /dist
npm run preview    # test the production build locally
```

## The admin page (`/admin`)

The first time you open it, you create a passcode (8+ characters). After that you sign in with it. The session locks after 30 idle minutes.

| Tab | What you can do |
|---|---|
| General | Name, logo letters, role, links, resume link, page title and search description |
| Sections | Show or hide sections, rename the menu items, change the order |
| Hero | Headline, intro, photo, **intro video link**, badge, chips, floating tags |
| About, Journey, Experience, Projects, Skills, Achievements, Contact | Add, edit, duplicate, reorder and delete every card and list item |
| Media | Connect your Google Drive folder, upload photos and videos, and fill empty covers from file names. See below. |
| Themes | Pick a theme, or create and edit your own (colours, fonts, corner roundness, 3D shapes) with a live preview and readability check |
| Data & security | Download a backup, restore one, reset, change passcode |

How saving works:

1. Changes show on the site straight away in this browser, so you can click **View site** to preview them.
2. Press **Save** (or Ctrl+S) to keep them. **Discard** goes back to the last saved version.
3. Leaving with unsaved work asks you first.

### Important: what the passcode does and does not protect

- Your edits are saved **in this browser only** (browser storage) until you connect a database. Other visitors see the content from `src/data/content.js` and the default theme (`DEFAULT_THEME_ID` in `src/data/themes.js`, currently Sky). That is by design for now, and it means nobody can change your live site by visiting `/admin`.
- The passcode is checked in the browser. It keeps casual visitors out of the screen but is **not real account security**. Anyone technical can bypass a browser-side check.
- Before you connect a shared database, add real sign-in and server-side write rules. `docs/DATABASE.md` walks through it step by step.
- To make the **live site** show your edits for everyone before you have a database: **Data & security → Download backup**, then move the values into `src/data/content.js` (and `DEFAULT_THEME_ID` or a copied theme in `src/data/themes.js`) and redeploy. `ANTIGRAVITY_PROMPTS.md` has a prompt that does this for you.

## Photos and videos in Google Drive

The **Media** tab connects the admin to one Drive folder. You can upload files there, and every image or video field has a **Choose from Drive** button. Only the links are stored in your content. One-time setup (about 5 minutes) is in **`docs/DRIVE.md`**; the small script it uses is `apps-script/Code.gs`.

Name Drive files after a card (`ncc.jpg`, `ncc-2.jpg`, `aquasentinel-ai.png`) and **Match files to cards** fills all the empty covers at once.

## Journey and Projects

- **Journey** has 10 categories. Each page lists its entries grouped by year, newest first. An entry with no extra text is a plain row; an entry with text expands. In the admin every entry has a **Year** field.
- **Projects** are filtered by category (Security, AI, Tools, Web, Mobile) and status (live, in progress, complete).
- If you saved edits in the admin before this version, your browser still shows your older content. Open **Data & security → Reset content** to see the new Journey and Projects.

## Themes

13 built-in themes: Sky, Professional, Classic, Midnight, Graphite, Forest, Sunset, Ocean, Royal, Paper Mono, Rose, Neon Night and Sand. Built-in themes cannot be edited, but **Customize a copy** makes one you can change freely. Each theme controls colours, the three fonts (any Google Font name), corner roundness, pill or rounded buttons, and the 3D background (on or off, how many shapes, their colours).

Your theme choice is saved in this browser. To change the theme **all visitors** see today, change `DEFAULT_THEME_ID` in `src/data/themes.js` (a custom theme can be copied there from a backup). Once a database is connected, the choice you Save in the admin applies to everyone.

## The hero play button

A small round ▶ button sits in the corner of the photo card. When someone presses it, the video plays **inside the same frame**. When the video ends, or when they press ✕ or Escape, the photo comes back.

Set the video in **Hero → Intro video**. It accepts:

- a file in this project, for example `/videos/intro.webm` or `/videos/intro.mp4`
- a direct `.mp4` / `.webm` link
- a YouTube link (returns to the photo when it ends)
- a Google Drive share link (set sharing to "Anyone with the link"; Drive cannot signal the end, so visitors press ✕)

Leave it empty to hide the button. A short 4 second placeholder (`public/videos/intro.webm`) is included so you can see it work.

## Where files go

| Placeholder | Put your file here (or paste any https:// link in the admin) |
|---|---|
| Hero portrait (4:5, about 1200×1500) | `public/images/profile.jpg` |
| About photo (3:4) | `public/images/about.jpg` |
| Hero intro video | `public/videos/intro.mp4` (then set the link to `/videos/intro.mp4`) |
| Resume | `public/resume/Manohar_Resume.pdf` (a dummy PDF is there now) |
| Journey card cover + gallery photos | `public/images/journey/` |
| Project cover images (16:10) | `public/images/projects/<project-slug>.jpg` |
| Achievement reel videos | `public/videos/reel-*.mp4` (short MP4, under 15 MB each) |
| Reel poster images | `public/images/reels/*.jpg` |

Google Drive image links also work. Paste the normal share link and the site converts it (or use the Media tab). A missing image shows a labelled box, and in `npm run dev` the box prints the exact path it expects.

Other placeholders to replace (in the admin, or in `src/data/content.js`):

- `socials.linkedin` and `contact.email`: values starting with `YOUR_`. The contact form opens the visitor's email app until you set a form endpoint (a free Formspree or Web3Forms `https://` URL).
- Project links: leave empty to hide a button. Cards with no links show "Links coming soon".
- Journey cards and project covers are empty until you pick a Drive image or add a file. The page shows a labelled box meanwhile.
- Every Journey card gets its own page at `/journey/<slug>`.

## Connecting a database later

The site saves through a small **storage adapter** (`src/data/store.js`). It stores only text and image or video links, as one JSON document. Swapping browser storage for a database changes one file and no screens. See `docs/DATABASE.md` for a Supabase setup (table, security rules, keys) and the shape for any other database.

## Where things live

| I want to change… | Edit this |
|---|---|
| Starting content (what a new visitor or a reset shows) | `src/data/content.js` |
| Add or change built-in themes | `src/data/themes.js` |
| What the admin lets you edit | `src/admin/schemas.js` |
| 3D scene feel (speed, number of shapes) | `CONFIG` block at the top of `src/components/SceneBackground.jsx` |
| Page title, description, share preview | `index.html` (and General tab for search description) |
| How the project runs and updates on Windows | `portfolio.bat` and `CHANGELOG.md` |
| Google Drive uploader | `apps-script/Code.gs`, `src/admin/drive.js`, `src/admin/MediaLibrary.jsx` |

## Deploy to Vercel

1. Push this folder to GitHub.
2. In Vercel choose **Add New → Project**, import the repo. Settings are detected automatically (Vite).
3. `vercel.json` already makes `/admin` and `/journey/...` work when refreshed.

## Good to know

- **Performance:** the admin is a separate file that visitors never download. The 3D canvas is capped at 1.5× pixel ratio, uses fewer shapes on phones, and is skipped if WebGL is unavailable.
- **Accessibility:** keyboard-friendly menus, visible focus rings, skip links, readable contrast checks in the theme editor, and `prefers-reduced-motion` turns off spinning, tilting and the 3D drift.
- **Safe links:** links are checked before use, so `javascript:` and similar addresses are ignored. Colours and font names are checked too, so a bad value cannot break the page.
- **Privacy:** this project contains no email address and no college ID. Add only what you want public. Anything in a link-shared Drive folder can be opened by anyone with the link.
