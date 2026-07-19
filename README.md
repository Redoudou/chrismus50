# chrismus50 — 50th Anniversary Memory Collection

**Live site: https://redoudou.github.io/chrismus50/** — share this link with
family. Nothing else is needed on their side: no account, no login, no app.

A private, one-page website (in French) where friends and family contribute to
Chris & Mus's 50th wedding anniversary (September 12, 2026, Paris) in any
combination of three ways — photos, a written memory, and a video message
recorded right in the browser. Everything sent together counts as one
contribution, confirmed by a single thank-you message.

## How it works (deployed and verified)

```
Family's phone/computer
        │  (the web page, hosted free on GitHub Pages)
        ▼
Google Apps Script web app  ("chrismus50vf", runs as the dedicated account)
        │
        ▼
Google Drive folder "chrismus50"   ← owned by redoudou@gmail.com
├── 📷 Photos/                       Prénom — 1.jpg, Prénom — 2.jpg …
├── 🎥 Vidéos/                       Message de Prénom.mp4 …
├── 📒 Journal des contributions     Sheet: date, prénom, message, nb photos, vidéo
└── _technique — ne pas toucher/     in-flight video pieces, auto-cleaned
```

- **[index.html](index.html)** — the entire site. The backend URL is set in
  `APPS_SCRIPT_URL` near the top of its script section.
- **[apps-script/Code.gs](apps-script/Code.gs)** + **[appsscript.json](apps-script/appsscript.json)**
  — reference copy of the deployed backend.
- Photos/videos are stored under the dedicated account's quota (15 GB, empty
  otherwise) but live inside the `chrismus50` folder in redoudou's Drive,
  which is shared **Restricted** — only the two accounts can see it.

## Accounts & access

| Thing | Where | Access |
|---|---|---|
| Live site | https://redoudou.github.io/chrismus50/ | public link (noindex) |
| GitHub repo | https://github.com/Redoudou/chrismus50 | owner: Redoudou |
| Backend script `chrismus50vf` | Apps Script, dedicated account | owner: hellokader…, editor: redoudou |
| Drive folder `chrismus50` | redoudou's My Drive | owner: redoudou, editor: hellokader…, Restricted |

Direct links to the backend (they force the right account, avoiding Google's
"unable to open the file" multi-account error):

- as owner: `https://script.google.com/home/projects/1bDTne3afjv6z5wAqRrtK-CM6xTy8mbBnOjWWcpyTATAYtL7Dmfdeo2sa/edit?authuser=hellokaderkaderalgerie@gmail.com`
- as editor: same URL with `?authuser=redoudou@gmail.com`

## Changing the site (wording, dates, names)

All visitor-facing text lives in `index.html` in plain HTML — the welcome
message, the year badge (`1976 · 2026`), field labels, thank-you message.
Edit, commit, push: GitHub Pages republishes automatically in about a minute.
The backend does not need touching for text changes.

**Changing the backend** (rare): edit the code in the Apps Script editor
(either account), then **Deploy → Manage deployments → ✏️ → Version: New
version → Deploy**. The URL stays the same. Never create a *new* deployment —
that would mint a different URL and run as whoever created it.

## Good to know

- **Reliability:** uploads go one item at a time with automatic retries; a
  dropped connection never loses what was already sent, never duplicates
  anything, and the log row is written once, at the end. Double-clicking
  Send cannot create duplicate submissions.
- **Limits:** 20 photos per submission, 25 MB per photo (iPhone HEIC fine).
  Video recording auto-stops at 2 minutes; picked video files up to 50 MB.
  Any combination works — a written memory alone is welcome.
- **Video recording:** browser-native (iPhone/Android/desktop). Visitors can
  preview, re-record, or remove before sending; if the camera is refused, the
  page offers picking an existing video. Videos travel in ~3 MB pieces and are
  reassembled server-side.
- **Free quota:** hundreds of photos a day fit comfortably in Google's free
  limits.

## Previewing locally

Open `index.html` from disk (or any localhost server) — without touching
`APPS_SCRIPT_URL` it detects local use and runs in preview mode where
submissions pretend to succeed, letting you rehearse the whole flow without
writing anything to Drive. The live site always uses the real backend.
