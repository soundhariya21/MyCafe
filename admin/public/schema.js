// SHARED SCHEMA — imported by the admin UI (browser) AND the API server (Node).
// It is the single source of truth for: what can be edited, which fields each item has,
// and how values are validated / cleaned before they are saved.
//
// To make a new field editable: add it to the collection's `fields` below, then use it on the public site.

export const MENU_CATEGORIES = [
  ['brews', 'Hot Brews'],
  ['cold', 'Cold Bar'],
  ['bakes', 'Bakes'],
  ['brunch', 'Brunch'],
];
export const MENU_TAGS = [
  ['signature', 'Signature'],
  ['new', 'New'],
  ['veg', 'Veg'],
  ['vegan', 'Vegan'],
  ['gf', 'Gluten-free'],
  ['spicy', 'Spiced'],
];
export const GALLERY_CATEGORIES = [
  ['coffee', 'Coffee'],
  ['bakes', 'Bakes'],
  ['space', 'The space'],
];
export const GALLERY_SIZES = [
  ['', 'Normal'],
  ['tall', 'Tall'],
  ['wide', 'Wide'],
];
export const FAQ_CATEGORIES = [
  ['coffee', 'Coffee'],
  ['visit', 'Visiting'],
  ['food', 'Food & Diet'],
  ['beans', 'Beans & Orders'],
];

/** Opening-hours days in the order the site shows them (n = JavaScript weekday, 0 = Sunday). */
export const WEEKDAYS = [
  { n: 2, label: 'Tuesday' },
  { n: 3, label: 'Wednesday' },
  { n: 4, label: 'Thursday' },
  { n: 5, label: 'Friday' },
  { n: 6, label: 'Saturday' },
  { n: 0, label: 'Sunday' },
  { n: 1, label: 'Monday' },
];

/** Half-hour slots 05:00 … 23:30 for the opening-hours selects. */
export const TIME_SLOTS = Array.from({ length: 38 }, (_, i) => {
  const mins = 5 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${mins % 60 ? '30' : '00'}`;
});

/**
 * Field types: text | textarea | number | select | tags | bool | image
 * `title` / `summary` are the keys used to label an item in lists.
 */
export const COLLECTIONS = {
  menu: {
    label: 'Menu items',
    singular: 'dish',
    max: 200,
    title: 'name',
    fields: [
      { key: 'name', type: 'text', label: 'Name', required: true, max: 80 },
      { key: 'category', type: 'select', label: 'Category', options: MENU_CATEGORIES, required: true },
      { key: 'price', type: 'number', label: 'Price (₹)', min: 0, max: 100000, required: true },
      { key: 'desc', type: 'textarea', label: 'Description', required: true, max: 300 },
      { key: 'notes', type: 'text', label: 'Tasting notes', max: 80, hint: 'Short, e.g. “Cocoa · Jaggery · Roasted nuts”' },
      { key: 'tags', type: 'tags', label: 'Tags', options: MENU_TAGS },
      { key: 'featured', type: 'bool', label: 'Show in “Signature picks” on the Home page' },
      { key: 'image', type: 'image', label: 'Photo', required: true },
    ],
  },
  pairings: {
    label: 'Pairing guide',
    singular: 'pairing',
    max: 12,
    title: 'drink',
    fields: [
      { key: 'drink', type: 'text', label: 'Drink', required: true, max: 80 },
      { key: 'bake', type: 'text', label: 'Pairs with', required: true, max: 80 },
      { key: 'why', type: 'textarea', label: 'Why it works', required: true, max: 300 },
    ],
  },
  roasts: {
    label: 'Beans to take home',
    singular: 'roast',
    max: 12,
    title: 'name',
    fields: [
      { key: 'name', type: 'text', label: 'Name', required: true, max: 60 },
      { key: 'origin', type: 'text', label: 'Origin', required: true, max: 60 },
      { key: 'notes', type: 'text', label: 'Tasting notes', max: 80 },
      { key: 'body', type: 'number', label: 'Body (0–100)', min: 0, max: 100, required: true },
      { key: 'acidity', type: 'number', label: 'Acidity (0–100)', min: 0, max: 100, required: true },
      { key: 'roast', type: 'number', label: 'Roast level (0–100)', min: 0, max: 100, required: true },
    ],
  },
  gallery: {
    label: 'Gallery photos',
    singular: 'photo',
    max: 200,
    title: 'title',
    fields: [
      { key: 'src', type: 'image', label: 'Photo', required: true },
      { key: 'title', type: 'text', label: 'Caption', required: true, max: 80 },
      { key: 'tag', type: 'text', label: 'Small label', max: 40, hint: 'Shown above the caption, e.g. “Rituals”' },
      { key: 'cat', type: 'select', label: 'Category', options: GALLERY_CATEGORIES, required: true },
      { key: 'size', type: 'select', label: 'Tile shape', options: GALLERY_SIZES, hint: 'Tall and wide tiles take more room in the grid' },
    ],
  },
  faqs: {
    label: 'Questions & answers',
    singular: 'question',
    max: 200,
    title: 'q',
    fields: [
      { key: 'q', type: 'text', label: 'Question', required: true, max: 200 },
      { key: 'a', type: 'textarea', label: 'Answer', required: true, max: 1200 },
      { key: 'category', type: 'select', label: 'Category', options: FAQ_CATEGORIES, required: true },
    ],
  },
  testimonials: {
    label: 'Testimonials',
    singular: 'testimonial',
    max: 20,
    title: 'name',
    fields: [
      { key: 'quote', type: 'textarea', label: 'Quote', required: true, max: 400 },
      { key: 'name', type: 'text', label: 'Name', required: true, max: 60 },
      { key: 'role', type: 'text', label: 'Role / note', max: 80 },
    ],
  },
  timeline: {
    label: 'Our journey (timeline)',
    singular: 'milestone',
    max: 20,
    title: 'title',
    fields: [
      { key: 'year', type: 'text', label: 'Year', required: true, max: 10 },
      { key: 'title', type: 'text', label: 'Title', required: true, max: 80 },
      { key: 'text', type: 'textarea', label: 'Story', required: true, max: 300 },
    ],
  },
  values: {
    label: 'Promises (values)',
    singular: 'promise',
    max: 12,
    title: 'title',
    fields: [
      { key: 'icon', type: 'text', label: 'Emoji', required: true, max: 8, hint: 'One emoji, e.g. 🌱' },
      { key: 'title', type: 'text', label: 'Title', required: true, max: 60 },
      { key: 'text', type: 'textarea', label: 'Text', required: true, max: 240 },
    ],
  },
  team: {
    label: 'Team',
    singular: 'team member',
    max: 24,
    title: 'name',
    fields: [
      { key: 'name', type: 'text', label: 'Name', required: true, max: 60 },
      { key: 'role', type: 'text', label: 'Role', required: true, max: 60 },
      { key: 'bio', type: 'textarea', label: 'Short bio', max: 200 },
    ],
  },
  origins: {
    label: 'Coffee origins',
    singular: 'origin',
    max: 12,
    title: 'name',
    fields: [
      { key: 'name', type: 'text', label: 'Estate / region', required: true, max: 60 },
      { key: 'alt', type: 'text', label: 'Altitude', max: 20, hint: 'e.g. 1,100 m' },
      { key: 'note', type: 'textarea', label: 'Tasting note', max: 200 },
    ],
  },
};

/** Admin tabs, in the same order as the public site's navigation. */
export const ADMIN_PAGES = [
  { id: 'home', label: 'Home', lead: 'Words your regulars say about you. The “Signature picks” on the Home page come from the Menu tab (tick “Show on Home page”).', sections: ['testimonials'] },
  { id: 'menu', label: 'Menu', lead: 'Change prices, descriptions and photos, add new dishes or remove old ones. Changes go live when you press Publish.', sections: ['menu', 'pairings', 'roasts'] },
  { id: 'gallery', label: 'Gallery', lead: 'Upload new photos, remove old ones and reorder the grid with the arrows.', sections: ['gallery'] },
  { id: 'faqs', label: 'FAQs', lead: 'Add, edit, reorder or delete the questions visitors see on the FAQs page.', sections: ['faqs'] },
  { id: 'about', label: 'About', lead: 'The story, promises, team and coffee origins shown on the About page.', sections: ['timeline', 'values', 'team', 'origins'] },
  { id: 'contact', label: 'Contact', lead: 'Address, phone, email and opening hours — used on the Contact page, footer and the live “open now” badge.', sections: ['settings'] },
];

export const SETTINGS_FIELDS = [
  { key: 'address', type: 'textarea', label: 'Address', required: true, max: 200, hint: 'Use a new line where you want a line break' },
  { key: 'phone', type: 'text', label: 'Phone', required: true, max: 30 },
  { key: 'email', type: 'text', label: 'Email', required: true, max: 120 },
  { key: 'closedNote', type: 'text', label: 'Closed-day note', max: 80, hint: 'Shown in the footer, e.g. “Mondays: closed for roasting”' },
];

export const DEFAULT_HOURS = Object.fromEntries(
  WEEKDAYS.map(({ n }) => [n, n === 1 ? { closed: true, open: '07:00', close: '22:00' } : { closed: false, open: '07:00', close: '22:00' }])
);

/* ==========================================================================
   Validation / sanitising  (runs in the browser before saving AND on the server)
   ========================================================================== */

export const genId = () => Math.random().toString(36).slice(2, 10);

const SAFE_URL = /^https?:\/\/[^\s"'<>\\]+$/i;
const UPLOAD_URL = /^\/uploads\/[A-Za-z0-9._-]+$/;
export const isSafeImageUrl = (v) => typeof v === 'string' && v.length <= 600 && (SAFE_URL.test(v) || UPLOAD_URL.test(v));

const clean = (v) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim();

/** Returns { value, error } for one field. */
export function sanitizeField(field, raw) {
  const label = field.label ?? field.key;
  switch (field.type) {
    case 'text':
    case 'textarea': {
      let v = clean(raw);
      if (field.type === 'text') v = v.replace(/\s+/g, ' ');
      if (field.required && !v) return { error: `${label} is required.` };
      if (field.max && v.length > field.max) return { error: `${label} must be ${field.max} characters or fewer.` };
      return { value: v };
    }
    case 'number': {
      const n = typeof raw === 'string' && raw.trim() === '' ? NaN : Number(raw);
      if (!Number.isFinite(n)) return { error: `${label} must be a number.` };
      const v = Math.round(n);
      if (field.min !== undefined && v < field.min) return { error: `${label} must be at least ${field.min}.` };
      if (field.max !== undefined && v > field.max) return { error: `${label} must be at most ${field.max}.` };
      return { value: v };
    }
    case 'select': {
      const v = raw == null ? '' : String(raw);
      if (!field.options.some(([val]) => val === v)) return { error: `${label} has an invalid choice.` };
      return { value: v };
    }
    case 'tags': {
      const list = Array.isArray(raw) ? raw : [];
      const allowed = field.options.map(([val]) => val);
      return { value: allowed.filter((t) => list.includes(t)) };
    }
    case 'bool':
      return { value: raw === true };
    case 'image': {
      const v = clean(raw);
      if (!v) return field.required ? { error: `${label} is required.` } : { value: '' };
      if (!isSafeImageUrl(v)) return { error: `${label} must be a web address starting with https:// (or an uploaded file).` };
      return { value: v };
    }
    default:
      return { error: `Unknown field type for ${label}.` };
  }
}

/** Cleans one item of a collection. Unknown keys are dropped. */
export function sanitizeItem(collectionName, raw) {
  const def = COLLECTIONS[collectionName];
  const item = {};
  const errors = [];
  if (typeof raw !== 'object' || raw === null) return { item: null, errors: ['Item must be an object.'] };
  for (const field of def.fields) {
    const { value, error } = sanitizeField(field, raw[field.key]);
    if (error) errors.push(error);
    else item[field.key] = value;
  }
  item.id = typeof raw.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(raw.id) ? raw.id : genId();
  return { item, errors };
}

export function sanitizeSettings(raw) {
  const out = { hours: {} };
  const errors = [];
  const src = typeof raw === 'object' && raw ? raw : {};
  for (const field of SETTINGS_FIELDS) {
    const { value, error } = sanitizeField(field, src[field.key]);
    if (error) errors.push(error);
    else out[field.key] = value;
  }
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(out.email)) errors.push('Email must be a valid address.');
  if (out.phone && !/^[+\d][\d\s()-]{6,}$/.test(out.phone)) errors.push('Phone must be a valid number, e.g. +91 98765 43210.');
  for (const { n, label } of WEEKDAYS) {
    const h = src.hours?.[n] ?? DEFAULT_HOURS[n];
    const closed = h.closed === true;
    const open = TIME_SLOTS.includes(h.open) ? h.open : null;
    const close = TIME_SLOTS.includes(h.close) ? h.close : null;
    if (!closed && (!open || !close)) errors.push(`${label}: choose opening and closing times.`);
    else if (!closed && open >= close) errors.push(`${label}: closing time must be after opening time.`);
    out.hours[n] = { closed, open: open ?? '07:00', close: close ?? '22:00' };
  }
  return { settings: out, errors };
}

/** Cleans the whole content document. Returns { content, errors } — save only if errors is empty. */
export function sanitizeContent(raw) {
  const content = {};
  const errors = [];
  if (typeof raw !== 'object' || raw === null) return { content: null, errors: ['Content must be an object.'] };

  for (const [name, def] of Object.entries(COLLECTIONS)) {
    const list = raw[name];
    if (!Array.isArray(list)) {
      errors.push(`${def.label}: missing list.`);
      continue;
    }
    if (list.length > def.max) errors.push(`${def.label}: at most ${def.max} items allowed.`);
    const seen = new Set();
    content[name] = list.slice(0, def.max).map((entry, i) => {
      const { item, errors: itemErrors } = sanitizeItem(name, entry);
      const who = item?.[def.title] ? `“${item[def.title]}”` : `#${i + 1}`;
      itemErrors.forEach((e) => errors.push(`${def.label} ${who}: ${e}`));
      if (item) {
        while (seen.has(item.id)) item.id = genId();
        seen.add(item.id);
      }
      return item;
    });
  }

  const { settings, errors: settingsErrors } = sanitizeSettings(raw.settings);
  settingsErrors.forEach((e) => errors.push(`Contact: ${e}`));
  content.settings = settings;
  return { content, errors };
}
