// Page-to-page transitions. Each DESTINATION page has its own signature transition:
//
//   home     -> shutter   two panels close from top and bottom, then open like a shutter
//   menu     -> bars      six vertical bars rise in a staggered wave
//   gallery  -> tiles     a grid of tiles pops in from the centre outward
//   faqs     -> slant     slanted panels sweep across the screen
//   about    -> doors     two doors slide shut from left and right
//   contact  -> iris      a circle expands from exactly where you clicked
//
// How it works across a page load:
//   LEAVE   (old page)  build the overlay -> play "cover" -> remember {to, x, y} in sessionStorage -> navigate
//   ARRIVE  (new page)  <head> script adds .pt-arrive (CSS hides the page behind a dark cover instantly)
//                       -> build the same overlay already covering -> play "reveal"
//
// To add or change a style, edit the VARIANTS table below (and the matching CSS in styles/page-transitions.css).
import { gsap } from 'gsap';
import { $, reducedMotion } from '../utils.js';

const KEY = 'mycafe-pt';
const EASE = 'power4.inOut';

/** Which transition plays when navigating TO each page, plus the title shown in the middle. */
const PAGES = {
  index: { variant: 'shutter', title: 'Home', sub: 'Welcome back' },
  menu: { variant: 'bars', title: 'Menu', sub: 'The curated lineup' },
  gallery: { variant: 'tiles', title: 'Gallery', sub: 'The visual feed' },
  faqs: { variant: 'slant', title: 'FAQs', sub: 'Frequently asked' },
  about: { variant: 'doors', title: 'About', sub: 'The philosophy' },
  contact: { variant: 'iris', title: 'Contact', sub: 'Find your corner' },
};

const repeat = (html, n) => html.repeat(n);
const TILE_GRID = { cols: 8, rows: 5 };

/**
 * Each variant describes its markup and four GSAP states:
 *   hidden  – before covering          cover  – tween that covers the page
 *   shown   – fully covering           reveal – tween that uncovers it again
 * (functions so they can use the click position `c` and be re-evaluated on each use)
 */
const VARIANTS = {
  shutter: {
    html: '<i class="pt__half"></i><i class="pt__half"></i>',
    sel: '.pt__half',
    hidden: () => ({ yPercent: (i) => (i ? 100 : -100) }),
    shown: () => ({ yPercent: 0 }),
    cover: () => ({ yPercent: 0, duration: 0.8, ease: EASE }),
    reveal: () => ({ yPercent: (i) => (i ? 100 : -100), duration: 0.85, ease: EASE }),
  },
  bars: {
    html: repeat('<i class="pt__bar"></i>', 6),
    sel: '.pt__bar',
    hidden: () => ({ scaleY: 0, transformOrigin: '50% 100%' }),
    shown: () => ({ scaleY: 1, transformOrigin: '50% 0%' }),
    cover: () => ({ scaleY: 1, duration: 0.6, ease: EASE, stagger: 0.07 }),
    reveal: () => ({ scaleY: 0, duration: 0.6, ease: EASE, stagger: 0.07 }),
  },
  tiles: {
    html: repeat('<i class="pt__tile"></i>', TILE_GRID.cols * TILE_GRID.rows),
    sel: '.pt__tile',
    hidden: () => ({ scale: 0 }),
    shown: () => ({ scale: 1.04 }),
    cover: () => ({ scale: 1.04, duration: 0.45, ease: 'power3.inOut', stagger: { grid: [TILE_GRID.rows, TILE_GRID.cols], from: 'center', amount: 0.5 } }),
    reveal: () => ({ scale: 0, duration: 0.45, ease: 'power3.inOut', stagger: { grid: [TILE_GRID.rows, TILE_GRID.cols], from: 'edges', amount: 0.5 } }),
  },
  slant: {
    html: repeat('<i class="pt__slant"></i>', 5),
    sel: '.pt__slant',
    hidden: () => ({ x: -window.innerWidth * 1.4, skewX: -14 }),
    shown: () => ({ x: 0, skewX: -14 }),
    cover: () => ({ x: 0, skewX: -14, duration: 0.75, ease: EASE, stagger: 0.08 }),
    reveal: () => ({ x: window.innerWidth * 1.4, skewX: -14, duration: 0.75, ease: EASE, stagger: 0.08 }),
  },
  doors: {
    html: '<i class="pt__half"></i><i class="pt__half"></i>',
    sel: '.pt__half',
    hidden: () => ({ xPercent: (i) => (i ? 100 : -100) }),
    shown: () => ({ xPercent: 0 }),
    cover: () => ({ xPercent: 0, duration: 0.8, ease: EASE }),
    reveal: () => ({ xPercent: (i) => (i ? 100 : -100), duration: 0.85, ease: EASE }),
  },
  iris: {
    html: '<i class="pt__iris"></i>',
    sel: '.pt__iris',
    hidden: (c) => ({ clipPath: `circle(0px at ${c.x}px ${c.y}px)` }),
    shown: (c) => ({ clipPath: `circle(${radius(c)}px at ${c.x}px ${c.y}px)` }),
    cover: (c) => ({ clipPath: `circle(${radius(c)}px at ${c.x}px ${c.y}px)`, duration: 0.9, ease: EASE }),
    reveal: (c) => ({ clipPath: `circle(0px at ${c.x}px ${c.y}px)`, duration: 0.9, ease: EASE }),
  },
};

/** Radius needed for a circle centred on (x, y) to reach the farthest screen corner. */
const radius = ({ x, y }) => Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 20;

const pageKey = (pathname = location.pathname) => {
  const file = pathname.split('/').pop().replace('.html', '');
  return PAGES[file] ? file : 'index';
};

/* ---------- Overlay construction ---------- */
function build(key, ctx) {
  const page = PAGES[key];
  const variant = VARIANTS[page.variant];
  const overlay = document.createElement('div');
  overlay.className = `pt pt--${page.variant}`;
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    ${variant.html}
    <div class="pt__label">
      <small>Now entering</small>
      <strong>${page.title}</strong>
      <em>${page.sub}</em>
      <span class="pt__line"></span>
    </div>`;
  document.body.appendChild(overlay);

  const panels = overlay.querySelectorAll(variant.sel);
  const label = overlay.querySelector('.pt__label');
  const labelBits = label.querySelectorAll('small, strong, em');
  const line = overlay.querySelector('.pt__line');
  return { overlay, variant, panels, label, labelBits, line, ctx };
}

/* ---------- LEAVE: cover the page, then navigate ---------- */
function leave(url, ctx) {
  const key = pageKey(url.pathname);
  const o = build(key, ctx);
  o.overlay.classList.add('is-blocking'); // swallow clicks while covering

  gsap.set(o.panels, o.variant.hidden(ctx));
  gsap.set([...o.labelBits, o.line], { opacity: 0 });
  gsap.set(o.line, { scaleX: 0 });

  gsap
    .timeline({
      onComplete: () => {
        try {
          sessionStorage.setItem(KEY, JSON.stringify({ to: key, x: ctx.x, y: ctx.y }));
        } catch {
          /* ignore */
        }
        location.href = url.href;
      },
    })
    .to(o.panels, o.variant.cover(ctx))
    .fromTo(o.labelBits, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.07 }, '-=0.3')
    .to(o.line, { opacity: 1, scaleX: 1, duration: 0.5, ease: 'power3.inOut' }, '<0.1')
    .to({}, { duration: 0.12 }); // tiny hold so the title registers
}

/* ---------- ARRIVE: start covered, then reveal ---------- */
/** Resolves when the page behind may start animating in (about halfway through the reveal). */
export function playArrival() {
  return new Promise((resolve) => {
    const base = $('[data-curtain]');
    let record = null;
    try {
      record = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      sessionStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    if (!record || !PAGES[record.to] || reducedMotion) {
      base?.remove();
      return resolve();
    }

    const ctx = { x: record.x ?? innerWidth / 2, y: record.y ?? innerHeight / 2 };
    const o = build(record.to, ctx);

    // Same look as the covered state the leaving page ended on
    gsap.set(o.panels, o.variant.shown(ctx));
    gsap.set(o.labelBits, { opacity: 1, y: 0 });
    gsap.set(o.line, { opacity: 1, scaleX: 1 });
    base?.remove(); // the instant CSS cover is no longer needed

    gsap
      .timeline({ delay: 0.15, onComplete: () => o.overlay.remove() })
      .to(o.labelBits, { y: -30, opacity: 0, duration: 0.4, ease: 'power2.in', stagger: 0.05 })
      .to(o.line, { opacity: 0, scaleX: 0, transformOrigin: 'right', duration: 0.35, ease: 'power2.in' }, '<')
      .to(o.panels, o.variant.reveal(ctx), '-=0.15')
      .add(resolve, '-=0.5');
  });
}

/* ---------- Link interception ---------- */
export function initPageTransitions() {
  // Safety nets: a restored back/forward-cache page must never keep an overlay on screen
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) document.querySelectorAll('.pt').forEach((el) => el.remove());
  });

  if (reducedMotion) return;

  // Synthetic clicks (e.g. from the React nav tabs) have no position — fall back to the last pointer position
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  window.addEventListener('pointermove', (e) => ((pointer.x = e.clientX), (pointer.y = e.clientY)), { passive: true });

  let leaving = false;
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link || e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (link.target === '_blank' || link.hasAttribute('download')) return;

    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return; // in-page anchors scroll instead
    e.preventDefault();
    if (leaving || (url.pathname === location.pathname && url.search === location.search)) return;
    leaving = true;

    const ctx = e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : { ...pointer };
    leave(url, ctx);
  });
}
