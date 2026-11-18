# Antigravity prompts for this project

Open the project folder in Antigravity, then paste these one at a time, in order. Each one names the slash command or skill to use. If one of them is not in your `/` menu, delete that line and paste the rest.

New in this version: an **admin page** (`/admin`), **13 themes** you can customize, a **play button** in the hero that plays a video inside the photo, your **Journey and Projects** content, a **Google Drive media library** in the admin, and **`portfolio.bat`** to run and update everything on Windows. Everything is saved through one adapter file, so connecting a database later is a small change.

Start the site first: double-click `portfolio.bat` and choose **2** (or run `npm install` then `npm run dev`). Open `http://localhost:5173/admin` and create your passcode.

---

## 1. Understand and plan first

```
/plan
This is a React + Vite + Three.js 3D portfolio for S. Manohar with an admin page at /admin.
Read README.md, docs/DATABASE.md, src/data/content.js, src/data/themes.js and src/admin/schemas.js first.
Do not change any code yet. Give me a short plan to (a) replace every [placeholder] with real content,
(b) add real images and an intro video, (c) deploy to Vercel, (d) connect a database later.
List what you need from me, in order.
```

## 2. Collect your real content (without clicking through every field)

The admin can import a backup file. So let Antigravity prepare one, then import it.

```
/grill-me
Ask me one question at a time to collect the real content for my portfolio: experience dates, my remaining
projects (name, one-line description, tech, live link, GitHub link), NCC / hackathon / marathon details,
skills, and contact details (use YOUR_EMAIL@example.com until I give a public email I am happy to show).
After each answer, update a file called my-content.json in the project root.
The file must have the same shape as the backup from the admin (Data & security -> Download backup):
{ "version": 1, "content": { ... same keys as defaultContent in src/data/content.js ... }, "themes": { "activeId": "sky", "custom": [] } }
Keep the [bracket] style for anything I have not answered yet. Never add my college ID or register number.
```

Then in the admin: **Data & security → Restore from a backup → Choose backup file**, look at the site, and press **Save**.

## 3. Make the images

```
imagegen-frontend-web
Create cover images for my projects listed in src/data/content.js (16:10, no text inside the image, a style
that matches my current theme). Save them as public/images/projects/<slug>.jpg using the exact slugs from
content.js. Start with ende-coder, cat-escape, in-net-calendar and in-net-web-seeker.
```

For the **hero intro video**, record a 10 to 20 second clip on your phone (portrait). Export it as MP4, save it as `public/videos/intro.mp4`, then in the admin open **Hero → Intro video** and set it to `/videos/intro.mp4`. Keep it under 15 MB.

## 4. Polish the public site (only if you want changes)

```
design-taste-frontend
Review the running site (npm run dev) section by section. The colours come from CSS variables set by the
theme system (src/data/themes.js), so do not hard-code colours. Suggest and apply small improvements to spacing,
type scale and contrast. Do NOT change src/components/SceneBackground.jsx, src/admin/, or src/data/store.js.
Check it in the Sky, Midnight and Classic themes.
```

```
minimalist-ui
Simplify the Projects and Journey card styling so they feel calmer, without removing the 3D tilt, the filters,
or the theme variables. Keep all content coming from the content context (useContent), not from hard-coded text.
```

## 5. Turn your brand into a theme

```
brandkit
Create a small brand kit for "Manohar." (monogram SM) and the favicon (public/favicon.svg) and Open Graph image.
Then add ONE new preset to PRESET_THEMES in src/data/themes.js that uses the brand colours, two Google Fonts and
the same fields as the other presets. Check text contrast is at least 4.5:1 for ink on the page background.
```

## 6. Connect a database (do this when you are ready)

```
/plan
Read docs/DATABASE.md and src/data/adapters/supabase.example.js. Plan how to connect Supabase to this portfolio
using the storage adapter in src/data/store.js. The database must store only text and image/video links.
Plan the admin sign-in with Supabase Auth (email + password) and row level security so that ONLY my user can write
and everyone can read. List the steps I must do in the Supabase dashboard and what you will change in the code.
```

```
/ralph-loop
Follow the plan. Install @supabase/supabase-js, copy supabase.example.js to src/data/adapters/supabase.js,
read VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local, call setAdapter in src/main.jsx,
and extend src/admin/Gate.jsx so that after the passcode step it signs in with Supabase using adapter.signIn.
Never put a service_role key anywhere in the project. Run npm run build and fix errors until it passes.
```

```
agency-security-engineer
(Use your closest agency-* security or backend agent if that exact name is not in your list.)
Review the Supabase setup in this project: the SQL policies in docs/DATABASE.md, the admin sign-in flow,
and the adapter. Confirm that a visitor who bypasses the browser passcode still cannot write to the database,
that sign-ups are disabled, and that no secret key is in the repository. Report any problem and fix it.
```

## 7. Put your edits on the live site before you have a database

```
/plan
I downloaded a backup from the admin (Data & security -> Download backup) called portfolio-backup.json.
Plan how to move its content into src/data/content.js, and its active theme into DEFAULT_THEME_ID (or a copied
custom theme added to PRESET_THEMES) in src/data/themes.js, so the deployed site shows it for everyone.
Do not change src/admin/ or the storage adapter.
```

## 8. Final check before deploying

```
/ralph-loop
Run npm run build. If it fails, fix the error and run it again until it passes.
Then check these at 390px, 768px and 1440px wide: /, /journey/ncc, and /admin (create a passcode, edit a field,
Save, open Themes, switch to Midnight, press the hero play button and let the video finish).
Look for horizontal scrolling, overlapping text, text that is hard to read, and console errors. Report what you fixed.
```

## 9. Keep `portfolio.bat` and the changelog in step with every change

Paste this once at the start of any Antigravity session on this project.

```
/plan
Read portfolio.bat, CHANGELOG.md and package.json.
From now on, whenever a change affects how the project is installed, started, built, tested or deployed
(a new npm script, a new .env variable, a new folder that must not be overwritten, a new menu step),
also (a) update portfolio.bat, (b) bump BAT_VERSION and BAT_DATE at the top of portfolio.bat, and
(c) add an entry at the TOP of CHANGELOG.md that says whether src/data/content.js or src/data/themes.js changed.
portfolio.bat must stay ASCII only with Windows (CRLF) line endings, must use "call npm", and must not use ( ) blocks around paths.
Confirm you understand, then wait for my next request.
```

## 10. Name your Drive files so the admin can place them

```
/plan
Look at src/data/content.js and list every Journey card slug and every Project slug with its title.
Make me a table: card, the Drive file names that Media -> "Match files to cards" will recognise
(slug.jpg for the cover, slug-2.jpg and slug-3.jpg for more photos on a Journey page).
Do not edit any file.
```

---

### Tips

- Tell Antigravity "only edit `src/data/content.js`" whenever you are only changing text. It keeps the 3D and admin code safe.
- Download a backup from **Data & security** before any big change. `portfolio.bat` option 7 backs up the project files themselves.
- If the 3D scene feels slow on your laptop, lower `shapeCountDesktop` and `particles` in the `CONFIG` block of `SceneBackground.jsx`, or turn off the 3D shapes in your theme.
- The admin passcode is a convenience, not real security. Before a shared database holds your content, do step 6.
