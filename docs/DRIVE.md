# Use your Google Drive folder for photos and videos

The admin page can list, upload and use the files in **one** Google Drive folder:

`https://drive.google.com/drive/folders/1C5igMVCHo-VL2wOEc0RPNtWpPyTivOiT`

Only the links are saved in your portfolio content. The files stay in Drive.

## Why there is a small script

A web page cannot add files to a folder you made yourself unless it asks for access to your **whole** Drive. So a tiny Google Apps Script does the upload for you. It runs under your Google account, it is hard-coded to this one folder, and it refuses every request that does not carry your secret admin key. You do not need a Google Cloud project or an API key.

## Set it up once (about 5 minutes)

1. Open **script.google.com** with the Google account that owns the folder (or has **Editor** access to it). Choose **New project** and name it `Portfolio media`.
2. Delete the sample code. Open `apps-script/Code.gs` from this project, copy everything, and paste it in. Check that `FOLDER_ID` near the top is your folder's ID (the long text after `/folders/` in the link). It is already filled in.
3. Click the **gear (Project Settings)** on the left. Under **Script properties** choose **Add script property**.
   - Property: `ADMIN_KEY`
   - Value: a long random password, 20 or more characters (a password manager can make one). The script refuses to work with fewer than 12.
   - **Save script properties.**
4. Click **Deploy → New deployment**. Click the gear next to "Select type" and choose **Web app**.
   - **Execute as:** Me
   - **Who has access:** Anyone
   - Press **Deploy**, then **Authorize access**. Google shows "Google hasn't verified this app". That is normal for your own script. Choose **Advanced → Go to Portfolio media (unsafe) → Allow**.
   - Copy the **Web app URL**. It ends with `/exec`.
5. Open the admin page, go to the **Media** tab, paste the URL and your key, and press **Connect**. Your folder's files appear.

"Anyone" only means anyone can *reach* the address. Without the right key every request is refused.

### Make the photos visible on your live site

Visitors' browsers load the photos straight from Drive, so the files must be viewable by link.

- Files you upload through the admin are set to **Anyone with the link can view** automatically.
- For files you put in the folder yourself: in Drive, right-click the folder → **Share → General access → Anyone with the link → Viewer**. The files inside inherit it.
- Do not keep private things (ID cards, certificates with numbers) in this folder. Anyone with the link can open what is in it.

## Using it

- **Media tab:** drop photos or videos to upload. Click a file to copy its link. Big photos are shrunk to 2000 px on the long side before they upload, so your site stays fast.
- **Any image or video field:** press **Choose from Drive**. You can also upload inside that window. If you upload one file there, it is used straight away.
- **Match files to cards:** name your Drive files after the card and the admin fills every empty cover in one click.

  | Card | Files that match |
  |---|---|
  | Journey "NCC" | `ncc.jpg` (cover), `ncc-2.jpg`, `ncc-3.jpg` (more photos on that page) |
  | Project "AquaSentinel-AI" | `aquasentinel-ai.png` or `AquaSentinel-AI.png` |
  | Project "Kart Zone" | `kart-zone.jpg` or `Kart Zone.jpg` |

  The exact names it looks for are listed under **File names it looks for** in the Media tab. It only fills cards that have no cover yet, and nothing changes until you press the button. Then press **Save**.

## Limits

- **20 MB per file.** Apps Script receives uploads as text, which is a third larger than the file. For a bigger video, upload it in Drive itself, wait for it to finish, then press **Refresh** in the admin and pick it.
- Types allowed: JPG, PNG, WebP, GIF, AVIF, MP4, WebM, MOV. SVG and HTML are refused on purpose.
- **Hero video from Drive** plays in Drive's own player, which cannot tell the page when it ends, so visitors press ✕ to go back to the photo. A direct `.mp4` file in `public/videos/` or a YouTube link returns by itself.
- **Traffic:** Google can slow down picture loading from Drive when a page gets very many visits. For a portfolio this is rarely a problem. Put the two or three most important images (hero photo, About photo) in `public/images/` instead.
- Google gives every account a daily limit on script runs. Normal admin use is far below it.

## Safety notes

- The admin **key** is stored in this browser only (until you close the tab, or until you tick **Remember on this device**). It is sent only to the script address you pasted. The page refuses any address that is not `script.google.com` or `localhost`.
- If the key leaks, anyone could upload allowed files into this one folder. They could not read the rest of your Drive through the script. **Change the key:** Project Settings → Script properties → edit `ADMIN_KEY`. It takes effect at once, no redeploy needed.
- Google's permission screen says the script can access your Drive files. That is how Apps Script works: the permission is broad, the code is not. `Code.gs` only ever opens the folder named at the top, and you can read the whole file (about 250 lines) before you trust it.
- The passcode on `/admin` and the Drive key keep casual visitors out. They are not full account security. See `docs/DATABASE.md` before you connect a shared database.

## If something goes wrong

| What you see | What to do |
|---|---|
| "Google did not answer with data" | The deployment is not open to "Anyone". Deploy → Manage deployments → pencil → Who has access: Anyone → Version: New version → Deploy. |
| "The admin key is not right" | The key in `ADMIN_KEY` and the one you typed differ. Copy it again. Check for a trailing space. |
| "Could not reach the script" | Wrong address, or no internet. The address must end with `/exec`. |
| You edited `Code.gs` but nothing changed | Saving is not enough. Deploy → Manage deployments → pencil → Version: **New version** → Deploy. |
| Upload works but the photo does not show on the site | The file is not shared. Share the folder as "Anyone with the link: Viewer". |
| "Uploaded, but Google would not make it public" | A Google Workspace (school or company) policy blocks public links. Use a personal Google account for this folder, or share the folder yourself. |


## Superbase integration : (MUST DO)

Automatic database keep-alive — free workaround
Best zero-cost workaround
You can configure an automated service to send real database requests several times a day.

For example:
Automated keep-alive architecture
GitHub Actions
Runs on a schedule
3 scheduled requests daily
Supabase REST API
Executes a lightweight read query

Database activity generated
Helps prevent inactivity pausing

Supabase itself says a few database requests per day are typically enough, but this is not guaranteed. 
Supabase Docs+1


How to implement it:

First, create a harmless keep-alive table in your Supabase SQL Editor:
CREATE TABLE public.keepalive (
    id INTEGER PRIMARY KEY CHECK (id = 1)
);

INSERT INTO public.keepalive (id)
VALUES (1)
ON CONFLICT DO NOTHING;

ALTER TABLE public.keepalive ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.keepalive TO anon;

CREATE POLICY "Allow keepalive read"
ON public.keepalive
FOR SELECT
TO anon
USING (true);


This exposes only a harmless read-only row through the anonymous API role.

Next, create this file in your GitHub repository:

.github/workflows/supabase-keepalive.yml
name: Supabase Keep Alive

on:
  schedule:
    - cron: "0 3,11,19 * * *"
  workflow_dispatch:

jobs:
  keepalive:
    runs-on: ubuntu-latest

    steps:
      - name: Send database request
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

        run: |
          curl --fail --silent --show-error \
            "$SUPABASE_URL/rest/v1/keepalive?id=eq.1&select=id" \
            -H "apikey: $SUPABASE_ANON_KEY" \
            -H "Authorization: Bearer $SUPABASE_ANON_KEY"


Add these two GitHub repository secrets:
- SUPABASE_URL
- SUPABASE_ANON_KEY
Use your project's URL and its anon/publishable API key. Never put your service_role or secret key in this workflow.

and also add it inside the database ;


-- ==========================================
-- SUPABASE DATABASE KEEP-ALIVE
-- Daily execution at 00:00 UTC
-- ==========================================

-- 1. Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron
WITH SCHEMA pg_catalog;


-- 2. Create keep_alive table
CREATE TABLE IF NOT EXISTS public.keep_alive (
    last_ping TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 3. Initialize the table
DELETE FROM public.keep_alive;

INSERT INTO public.keep_alive DEFAULT VALUES;


-- 4. Schedule the daily keep-alive job
-- Reusing this job name updates the existing job.

SELECT cron.schedule(
    'prevent_project_pause',
    '0 0 * * *',
    $$
        DELETE FROM public.keep_alive;

        INSERT INTO public.keep_alive DEFAULT VALUES;
    $$
);


What this does:
- Enables pg_cron.
- Creates a table called keep_alive.
- Inserts an initial timestamp.
- Schedules a job to execute every day at midnight UTC.
- Deletes the previous row and inserts a fresh timestamp.