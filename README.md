# chrismus50 — 50th Anniversary Memory Collection

A private, one-page website (in French) where friends and family contribute to
Chris & Mus's 50th wedding anniversary (September 12, 2026, Paris) in any
combination of three ways — photos, a written memory, and a video message
recorded right in the browser. No accounts, no logins, no app to install —
visitors open the link, add their name, contribute what they like, and tap
**Envoyer**. Everything sent together is stored as one submission.

## How it's put together

- **[index.html](index.html)** — the whole site, hosted on **GitHub Pages**.
- **[apps-script/Code.gs](apps-script/Code.gs)** — the backend, a **Google
  Apps Script web app** running under your Google account. The page sends
  submissions to it with `fetch`; it stores photos/videos in your Drive folder
  and logs each submission in a Google Sheet. No servers, no hosting bills.
- **Runs in a dedicated Google account** created just for the anniversary.
  The one-time authorization grants the script access to that account's Drive —
  which contains nothing but this collection, so the permission is effectively
  scoped to the project. It creates its storage folder automatically on the
  first submission.
- Storage is organized **by type**, so everything is ready to use afterwards —
  one folder to select all photos for a slideshow, one folder that is already a
  playlist of video messages, one Sheet with every written memory:

  ```
  Souvenirs — 50 ans Chris & Mus/
  ├── 📷 Photos/                      Leïla — 1.jpg, Leïla — 2.jpg, Karim — 1.jpg…
  ├── 🎥 Vidéos/                      Message de Leïla.mp4, Message de Karim.mp4…
  ├── 📒 Journal des contributions    (Sheet: date, prénom, message, counts)
  └── _technique — ne pas toucher/    in-flight video chunks, auto-cleaned
  ```

  Filenames carry the contributor's name, so sorting by name groups each
  person's photos together. Everything is created automatically on the first
  submission.

## Backend setup (about 5 minutes, one time)

0. Create the dedicated free Google account (e.g. `chrismus50.famille@gmail.com`)
   at [accounts.google.com/signup](https://accounts.google.com/signup) — 5 minutes,
   no phone number usually required.
1. While signed in to **that** account, open **[script.new](https://script.new)** —
   this creates a blank Apps Script project.
2. Name the project (click *"Untitled project"* at the top): `chrismus50`.
3. In the editor, select everything in the `Code.gs` file and replace it with
   the contents of [apps-script/Code.gs](apps-script/Code.gs). Save (⌘S).
4. Open **Project Settings** (gear icon) → check **"Show 'appsscript.json'
   manifest file in editor"** → back in the editor, open `appsscript.json` and
   replace its contents with
   [apps-script/appsscript.json](apps-script/appsscript.json). Save. (This
   presets the Paris timezone and the web-app access settings so the deploy
   dialog can't be misconfigured.)
5. Click **Deploy → New deployment**. Click the gear next to *Select type* and
   choose **Web app**. Confirm:
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`  ← important: this is what lets family
     contribute *without* signing in to Google.
6. Click **Deploy**, then **Authorize access** and approve (Google shows a
   "unverified app" warning — click *Advanced → Go to chrismus50 (unsafe) →
   Allow*; the access covers only the dedicated account's Drive).
7. Copy the **Web app URL** (ends in `/exec`).
8. Paste that URL into `index.html`, in the line near the top of the script:
   `var APPS_SCRIPT_URL = '';` → `var APPS_SCRIPT_URL = 'https://script.google.com/…/exec';`
9. Commit and push — GitHub Pages redeploys automatically in a minute.

Until step 8 is done, the live site shows a friendly "en préparation" notice
and the submit button is disabled, so nobody can send memories into the void.

### Try it first

Open the site, submit a test photo/memory/video, and check that the subfolder
and log sheet appeared in your Drive. Delete the test row/folder if you like.

## How access works

The deployed Apps Script runs *as the dedicated account* (that's the one-time
authorization at deploy). Contributors never need — and never get — any Drive
access; the only link you share with family is the website URL. To see the
collection from your everyday account, share the "Souvenirs" folder from the
dedicated account with it (right-click → Share) after the first submission.

## Customizing the wording

All visitor-facing text lives in `index.html` in plain HTML near the top —
the welcome message ("Nous préparons une surprise…"), the year badge
(`1976 · 2026`), field labels, and the thank-you message. Edit freely;
no code knowledge needed. Push to publish.

**To update the backend** after editing `Code.gs`: in the Apps Script editor,
**Deploy → Manage deployments → ✏️ (edit) → Version: New version → Deploy**.
The URL stays the same.

## Good to know

- **Reliability:** photos upload one at a time with automatic retries. If a
  connection drops mid-submission, the visitor just taps Send again — content
  that already went through is not re-sent, and everything stays in one folder.
  The log row is written once, after everything is safely stored.
- **Limits:** up to 20 photos per submission, 25 MB per photo (plenty for phone
  photos, including iPhone HEIC). Video recordings auto-stop at 2 minutes; a
  video picked from the device can be up to 50 MB. Any combination works —
  including a written memory alone, or a video alone.
- **Video recording:** uses the browser's built-in recorder (works on iPhone/
  Android/desktop in current browsers; the visitor grants camera & mic access
  when they tap record). They can preview, re-record, or remove the video
  before sending. If the camera is unavailable or access is declined, the page
  offers picking an existing video instead. Videos upload in ~3 MB chunks with
  retries — the server reassembles them into a single file in the submission
  folder, so large videos survive shaky connections.
- **Privacy:** the page asks search engines not to index it (`noindex`), and
  only people with the link will realistically find it. Photos are visible
  only to your Google account.
- **Free quota:** Google allows plenty of daily uploads for a family project;
  hundreds of photos a day is not a problem.

## Previewing locally

Open `index.html` in any browser (double-click the file). Without the backend
it runs in preview mode: submissions pretend to succeed so you can feel the
whole flow (form → progress → thank-you) before deploying.
