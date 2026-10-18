# MY.CAFÉ — Artisanal Café Website

A professional, multi-page café website built with **Vite** and **GSAP**. It has six pages, a light / dark theme toggle, scroll-driven animations, a filterable menu, a photo gallery with lightbox, an accordion FAQ and a validated reservation form.

## Quick start — everything on your own computer

```bash
npm install
npm run dev:all
```

That one command starts **both** parts of the project on localhost (the first run also installs the admin panel's packages automatically):

| What | Address | Notes |
| --- | --- | --- |
| **Website** | <http://localhost:5173> | Opens in your browser automatically |
| **Admin panel** | <http://localhost:4000> | Log in with password **`admin123`** |

Open the admin, change something (a price, a photo, a FAQ…), press **Publish changes**, then refresh the website — your change is there. Press **Ctrl+C** once in the terminal to stop both. No hosting or accounts needed.

Only want the website, without the admin? Use `npm run dev` instead. Full details in [Working on localhost](#working-on-localhost-website--admin).

---

## Contents

1. [Features](#features)
2. [Getting started](#getting-started) · [Working on localhost](#working-on-localhost-website--admin)
3. [Project structure](#project-structure)
4. [How it works](#how-it-works)
5. [Light / dark theme](#light--dark-theme)
6. [GSAP components used](#gsap-components-used)
7. [Editing the content](#editing-the-content)
8. [Adding a new page](#adding-a-new-page)
9. [Connecting the reservation form](#connecting-the-reservation-form)
10. [Admin panel](#admin-panel-edit-the-site-without-touching-code)
11. [Building and deploying](#building-and-deploying)
12. [Troubleshooting](#troubleshooting)
13. [Credits](#credits)

---

## Features

| Page | What's on it |
| --- | --- |
| **Home** | Animated hero, scrolling marquee, count-up numbers, signature dishes, a pinned horizontal "bean to cup" scroller, story teaser, testimonial carousel, parallax photo rows, reservation CTA |
| **Menu** | 15 dishes with category filter and live search (animated with GSAP Flip), pairing guide, roast cards with animated meters |
| **Gallery** | Filterable photo grid, keyboard- and swipe-friendly lightbox, big outlined marquee |
| **FAQs** | 13 questions, category tabs, live search, smooth GSAP accordion |
| **About** | Story, count-up stats, timeline whose gold line draws as you scroll, values, coffee origins, team |
| **Contact** | Live "open now" badge, opening hours, reservation form with validation and success screen, map, private events info |

Site-wide:

- Light and dark theme with an animated sun / moon toggle (the moon sets, the sun rises, the whole page fades with it), remembered between visits
- Intro loader on first visit, plus a different cinematic transition for each page you navigate to (see [Page transitions](#page-transitions))
- Sticky navbar that hides on scroll-down, scroll progress bar, animated mobile menu
- Custom cursor, magnetic buttons and 3D tilt cards on desktop
- Fully responsive (checked at 390 px, 960 px and 1440 px)
- Respects `prefers-reduced-motion` — animations are skipped for visitors who ask for that
- Accessible: skip link, keyboard navigation, ARIA states on tabs / accordion / lightbox, visible focus rings

---

## Getting started

### Requirements

- **Node.js 20.19+ or 22.12+** (check with `node -v`)
- npm (comes with Node)

### Install and run

```bash
npm install          # installs Vite, GSAP and the other packages (once)
npm run dev:all      # website + admin panel together  (recommended)
npm run dev          # website only
```

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev:all` | **Website + admin together** on localhost (website `:5173`, admin `:4000`). Installs the admin's packages on first run. |
| `npm run dev` | Website only, at `http://localhost:5173`, with instant reload |
| `npm run admin` | Admin panel only, at `http://localhost:4000` |
| `npm run admin:install` | Installs the admin panel's packages (`dev:all` does this for you automatically) |
| `npm run build` | Creates an optimised production build in `dist/` |
| `npm run preview` | Serves the `dist/` build locally so you can test it before deploying |

### Working on localhost (website + admin)

Everything runs on your computer — nothing is uploaded anywhere.

**Start**: `npm run dev:all`. You will see two coloured log streams, `admin │` and `site │`.

**The workflow**

1. Open the admin at <http://localhost:4000> and log in (**`admin123`** by default).
2. Make changes — type a new price on a dish card, upload photos on the Gallery tab, edit FAQs, change opening hours…
3. Press **Publish changes** (or Ctrl/Cmd + S). Nothing is visible on the website until you do this.
4. Open or refresh the website at <http://localhost:5173> — the new content is there. The admin's **View site ↗** button jumps straight to it.

**How the two talk to each other**: the website asks the admin server for its content each time a page loads (`VITE_CONTENT_URL` in [`.env.development`](.env.development) = `http://localhost:4000/api/content`). If the admin isn't running, the website quietly shows its built-in content, so `npm run dev` on its own always works.

**Where your edits are stored**: in the folder `admin/data/` (created automatically; it is git-ignored). It contains `content.json` (all the content), `uploads/` (photos you upload) and `backups/` (a copy of the previous version each time you publish — the latest 20 are kept).

| I want to… | Do this |
| --- | --- |
| Change the admin password | Create `admin/.env` containing `ADMIN_PASSWORD=your-password` (copy [`admin/.env.example`](admin/.env.example)), then restart `npm run dev:all`. The file is read automatically. |
| Reset everything to the original content | Stop the servers, delete `admin/data/content.json`, start again (the original content is restored; your uploaded photos stay in `admin/data/uploads/`) |
| Start the admin on a different port | Put `PORT=4001` in `admin/.env`, and update the address in `.env.development` to match |
| Go back to a previous version | Copy a file from `admin/data/backups/` over `admin/data/content.json` while the servers are stopped |
| See what the website looks like with no admin | Run `npm run dev` only (or stop the admin) — it falls back to the built-in content |
| Make my admin changes the site's permanent built-in content | In the admin footer press **Download backup (JSON)**, then copy the values you want into `src/js/data/menu.js` / `content.js` |

> Hosting later is optional and separate — see [`admin/README.md`](admin/README.md) when you get there. Until then, localhost is all you need.

---

## Project structure

```
MyCafe/
├── index.html            ← one HTML file per page (Home)
├── menu.html
├── gallery.html
├── faqs.html
├── about.html
├── contact.html
├── vite.config.js        ← Vite config + tiny "partials" plugin
├── package.json
├── .env.development      ← points the website at the local admin server (dev only)
├── .env.example          ← how to point a built website at a hosted admin server
├── scripts/
│   └── dev-all.mjs       ← `npm run dev:all` — starts website + admin together
├── admin/                ← the admin panel: its own app, own package.json (see admin/README.md)
│   ├── server.js             login, content API, image uploads
│   ├── public/               admin screens (same look as the website)
│   └── data/                 YOUR edits live here (created automatically, git-ignored)
├── public/
│   └── favicon.svg       ← files here are copied as-is
└── src/
    ├── partials/         ← HTML shared by every page
    │   ├── head.html         meta tags, fonts, theme-before-paint script, CSS link
    │   ├── shell.html        loader, page-transition mount, cursor, scroll progress
    │   ├── navbar.html       navbar + mobile menu
    │   └── footer.html       footer + toast container
    ├── styles/
    │   ├── main.css          imports everything below
    │   ├── base.css          colour tokens (dark + light), reset, typography
    │   ├── components.css    navbar, buttons, cards, forms, footer, loader…
    │   └── home.css, menu.css, gallery.css, faqs.css, about.css, contact.css
    └── js/
        ├── main.js           entry point used by every page
        ├── utils.js          small helpers
        ├── components/       theme, navbar, cursor, loader, footer, toast, tilt/magnetic
        ├── animations/
        │   └── reveal.js     scroll animations driven by data-attributes
        ├── pages/            one file per page (home.js, menu.js, …)
        └── data/             built-in content (menu, FAQs, gallery, team…) + remote.js, which
                              fetches the admin-managed content and falls back to the built-in one
```

---

## How it works

### 1. Shared HTML with partials

Every page contains lines like this:

```html
<!--@include head-->
<!--@include navbar-->
<!--@include footer-->
```

A small plugin in [`vite.config.js`](vite.config.js) replaces each line with the matching file from `src/partials/`. Edit the navbar **once** and all six pages update — no copy-pasting.

### 2. One entry script, one module per page

Every page ends with `<script type="module" src="/src/js/main.js">`. `main.js` starts the shared features, then looks at `<body data-page="menu">` and loads `src/js/pages/menu.js`. That page file renders its dynamic content and sets up its own animations.

### 3. Animations are controlled with `data-` attributes

You can animate almost anything without writing JavaScript — add an attribute in the HTML:

| Attribute | Effect |
| --- | --- |
| `data-reveal` | Fades and slides the element in when it scrolls into view. Values: `up` (default), `down`, `left`, `right`, `scale`, `fade` |
| `data-delay="0.3"` | Extra delay in seconds |
| `data-stagger` | Children of this element animate in one after another |
| `data-split` | Heading split into lines with GSAP **SplitText** and revealed through a mask |
| `data-parallax="12"` | Image drifts slower than the page (put it inside an `overflow: hidden` wrapper) |
| `data-count="4.9"` | Number counts up. Optional: `data-decimals`, `data-suffix`, `data-prefix` |
| `data-marquee` | Infinite scrolling text that speeds up with scroll velocity |
| `data-scroll-row="-1"` | Row of images that slides sideways as you scroll |
| `data-tilt` | Card tilts in 3D toward the cursor |
| `data-magnetic` | Button is gently pulled toward the cursor |
| `data-cursor-label="View"` | Custom cursor grows and shows this label on hover |

Example:

```html
<h2 class="h2" data-split>Four things you <em class="accent">must</em> try</h2>
<p class="lead" data-reveal data-delay="0.2">…</p>
<strong data-count="12000" data-suffix="+">12,000+</strong>
```

The implementations live in [`src/js/animations/reveal.js`](src/js/animations/reveal.js) and [`src/js/components/interactions.js`](src/js/components/interactions.js).

---

## Light / dark theme

All colours are CSS variables defined in [`src/styles/base.css`](src/styles/base.css):

```css
:root[data-theme='dark']  { --bg: #0b0907; --text: #f6f1e8; --accent: #e5a93b; … }
:root[data-theme='light'] { --bg: #faf5ec; --text: #2b1d12; --accent: #c8821c; … }
```

- The toggle button in the navbar is the React component [`SunMoonThemeToggle`](src/components/ui/sun-moon-theme-toggle.tsx). It is mounted by [`theme-toggle-mount.tsx`](src/js/components/theme-toggle-mount.tsx), flips the `.dark` class on `<html>`, saves the choice in `localStorage` under `mycafe-theme`, and fades the page colours while the moon and sun swap places.
- [`theme.js`](src/js/components/theme.js) mirrors `.dark` into `data-theme`, which is what the site's CSS variables use — so the component and the plain CSS always agree.
- The component's Tailwind colour classes (`border-border`, `bg-background`, `text-foreground`…) are mapped to the site's variables in [`src/styles/tailwind.css`](src/styles/tailwind.css), so it follows both themes automatically.
- Props you can tweak where it is mounted: `size` (px), `duration` (ms, also the page fade), `sky` (night / day sky inside the button), `storageKey`.
- On a first visit the site follows the visitor's operating-system preference.
- A tiny script in `head.html` applies the saved theme **before** the page paints, so there is never a flash of the wrong theme.
- To change the brand colour, edit `--accent` (and the matching `--accent-text`, `--grad-gold`) in both theme blocks.
- Always use the variables (`var(--bg)`, `var(--text)`…) in new CSS — never hard-coded colours — and your new components will support both themes automatically.

### Page transitions

Every destination page has its own signature transition, with the page name shown in the middle while the panels move:

| Going to | Transition |
| --- | --- |
| Home | **Shutter** — two panels close from top and bottom, then open |
| Menu | **Bars** — six vertical bars rise in a staggered wave |
| Gallery | **Tiles** — a grid of tiles pops in from the centre outward |
| FAQs | **Slant** — slanted panels sweep across the screen |
| About | **Doors** — two doors slide shut from the left and right |
| Contact | **Iris** — a circle expands from exactly where you clicked |

The code is in [`src/js/components/page-transitions.js`](src/js/components/page-transitions.js) (animations) and [`src/styles/page-transitions.css`](src/styles/page-transitions.css) (colours and shapes). To change which style a page uses, edit the `PAGES` table at the top of the JS file; to invent a new style, add an entry to `VARIANTS` and its CSS. Visitors who prefer reduced motion get instant navigation.

---

## GSAP components used

GSAP is installed from npm (`gsap`). Since GSAP 3.13 all plugins are free, including SplitText.

| GSAP feature | Where it's used |
| --- | --- |
| **ScrollTrigger** | Scroll reveals, parallax, counters, pinned horizontal "bean to cup" scroller, timeline line, scroll progress bar, navbar hide/show |
| **SplitText** | Hero title and every `data-split` heading (masked line/word reveals) |
| **Flip** | Menu and gallery filtering — cards glide to their new positions |
| **ScrollToPlugin** | Smooth anchor scrolling and the "back to top" button |
| **`gsap.matchMedia`** | Pinned horizontal scroll on desktop, stacked cards on mobile |
| **`gsap.quickTo`** | Custom cursor, magnetic buttons and tilt cards |
| **Timelines** | Intro loader, mobile menu, hero entrance, reservation check-mark |

Want to add more? Browse <https://gsap.com/docs/v3/> and <https://gsap.com/demos/>, then drop the code into a page file in `src/js/pages/` — import what you need, e.g. `import { Draggable } from 'gsap/Draggable'` and register it in `main.js` with `gsap.registerPlugin(...)`.

---

## Editing the content

Most text lives in **data files**, not HTML, so you can change content without touching layout.

> **Prefer clicking to coding?** The [admin panel](#admin-panel-edit-the-site-without-touching-code) edits the same content (prices, photos, FAQs, hours…) from a web page. The data files below are the built-in fallback the site uses when no admin server is connected.

| To change… | Edit |
| --- | --- |
| Menu items, prices, photos, tags | [`src/js/data/menu.js`](src/js/data/menu.js) |
| Pairings and roast cards (Menu page) | same file — `pairings` and `roasts` |
| FAQs and FAQ categories | [`src/js/data/content.js`](src/js/data/content.js) — `faqs` |
| Gallery photos and captions | `content.js` — `galleryItems` |
| Testimonials, timeline, values, team, coffee origins | `content.js` |
| Opening hours | `contact.html` (table) **and** the `HOURS` object at the top of [`src/js/pages/contact.js`](src/js/pages/contact.js) |
| Address, phone, email | `contact.html`, `src/partials/footer.html`, `src/partials/navbar.html` |
| Page titles / descriptions | the `<title>` and `<meta name="description">` at the top of each HTML file |

**Add a menu item** — copy an object in `menuItems`:

```js
{
  id: 'affogato',               // unique
  name: 'Espresso Affogato',
  category: 'cold',             // brews | cold | bakes | brunch
  price: 220,
  desc: 'Vanilla gelato drowned in a fresh double espresso.',
  notes: 'Creamy · Bittersweet',
  tags: ['new', 'veg'],         // signature | new | veg | vegan | gf | spicy
  featured: false,              // true = also shown on the Home page
  image: img('1495474472287-4d71bcdd2085'),
}
```

**Photos** come from Unsplash. `img('<photo-id>')` builds the URL — the ID is the part after `photo-` in an Unsplash image address. To use your own photos, put files in `public/images/` and set `image: '/images/my-photo.jpg'`.

---

## Adding a new page

1. Copy `faqs.html` to e.g. `events.html` and change the `<title>`, `data-page="events"` and content.
2. Add a link in `src/partials/navbar.html` (and the mobile menu list below it) and `footer.html`.
3. *(Optional)* create `src/js/pages/events.js` exporting `init()`. If you don't need page-specific JS, skip it — the page still gets the theme, navbar and `data-` animations.
4. Add page styles in `src/styles/events.css` and `@import` it in `main.css`.

The build picks up every `.html` file in the project root automatically — no config change needed.

---

## Connecting the reservation form

The form validates input and shows a confirmation screen, but this is a front-end project, so **nothing is sent anywhere yet**. To receive real bookings, open [`src/js/pages/contact.js`](src/js/pages/contact.js), find the comment `No backend yet`, and send `data`:

```js
const data = Object.fromEntries(new FormData(form));

fetch('https://formspree.io/f/YOUR_FORM_ID', {   // or your own API
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  body: JSON.stringify(data),
})
  .then((res) => (res.ok ? showSuccess(data) : Promise.reject()))
  .catch(() => toast('Something went wrong — please call us instead.', 'error'));
```

The newsletter form in the footer ([`src/js/components/footer.js`](src/js/components/footer.js)) works the same way.

---

## Admin panel (edit the site without touching code)

A separate app in [`admin/`](admin/) lets the café owner log in and manage the website's content:

- **Menu** — change prices (type right on the dish card), edit dishes, add or delete them, reorder
- **Gallery** — drag & drop photo uploads, captions, delete, reorder
- **FAQs** — add, edit, delete, reorder
- **Home / About / Contact** — testimonials, timeline, promises, team, coffee origins, address, phone, email, opening hours

It looks like the website (same themes, sun/moon toggle, fonts and tab order), and it is its own app in its own folder, so it *can* be hosted separately later — but you don't need to: it works fully on localhost.

```bash
npm run dev:all   # website at http://localhost:5173  +  admin at http://localhost:4000  (password: admin123)
```

(Prefer two terminals? `npm run admin` in one and `npm run dev` in the other does the same thing.)

Edit a price in the admin → **Publish changes** → refresh the website. The website fetches its content from `VITE_CONTENT_URL` (see [`.env.example`](.env.example)); if the admin server is unreachable it uses the last saved copy, then the content bundled in `src/js/data/`, so it never goes blank.

Everything — hosting guide, environment variables, security notes, backups, API — is in **[admin/README.md](admin/README.md)**.

---

## Building and deploying

```bash
npm run build      # outputs to dist/
npm run preview    # test the production build locally
```

`dist/` is a plain static site, so it works on any static host:

- **Netlify / Vercel / Cloudflare Pages** — build command `npm run build`, publish directory `dist`.
- **GitHub Pages** — publish the `dist/` folder (e.g. with the `gh-pages` package or a GitHub Action). Asset paths are relative (`base: './'` in `vite.config.js`), so it works under a sub-path like `username.github.io/MyCafe/`.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `npm run dev` says *port 5173 is in use* | Vite will pick the next free port automatically — use the URL it prints. Or stop the other process. |
| `Unsupported engine` / Vite errors on start | Upgrade Node to 20.19+ or 22.12+ |
| Changes to a partial don't show | They trigger a full reload; if not, save the file again or restart `npm run dev` |
| Page looks unstyled for a moment | Normal in dev mode while Vite compiles; production builds don't do this |
| Images don't load | They are loaded from Unsplash — check your internet connection, or switch to local images in `public/images/` |
| `npm run dev:all` says *Port 4000 is already in use* (or 5173) | An earlier copy is still running — close its terminal (or press Ctrl+C there) and start again |
| I can't log in to the admin | Default password is `admin123`. If you created `admin/.env`, use the `ADMIN_PASSWORD` from that file. After 8 wrong tries wait 15 minutes. |
| I published a change but the website still shows the old content | Refresh the website page. Make sure the admin is running (`npm run dev:all`). If you edited `.env.development`, restart the dev server — env files are only read at start. |
| The browser console says *Could not reach the content server* | The admin isn't running. Harmless: the website is using its built-in content. Run `npm run dev:all` to connect them. |
| Uploaded photos don't show on the website | Open the website through `http://localhost:5173` while the admin runs on `http://localhost:4000` — uploaded photos are served by the admin. |
| Animations feel too much | Turn on *Reduce motion* in your OS accessibility settings — the site honours it |

---

## Credits

- Built with [Vite](https://vite.dev) and [GSAP](https://gsap.com)
- Photography from [Unsplash](https://unsplash.com) contributors
- Fonts: Cinzel, Cormorant Garamond and Plus Jakarta Sans via Google Fonts
- Map tiles © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors
- The café, its team and the address are fictional — replace them with your own details before publishing
