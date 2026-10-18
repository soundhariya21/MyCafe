// Where the website gets its content.
//
//   1. If VITE_CONTENT_URL is set (see .env.example) the site fetches fresh content from the admin server.
//   2. If that fails (server down / slow / offline) it falls back to the last good copy kept in the browser,
//   3. and finally to the content bundled inside the site (src/js/data/*.js) — so the site ALWAYS renders.
//
// Pages call `await loadContent()`; the request is made once and shared.
import { menuItems, pairings, roasts } from './menu.js';
import { faqs, galleryItems, testimonials, timeline, values, team, origins, defaultSettings } from './content.js';

const CONTENT_URL = import.meta.env.VITE_CONTENT_URL;
const CACHE_KEY = 'mycafe-content-v1';
const TIMEOUT_MS = 3500;

const bundled = {
  menu: menuItems,
  pairings,
  roasts,
  gallery: galleryItems,
  faqs,
  testimonials,
  timeline,
  values,
  team,
  origins,
  settings: defaultSettings,
};
const LISTS = Object.keys(bundled).filter((key) => key !== 'settings');

const isObject = (v) => typeof v === 'object' && v !== null;

/** Overlay remote content on the bundled content, ignoring anything malformed. */
function merge(remote) {
  const out = { ...bundled };
  if (!isObject(remote)) return out;
  for (const key of LISTS) {
    if (Array.isArray(remote[key])) out[key] = remote[key].filter(isObject);
  }
  out.menu = out.menu.map((item) => ({ tags: [], featured: false, ...item, tags: Array.isArray(item.tags) ? item.tags : [] }));
  if (isObject(remote.settings)) {
    out.settings = { ...defaultSettings, ...remote.settings, hours: { ...defaultSettings.hours, ...(isObject(remote.settings.hours) ? remote.settings.hours : {}) } };
  }
  return out;
}

async function fetchRemote() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(CONTENT_URL, { cache: 'no-store', signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch {
      /* storage full / private mode */
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
  } catch {
    return null;
  }
}

async function load() {
  if (!CONTENT_URL) return merge(null);
  try {
    return merge(await fetchRemote());
  } catch (err) {
    console.warn('[MY.CAFÉ] Could not reach the content server, using the last saved copy.', err.message);
    return merge(readCache());
  }
}

let promise;
/** Resolves to { menu, pairings, roasts, gallery, faqs, testimonials, timeline, values, team, origins, settings } */
export const loadContent = () => (promise ??= load());
