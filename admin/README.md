# MY.CAFÉ Admin

A separate admin app for the MY.CAFÉ website. The café owner logs in here to:

- **Menu** — change prices (right on each card), edit descriptions and photos, add or delete dishes, reorder them
- **Gallery** — upload new photos (drag & drop, many at once), edit captions, delete, reorder
- **FAQs** — add, edit, delete and reorder questions and answers
- **Home / About / Contact** — testimonials, timeline, promises, team, coffee origins, address, phone, email and opening hours
- **Menu page extras** — pairing guide and "beans to take home" roast cards

It has the same look as the public site (dark + light theme with the sun/moon toggle, same fonts, cards and tab order: Home → Menu → Gallery → FAQs → About → Contact).

Nothing goes live until the owner presses **Publish changes**.

---

## How it fits together

```
┌──────────────┐   edit & Publish    ┌────────────────────────────┐   GET /api/content   ┌──────────────────┐
│  Owner's     │ ──────────────────▶ │  Admin server  (this app)  │ ◀─────────────────── │  Public website  │
│  browser     │   (password login)  │  content.json + /uploads   │   (anyone, read-only)│  (the Vite site) │
└──────────────┘                     └────────────────────────────┘                      └──────────────────┘
```

- The **admin server** stores everything in one `content.json` file plus an `uploads/` folder (both inside `DATA_DIR`).
- The **public website** reads `GET /api/content` every time a page loads. If the admin server is unreachable it falls back to the last copy saved in the visitor's browser, and finally to the content bundled inside the site — so the website never goes blank.
- You can host the two **separately** (that is the point): the website on Netlify / Vercel / GitHub Pages, the admin on any Node host.

---

## Run it on your computer

**Easiest — from the project root, one command starts the admin *and* the website:**

```bash
npm run dev:all
```

- Admin → <http://localhost:4000> (log in with **`admin123`**, the default)
- Website → <http://localhost:5173>

Edit a price in the admin → press **Publish changes** → refresh the website → the new price is there. The first run installs this folder's packages automatically.

**Admin only** (from the project root: `npm run admin`, or from this folder):

```bash
cd admin
npm install     # once
npm start
```

**Settings on localhost**: create `admin/.env` (copy `.env.example`) — it is read automatically on start, no extra command needed. Typical use: `ADMIN_PASSWORD=my-own-password`. Real environment variables, if set, win over the file.

Your content lives in `admin/data/` (git-ignored): `content.json`, `uploads/` and `backups/`.

The website is already pointed at this server in development (`VITE_CONTENT_URL` in `.env.development` at the project root). If you run the admin on another port, change that address too and restart the website.

---

## Using the admin

| You want to… | Do this |
| --- | --- |
| Change a price | **Menu** tab → type in the ₹ box on the dish's card → **Publish changes** |
| Edit a dish's name / photo / description | Click the pencil on its card |
| Add a dish | **+ Add a dish** card at the end of the grid. Tick **Show on Home page** to feature it in "Signature picks" |
| Delete a dish / photo / question | Click the ✕ → confirm. A toast gives you **Undo** for a few seconds |
| Add gallery photos | **Gallery** tab → drop image files on the dashed box (or **Choose photos**), then use ✎ to write a caption |
| Reorder | Use the arrow buttons. The order in the admin is the order on the website |
| Add a question | **FAQs** tab → **+ Add question** |
| Change opening hours | **Contact** tab → Opening hours. This also controls the live "Open now" badge and the time slots in the reservation form |
| Undo everything since the last publish | **Discard** (top bar) |
| Keep a copy | **Download backup (JSON)** in the footer |

Good to know:

- **Ctrl/Cmd + S** publishes.
- The browser warns you if you try to leave with unpublished changes.
- A red message appears at publish time if something is invalid (for example an empty required field or a bad email) — nothing is published until it is fixed.
- If two people edit at the same time, the second to publish is asked to reload (so nobody silently overwrites the other).
- Photos: JPG, PNG, WebP, GIF or AVIF, up to 6 MB each. You can also paste a link to an image hosted elsewhere.
- Categories (Hot Brews / Cold Bar / …) and tile shapes are fixed lists; see "Customising" below to change them.

---

## Hosting it later (optional — not needed for localhost)

The admin needs a host that can run **Node.js 20.6+** and keep files on a **persistent disk** (the content and uploads live on disk).

> ⚠ **Free tiers that wipe the disk on every restart (e.g. a plain free Render web service) will lose your edits and uploaded photos.** Attach a persistent disk/volume, or use a small VPS.

### 1. Set the environment variables

| Variable | Required | What it does |
| --- | --- | --- |
| `ADMIN_PASSWORD` | **Yes** | Admin password. Without it the server uses `admin123` and prints a warning. |
| `DATA_DIR` | Yes when hosting | Folder for `content.json`, `uploads/`, `backups/`. Point it at the persistent disk, e.g. `/var/data`. |
| `ALLOWED_ORIGINS` | Recommended | Websites allowed to read `/api/content`, comma-separated. Default `*` (any). Example: `https://mycafe.in,https://www.mycafe.in` |
| `SITE_URL` | Optional | Your website's address; adds a "View site" button. |
| `TRUST_PROXY` | If behind a proxy | Set to `1` on Render / Railway / Nginx / Cloudflare so client IPs and `https` are detected correctly. |
| `PUBLIC_URL` | Optional | This admin server's public address, if uploaded-image links come out wrong. |
| `SESSION_SECRET` | Optional | Secret for login tokens. A random one is generated and saved in `DATA_DIR` if you don't set it. |
| `PORT` | Optional | Default `4000`. Most hosts set this for you. |

Locally you can put these in `admin/.env` (copy `.env.example`); it is read automatically by `npm start`.

### 2. Deploy

**Render** — New → Web Service → connect the repo → *Root Directory:* `admin` → *Build:* `npm install` → *Start:* `npm start`. Add a **Disk** (mount path `/var/data`), set `DATA_DIR=/var/data`, `ADMIN_PASSWORD`, `TRUST_PROXY=1`.

**Railway / Fly.io** — Same idea: root directory `admin`, start command `npm start`, add a volume and set `DATA_DIR` to its mount path.

**VPS (DigitalOcean, Hetzner, …)** —

```bash
git clone <your repo> && cd MyCafe/admin && npm install --omit=dev
ADMIN_PASSWORD='long-secret' DATA_DIR=/var/mycafe TRUST_PROXY=1 PORT=4000 npx pm2 start server.js --name mycafe-admin
```

then put Nginx or Caddy in front for HTTPS (**always use HTTPS** — the password travels over the network).

### 3. Point the website at it

On the public website's host (Netlify, Vercel…) set this environment variable **before building**:

```
VITE_CONTENT_URL=https://your-admin-server.example.com/api/content
```

Then rebuild/redeploy the website once. After that, edits made in the admin appear on the website without rebuilding — the site fetches the content when each page loads.

(Locally: copy `.env.example` in the project root to `.env.production`.)

---

## Security notes

- Login is a single shared password, compared in constant time, with a limit of 8 wrong attempts per 15 minutes per IP. Sessions last 12 hours and use signed tokens kept in `sessionStorage` (cleared when the tab closes).
- Everything is validated again **on the server** — field lengths, numbers, allowed choices, and image addresses (only `https://…` or uploaded files; `javascript:` and friends are rejected). Unknown fields are dropped.
- Uploads are checked by their real file signature, not the file name, and saved under random names. Uploaded files that are no longer used are cleaned up after a day.
- The admin page is served with a strict Content-Security-Policy and cannot be framed.
- The public endpoint is read-only. Nothing on it can change content.
- Use a long `ADMIN_PASSWORD`, serve over HTTPS, and set `ALLOWED_ORIGINS` to your real site.

---

## Backups & restoring

Each Publish first copies the previous `content.json` into `DATA_DIR/backups/` (the latest 20 are kept). To restore one, stop the server, copy the backup over `DATA_DIR/content.json`, and start it again. (Any admin tab that was open will be told to reload, so nobody overwrites the restored version by accident.) You can also use **Download backup (JSON)** in the admin footer to keep a copy of the current content.

To reset to the original starting content, delete `DATA_DIR/content.json` and restart — it is recreated from `seed/content.json`. To regenerate that seed from the website's bundled content, run `npm run seed`.

---

## Customising

Everything the admin can edit is described in **one file**: [`public/schema.js`](public/schema.js). It is shared by the admin screens *and* the server's validation.

- **Change what a field looks like** (label, max length, required, hint): edit its entry in `COLLECTIONS`.
- **Add a field** (e.g. `calories` on dishes): add `{ key: 'calories', type: 'number', label: 'Calories', min: 0, max: 5000 }` to `COLLECTIONS.menu.fields`, then use `item.calories` on the website (for example in `src/js/components/dish-card.js`).
- **Change the category lists**: edit `MENU_CATEGORIES`, `GALLERY_CATEGORIES`, `FAQ_CATEGORIES`. Keep the ids in sync with `categories` / `faqCategories` in the website's `src/js/data/` files (they build the filter chips).
- **Change a tab's intro text**: `ADMIN_PAGES`.

Admin look & feel: [`public/admin.css`](public/admin.css) uses the same colour variables as the website.

---

## Folder guide

```
admin/
├── server.js            API, login, uploads, serves the UI (Express)
├── package.json         its own dependencies — deploy this folder on its own
├── .env.example         all settings
├── seed/content.json    starting content (copied to DATA_DIR on first run)
├── scripts/seed.mjs     regenerates the seed from the website's bundled content
├── public/              the admin UI (plain JS, no build step)
│   ├── index.html       login + app shell
│   ├── admin.css        design (dark / light)
│   ├── schema.js        ★ what's editable + validation (shared with the server)
│   └── js/              app.js · views.js · ui.js · api.js · sun-moon-toggle.js
└── data/                created at runtime: content.json, uploads/, backups/  (git-ignored)
```

## API reference

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /api/content` | public | Everything the website needs (image links made absolute). CORS-enabled, read-only. |
| `POST /api/login` | — | `{ password }` → `{ token }` |
| `GET /api/admin/content` | token | Content + current `rev` |
| `PUT /api/admin/content` | token | `{ rev, content }` → saves (409 if `rev` is stale, 422 with a list of problems if invalid) |
| `POST /api/admin/upload` | token | `multipart/form-data` field `file` → `{ url: "/uploads/…" }` |
| `GET /uploads/<file>` | public | Uploaded images |
| `GET /api/config` | public | `{ siteUrl, defaultPassword }` for the login screen |

Send the token as `Authorization: Bearer <token>`.

## Limits of this setup (honest notes)

- One shared password, one content file: great for a small café, not a multi-user CMS.
- The website shows new content when a page **loads** — it does not live-update an already open page.
- Content lives on the admin server's disk. Back it up (see above) and use a persistent disk.
