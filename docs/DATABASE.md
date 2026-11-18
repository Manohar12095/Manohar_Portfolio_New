# Connecting a database later

Right now the admin saves into your browser (`localStorage`). That is fine while you are building, but other visitors and other devices only see the starting content from `src/data/content.js`.

When you are ready, you connect a database by swapping one small piece, the **storage adapter** (`src/data/store.js`). Nothing else in the site changes.

## What gets stored

One JSON document. It holds **only text and image or video links**. There are no file uploads.

```json
{
  "version": 1,
  "updatedAt": "2026-11-14T10:00:00.000Z",
  "content": { "site": {…}, "hero": {…}, "projects": { "items": […] }, … },
  "themes": { "activeId": "midnight", "custom": [ { "id": "my-theme", "colors": {…}, … } ] }
}
```

Open the admin, go to **Data & security** and press **Download backup** to see a real example.

Images and videos are stored as links, so host the files somewhere and paste the link in the admin:

| Kind | Good places to host it | Notes |
|---|---|---|
| Images | `public/images/` in this project, Supabase Storage (public bucket), Cloudinary, Google Drive | Google Drive share links work. The site converts them automatically. |
| Hero video | MP4 or WebM link, YouTube link, Google Drive link | MP4 on Supabase Storage or Cloudinary is the smoothest. YouTube also returns to the photo when it ends. Drive cannot tell the site when it ends, so visitors press ✕. |

## Security first (please read)

The admin passcode lives in the browser. It is good enough while the data is only in your own browser, because nobody else can change what other visitors see.

**The moment a shared database holds your content, the database itself must decide who can write.** Anyone can open developer tools and skip a browser-side passcode. So:

- Everyone may **read** the portfolio document (the public site needs it).
- Only **you** may **write**, enforced by the database with real sign-in.
- The public key in your site (`anon` key) is meant to be public. It is safe only because of those rules. Never put a `service_role` key or any secret in this project.

## Option A: Supabase (recommended, free tier is plenty)

### 1. Create the project

Make a free project at supabase.com. Note the **Project URL** and the **anon public key** (Project Settings → API).

### 2. Create the table and the rules

Open **SQL Editor**, paste this, and run it.

```sql
create table public.portfolio_documents (
  id         text primary key,
  data       jsonb       not null,
  updated_at timestamptz not null default now()
);

alter table public.portfolio_documents enable row level security;

-- everyone can read
create policy "public can read the portfolio"
  on public.portfolio_documents for select
  using (true);
```

You will add the **write** rules in step 4, after you know your user id.

### 3. Create your owner account

**Authentication → Users → Add user.** Use your email and a strong password. Turn **off** public sign-ups (Authentication → Sign In / Providers → "Allow new users to sign up" off) so nobody else can create an account.

Copy your user's **UID** from the users list.

### 4. Allow only your account to write

Replace `PASTE-YOUR-USER-UID-HERE` and run:

```sql
create policy "owner can insert"
  on public.portfolio_documents for insert to authenticated
  with check (auth.uid() = 'PASTE-YOUR-USER-UID-HERE');

create policy "owner can update"
  on public.portfolio_documents for update to authenticated
  using      (auth.uid() = 'PASTE-YOUR-USER-UID-HERE')
  with check (auth.uid() = 'PASTE-YOUR-USER-UID-HERE');

create policy "owner can delete"
  on public.portfolio_documents for delete to authenticated
  using (auth.uid() = 'PASTE-YOUR-USER-UID-HERE');
```

### 5. Add the keys to the site

```bash
npm install @supabase/supabase-js
cp src/data/adapters/supabase.example.js src/data/adapters/supabase.js
```

Create a file named `.env.local` in the project root (it is already ignored by git):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

On Vercel, add the same two names under **Project Settings → Environment Variables**.

In `src/main.jsx`, before `createRoot(...)`:

```js
import { setAdapter } from "./data/store";
import { createSupabaseAdapter } from "./data/adapters/supabase";

setAdapter(
  createSupabaseAdapter({
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  })
);
```

### 6. Add a real sign-in to the admin

`save()` in the adapter refuses to write unless you are signed in to Supabase. The simplest change is to extend `src/admin/Gate.jsx`: after the passcode step, if `getAdapter().signIn` exists, ask for your email and password and call `adapter.signIn(email, password)`. When that works, call `onUnlock()`.

You can keep the passcode as a quick extra step, but the database rules are the real protection.

### 7. Load your current content into the database

Sign in to the admin, open **Data & security**, and use **Restore from a backup** to import the backup you downloaded earlier, then press **Save**. The first save creates the row.

## Option B: any other database (Firebase, MongoDB, your own API)

Write an object with these functions and pass it to `setAdapter(...)`:

```js
{
  name: "My database",
  async load()     { /* return the saved document, or null if none yet */ },
  async save(doc)  { /* store the document; throw an Error if it fails */ },
  async reset()    { /* optional: delete the stored document */ },
}
```

A normal table with one row (or one Firestore document) is enough. If you would rather have one table per section (projects, skills, …), split `doc.content` in `save` and rebuild it in `load`. The site repairs missing or wrong-shaped data itself, so a partly empty document will not break the page.

## Good to know

- **First paint.** With a database the site waits a moment for the saved content before drawing. With browser storage it is instant.
- **If loading fails** (for example no internet), the site shows the starting content and the admin shows an error. Do not press Save in that state, because it would replace your stored content.
- **Backups.** Download a backup from **Data & security** before big edits. It is a plain `.json` file.
- **Do not store private details** (phone numbers you do not want public, passwords, API keys). Everything in the document is readable by every visitor.
