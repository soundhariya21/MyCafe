// One view per admin tab. Each returns an array of DOM nodes to place in <main>.
// Views edit `ctx.content` in place and call ctx.changed() — nothing is saved until the user presses Publish.
import {
  COLLECTIONS,
  ADMIN_PAGES,
  MENU_CATEGORIES,
  GALLERY_CATEGORIES,
  FAQ_CATEGORIES,
  SETTINGS_FIELDS,
  WEEKDAYS,
  TIME_SLOTS,
  genId,
} from '/schema.js';
import { h, icon, modal, confirmDialog, toast, buildForm } from './ui.js';
import { uploadImage } from './api.js';

// Remembered between re-renders so filters / search don't reset when you edit something
const view = {
  menu: { cat: 'all', q: '' },
  gallery: { cat: 'all' },
  faqs: { cat: 'all', q: '' },
};

const catLabel = (list, id) => list.find(([v]) => v === id)?.[1] ?? id;

/* ==========================================================================
   Shared building blocks
   ========================================================================== */

export function pageHero(page) {
  return h(
    'section',
    { class: 'page-hero container' },
    h('span', { class: 'pill' }, h('i', { class: 'pulse' }), 'Editing · ', page.label, ' page'),
    h('h1', {}, 'Manage ', h('em', { class: 'accent' }, page.label)),
    h('p', { class: 'lead' }, page.lead)
  );
}

const section = (...children) => h('section', { class: 'section container' }, ...children);

function sectionHead(title, text, ...actions) {
  return h('div', { class: 'section-head' }, h('div', {}, h('h2', {}, title), text ? h('p', {}, text) : null), h('div', { class: 'chips' }, actions));
}

// svg children must be created in the SVG namespace — build the magnifier once this way
function magnifier() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const c = document.createElementNS(ns, 'circle');
  c.setAttribute('cx', '11');
  c.setAttribute('cy', '11');
  c.setAttribute('r', '7');
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', 'M20 20l-3.5-3.5');
  svg.append(c, p);
  return svg;
}
function search(placeholder, value, onInput) {
  const input = h('input', { type: 'search', placeholder, value, autocomplete: 'off', 'aria-label': placeholder });
  input.addEventListener('input', () => onInput(input.value));
  return h('label', { class: 'search' }, magnifier(), input);
}

function chipBar(options, active, counts, onPick) {
  return h(
    'div',
    { class: 'chips', role: 'tablist' },
    options.map(([id, label]) =>
      h(
        'button',
        { type: 'button', role: 'tab', class: `chip${id === active ? ' is-active' : ''}`, 'aria-selected': String(id === active), onclick: () => onPick(id) },
        label,
        h('small', {}, counts[id] ?? 0)
      )
    )
  );
}

/** Move an item up / down among the items currently visible (so reordering works while a filter is on). */
function moveWithin(list, id, dir, isVisible = () => true) {
  const visible = list.map((item, i) => [item, i]).filter(([item]) => isVisible(item));
  const pos = visible.findIndex(([item]) => item.id === id);
  const target = visible[pos + dir];
  if (pos < 0 || !target) return false;
  const a = visible[pos][1];
  const b = target[1];
  [list[a], list[b]] = [list[b], list[a]];
  return true;
}

/* ==========================================================================
   Add / edit modal (shared by every collection)
   ========================================================================== */
function blankItem(name, preset = {}) {
  const item = {};
  for (const f of COLLECTIONS[name].fields) {
    item[f.key] = f.type === 'select' ? f.options[0][0] : f.type === 'bool' ? false : f.type === 'tags' ? [] : '';
  }
  return { ...item, ...preset, id: genId() };
}

export function openEditor(ctx, name, existing, preset) {
  const def = COLLECTIONS[name];
  const isNew = !existing;
  const base = existing ?? blankItem(name, preset);
  const form = buildForm(def.fields, base);
  modal({
    title: isNew ? `Add ${def.singular}` : `Edit ${def.singular}`,
    body: form.el,
    actions: [
      { label: 'Cancel', kind: 'ghost' },
      {
        label: isNew ? `Add ${def.singular}` : 'Save',
        kind: 'gold',
        onClick: () => {
          const { ok, values } = form.validate();
          if (!ok) return false; // keep the dialog open, errors are shown inline
          const next = { ...values, id: base.id };
          const list = ctx.content[name];
          if (isNew) list.push(next);
          else list[list.findIndex((i) => i.id === base.id)] = next;
          ctx.changed();
          toast(isNew ? `Added “${next[def.title]}” — press Publish to make it live.` : 'Updated — press Publish to make it live.');
        },
      },
    ],
  });
}

async function removeItem(ctx, name, item) {
  const def = COLLECTIONS[name];
  const ok = await confirmDialog({ title: `Delete this ${def.singular}?`, message: `“${item[def.title]}” will be removed from the ${ADMIN_PAGES.find((p) => p.sections.includes(name))?.label ?? ''} page once you publish.` });
  if (!ok) return;
  const list = ctx.content[name];
  const index = list.findIndex((i) => i.id === item.id);
  if (index < 0) return;
  list.splice(index, 1);
  ctx.changed();
  toast(`Deleted “${item[def.title]}”.`, {
    action: {
      label: 'Undo',
      onClick: () => {
        list.splice(Math.min(index, list.length), 0, item);
        ctx.changed();
      },
    },
  });
}

/* ==========================================================================
   Generic list section (testimonials, pairings, roasts, timeline, values, team, origins)
   ========================================================================== */
const ROW = {
  pairings: { title: (i) => `${i.drink}  +  ${i.bake}`, sub: (i) => i.why },
  roasts: { title: (i) => i.name, tag: (i) => i.origin, sub: (i) => i.notes, extra: (i) => `Body ${i.body} · Acidity ${i.acidity} · Roast ${i.roast}` },
  testimonials: { title: (i) => i.name, tag: (i) => i.role, sub: (i) => `“${i.quote}”` },
  timeline: { title: (i) => `${i.year} · ${i.title}`, sub: (i) => i.text },
  values: { title: (i) => `${i.icon}  ${i.title}`, sub: (i) => i.text },
  team: { title: (i) => i.name, tag: (i) => i.role, sub: (i) => i.bio },
  origins: { title: (i) => i.name, tag: (i) => i.alt, sub: (i) => i.note },
  faqs: { title: (i) => i.q, tag: (i) => catLabel(FAQ_CATEGORIES, i.category), sub: (i) => i.a },
};

function rowFor(ctx, name, item, position, { isVisible, openable } = {}) {
  const spec = ROW[name];
  const list = ctx.content[name];
  const move = (dir) => moveWithin(list, item.id, dir, isVisible) && ctx.changed();
  const tag = spec.tag?.(item);
  const row = h(
    'article',
    { class: `row card${openable ? ' row--clickable' : ''}` },
    h('span', { class: 'row__no' }, position),
    h(
      'div',
      { class: 'row__main', onclick: openable ? () => row.classList.toggle('is-open') : undefined },
      h('div', { class: 'row__title' }, spec.title(item), tag ? h('span', { class: 'tag tag--gold' }, tag) : null),
      spec.sub(item) ? h('div', { class: 'row__sub' }, spec.sub(item)) : null,
      spec.extra ? h('div', { class: 'mini-bars' }, spec.extra(item)) : null
    ),
    h(
      'div',
      { class: 'row__actions' },
      h('button', { class: 'icon-btn', type: 'button', title: 'Move up', 'aria-label': 'Move up', onclick: () => move(-1) }, icon('up')),
      h('button', { class: 'icon-btn', type: 'button', title: 'Move down', 'aria-label': 'Move down', onclick: () => move(1) }, icon('down')),
      h('button', { class: 'icon-btn', type: 'button', title: 'Edit', 'aria-label': `Edit ${spec.title(item)}`, onclick: () => openEditor(ctx, name, item) }, icon('edit')),
      h('button', { class: 'icon-btn icon-btn--danger', type: 'button', title: 'Delete', 'aria-label': `Delete ${spec.title(item)}`, onclick: () => removeItem(ctx, name, item) }, icon('x'))
    )
  );
  return row;
}

function listSection(ctx, name, lead) {
  const def = COLLECTIONS[name];
  const list = ctx.content[name];
  return section(
    sectionHead(def.label, lead ?? `${list.length} ${list.length === 1 ? def.singular : def.singular + 's'}`, h('button', { class: 'btn btn-gold btn-sm', type: 'button', onclick: () => openEditor(ctx, name) }, `+ Add ${def.singular}`)),
    list.length ? h('div', { class: 'rows' }, list.map((item, i) => rowFor(ctx, name, item, i + 1))) : h('div', { class: 'empty' }, `No ${def.singular}s yet. Use “Add ${def.singular}” to create the first one.`)
  );
}

/* ==========================================================================
   MENU
   ========================================================================== */
function dishCard(ctx, item) {
  const state = view.menu;
  const baseline = ctx.baseline.menu?.[item.id];
  const tagBadge = (t) => {
    const labels = { signature: ['Signature', 'gold'], new: ['New', 'gold'], veg: ['Veg', 'green'], vegan: ['Vegan', 'green'], gf: ['Gluten-free', ''], spicy: ['Spiced', ''] };
    const [label, tone] = labels[t] ?? [];
    return label ? h('span', { class: `tag${tone ? ` tag--${tone}` : ''}` }, label) : null;
  };

  const priceInput = h('input', { type: 'number', min: 0, max: 100000, step: 1, inputmode: 'numeric', value: item.price, 'aria-label': `Price of ${item.name}` });
  const priceBox = h('label', { class: `price-field${baseline && baseline.price !== item.price ? ' is-changed' : ''}` }, h('span', {}, '₹'), priceInput);
  priceInput.addEventListener('input', () => {
    const n = Number(priceInput.value);
    const valid = priceInput.value !== '' && Number.isFinite(n) && n >= 0 && n <= 100000;
    priceInput.style.color = valid ? '' : 'var(--danger)';
    if (!valid) return;
    item.price = Math.round(n);
    priceBox.classList.toggle('is-changed', !baseline || baseline.price !== item.price);
    ctx.changed({ rerender: false });
  });
  priceInput.addEventListener('blur', () => {
    priceInput.value = item.price; // restore the last valid value if the box was left empty / invalid
    priceInput.style.color = '';
  });

  const featured = h('input', { type: 'checkbox', checked: item.featured });
  featured.addEventListener('change', () => {
    item.featured = featured.checked;
    ctx.changed({ rerender: false });
  });

  const img = h('img', { src: item.image, alt: item.name, loading: 'lazy', referrerpolicy: 'no-referrer' });
  img.addEventListener('error', () => (img.style.visibility = 'hidden'));

  return h(
    'article',
    { class: 'dish card' },
    h('div', { class: 'dish__img' }, img, h('div', { class: 'dish__tags' }, item.tags.map(tagBadge))),
    h(
      'div',
      { class: 'dish__body' },
      h('div', { class: 'dish__top' }, h('h3', {}, item.name), priceBox),
      h('span', { class: 'tag' }, catLabel(MENU_CATEGORIES, item.category)),
      h('p', { class: 'dish__desc' }, item.desc),
      item.notes ? h('p', { class: 'dish__notes' }, item.notes) : null,
      h(
        'div',
        { class: 'dish__actions' },
        h('label', { class: 'star', title: 'Show in “Signature picks” on the Home page' }, featured, ' On Home'),
        h('span', { class: 'grow' }),
        h('button', { class: 'icon-btn', type: 'button', title: 'Move earlier', 'aria-label': 'Move earlier', onclick: () => moveWithin(ctx.content.menu, item.id, -1, (i) => state.cat === 'all' || i.category === state.cat) && ctx.changed() }, icon('left')),
        h('button', { class: 'icon-btn', type: 'button', title: 'Move later', 'aria-label': 'Move later', onclick: () => moveWithin(ctx.content.menu, item.id, 1, (i) => state.cat === 'all' || i.category === state.cat) && ctx.changed() }, icon('right')),
        h('button', { class: 'icon-btn', type: 'button', title: 'Edit all details', 'aria-label': `Edit ${item.name}`, onclick: () => openEditor(ctx, 'menu', item) }, icon('edit')),
        h('button', { class: 'icon-btn icon-btn--danger', type: 'button', title: 'Delete', 'aria-label': `Delete ${item.name}`, onclick: () => removeItem(ctx, 'menu', item) }, icon('x'))
      )
    )
  );
}

function menuSection(ctx) {
  const state = view.menu;
  const items = ctx.content.menu;
  const counts = { all: items.length };
  MENU_CATEGORIES.forEach(([id]) => (counts[id] = items.filter((i) => i.category === id).length));

  const grid = h('div', { class: 'menu-grid' });
  const info = h('p', { class: 'muted', style: { margin: '0 0 1rem', fontSize: '0.8rem' } });
  const paint = () => {
    const q = state.q.trim().toLowerCase();
    const shown = items.filter((i) => (state.cat === 'all' || i.category === state.cat) && (!q || `${i.name} ${i.desc} ${i.notes}`.toLowerCase().includes(q)));
    info.textContent = `Showing ${shown.length} of ${items.length} dishes · edit a price right on its card`;
    grid.replaceChildren(
      ...shown.map((i) => dishCard(ctx, i)),
      h('button', { class: 'add-card', type: 'button', onclick: () => openEditor(ctx, 'menu', null, state.cat !== 'all' ? { category: state.cat } : {}) }, h('b', {}, '+'), 'Add a dish')
    );
  };
  paint();

  return section(
    sectionHead('Menu items', 'Same cards your visitors see — with the price editable on each one.'),
    h(
      'div',
      { class: 'toolbar' },
      chipBar([['all', 'All'], ...MENU_CATEGORIES], state.cat, counts, (id) => ((state.cat = id), ctx.rerender())),
      search('Search the menu', state.q, (v) => ((state.q = v), paint()))
    ),
    info,
    grid
  );
}

/* ==========================================================================
   GALLERY
   ========================================================================== */
function gallerySection(ctx) {
  const state = view.gallery;
  const items = ctx.content.gallery;
  const counts = { all: items.length };
  GALLERY_CATEGORIES.forEach(([id]) => (counts[id] = items.filter((i) => i.cat === id).length));
  const visible = (i) => state.cat === 'all' || i.cat === state.cat;

  const fileInput = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif,image/avif', multiple: true, hidden: true });
  const zone = h(
    'div',
    { class: 'dropzone' },
    h('strong', {}, 'Drop photos here'),
    h('span', { class: 'muted', style: { fontSize: '0.85rem' } }, 'JPG, PNG, WebP, GIF or AVIF · up to 6 MB each · you can add many at once'),
    h(
      'div',
      { class: 'dropzone__actions' },
      h('button', { class: 'btn btn-gold btn-sm', type: 'button', onclick: () => fileInput.click() }, 'Choose photos'),
      h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => openEditor(ctx, 'gallery', null, state.cat !== 'all' ? { cat: state.cat } : {}) }, 'Add from a link'),
      fileInput
    )
  );

  async function addPhotos(fileList) {
    const files = [...fileList].filter((f) => f.type.startsWith('image/'));
    if (!files.length) return toast('Please choose image files.', { type: 'error' });
    zone.style.opacity = '0.6';
    zone.style.pointerEvents = 'none';
    let added = 0;
    for (const file of files) {
      try {
        const src = await uploadImage(file);
        const title = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 80) || 'New photo';
        ctx.content.gallery.push({ id: genId(), src, title, tag: 'New', cat: state.cat !== 'all' ? state.cat : 'coffee', size: '' });
        added++;
      } catch (e) {
        toast(`${file.name}: ${e.message}`, { type: 'error' });
      }
    }
    if (added) {
      ctx.changed();
      toast(`${added} photo${added > 1 ? 's' : ''} added at the end — edit captions with ✎, then press Publish.`);
    } else {
      zone.style.opacity = '';
      zone.style.pointerEvents = '';
    }
  }
  fileInput.addEventListener('change', () => (addPhotos(fileInput.files), (fileInput.value = '')));
  ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => (e.preventDefault(), zone.classList.add('is-over'))));
  ['dragleave', 'drop'].forEach((ev) => zone.addEventListener(ev, (e) => (e.preventDefault(), zone.classList.remove('is-over'))));
  zone.addEventListener('drop', (e) => addPhotos(e.dataTransfer.files));

  const tiles = items.map((item, index) => {
    if (!visible(item)) return null;
    const img = h('img', { src: item.src, alt: item.title, loading: 'lazy', referrerpolicy: 'no-referrer' });
    img.addEventListener('error', () => (img.style.visibility = 'hidden'));
    const move = (dir) => moveWithin(items, item.id, dir, visible) && ctx.changed();
    return h(
      'figure',
      { class: `g-tile card${item.size ? ` g-tile--${item.size}` : ''}` },
      img,
      h('span', { class: 'g-tile__no', title: 'Position in the gallery' }, index + 1),
      h(
        'div',
        { class: 'g-tile__bar' },
        h('button', { class: 'icon-btn', type: 'button', title: 'Move earlier', 'aria-label': 'Move earlier', onclick: () => move(-1) }, icon('left')),
        h('button', { class: 'icon-btn', type: 'button', title: 'Move later', 'aria-label': 'Move later', onclick: () => move(1) }, icon('right')),
        h('button', { class: 'icon-btn', type: 'button', title: 'Edit caption & details', 'aria-label': `Edit ${item.title}`, onclick: () => openEditor(ctx, 'gallery', item) }, icon('edit')),
        h('button', { class: 'icon-btn icon-btn--danger', type: 'button', title: 'Delete photo', 'aria-label': `Delete ${item.title}`, onclick: () => removeItem(ctx, 'gallery', item) }, icon('x'))
      ),
      h('figcaption', { class: 'g-tile__meta' }, h('small', {}, item.tag || catLabel(GALLERY_CATEGORIES, item.cat)), h('strong', {}, item.title))
    );
  });

  return section(
    sectionHead('Gallery photos', 'The grid below is in the same order and shape as the Gallery page.'),
    zone,
    h('div', { class: 'toolbar' }, chipBar([['all', 'All'], ...GALLERY_CATEGORIES], state.cat, counts, (id) => ((state.cat = id), ctx.rerender()))),
    tiles.some(Boolean) ? h('div', { class: 'gallery-grid' }, tiles) : h('div', { class: 'empty' }, 'No photos here yet — drop some above.')
  );
}

/* ==========================================================================
   FAQS
   ========================================================================== */
function faqsSection(ctx) {
  const state = view.faqs;
  const items = ctx.content.faqs;
  const counts = { all: items.length };
  FAQ_CATEGORIES.forEach(([id]) => (counts[id] = items.filter((i) => i.category === id).length));
  const visible = (i) => (state.cat === 'all' || i.category === state.cat) && (!state.q.trim() || `${i.q} ${i.a}`.toLowerCase().includes(state.q.trim().toLowerCase()));

  const list = h('div', { class: 'rows' });
  const paint = () => {
    const shown = items.filter(visible);
    list.replaceChildren(...(shown.length ? shown.map((item) => rowFor(ctx, 'faqs', item, items.indexOf(item) + 1, { isVisible: visible, openable: true })) : [h('div', { class: 'empty' }, 'No questions match.')]));
  };
  paint();

  return section(
    sectionHead('Questions & answers', 'Click a question to read the full answer. Order here = order on the FAQs page.', h('button', { class: 'btn btn-gold btn-sm', type: 'button', onclick: () => openEditor(ctx, 'faqs', null, state.cat !== 'all' ? { category: state.cat } : {}) }, '+ Add question')),
    h('div', { class: 'toolbar' }, chipBar([['all', 'All'], ...FAQ_CATEGORIES], state.cat, counts, (id) => ((state.cat = id), ctx.rerender())), search('Search questions', state.q, (v) => ((state.q = v), paint()))),
    list
  );
}

/* ==========================================================================
   CONTACT (address, phone, email, hours)
   ========================================================================== */
function settingsSection(ctx) {
  const s = ctx.content.settings;

  const form = buildForm(SETTINGS_FIELDS, s);
  const sync = () => Object.assign(s, form.collect()) && ctx.changed({ rerender: false });
  form.el.addEventListener('input', sync);
  form.el.addEventListener('change', sync);

  const hours = h(
    'div',
    { class: 'hours' },
    WEEKDAYS.map(({ n, label }) => {
      const day = (s.hours[n] ??= { closed: false, open: '07:00', close: '22:00' });
      const timeSelect = (key) => {
        const sel = h('select', { class: 'input', 'aria-label': `${label} ${key === 'open' ? 'opens' : 'closes'}` }, TIME_SLOTS.map((t) => h('option', { value: t }, fmt12(t))));
        sel.value = day[key];
        sel.addEventListener('change', () => ((day[key] = sel.value), ctx.changed({ rerender: false })));
        return sel;
      };
      const closed = h('input', { type: 'checkbox', checked: day.closed });
      const row = h(
        'div',
        { class: `hours__row${day.closed ? ' is-closed' : ''}` },
        h('span', { class: 'hours__day' }, label),
        h('label', { class: 'switch' }, closed, h('i'), 'Closed'),
        h('div', { class: 'hours__times' }, timeSelect('open'), h('span', { class: 'muted' }, 'to'), timeSelect('close'))
      );
      closed.addEventListener('change', () => {
        day.closed = closed.checked;
        row.classList.toggle('is-closed', day.closed);
        ctx.changed({ rerender: false });
      });
      return row;
    })
  );

  return [
    section(sectionHead('Contact details', 'Shown on the Contact page, the footer and the mobile menu.'), h('div', { class: 'card settings-card' }, form.el)),
    section(sectionHead('Opening hours', 'Also drives the live “Open now” badge and the time slots offered in the reservation form.'), h('div', { class: 'card settings-card' }, hours)),
  ];
}
const fmt12 = (t) => {
  const [hh, mm] = t.split(':').map(Number);
  return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
};

/* ==========================================================================
   Page assembly (tabs are in the same order as the public site's navigation)
   ========================================================================== */
export function renderPage(pageId, ctx) {
  const page = ADMIN_PAGES.find((p) => p.id === pageId) ?? ADMIN_PAGES[1];
  const nodes = [pageHero(page)];
  switch (page.id) {
    case 'home':
      nodes.push(listSection(ctx, 'testimonials'));
      break;
    case 'menu':
      nodes.push(menuSection(ctx), listSection(ctx, 'pairings'), listSection(ctx, 'roasts'));
      break;
    case 'gallery':
      nodes.push(gallerySection(ctx));
      break;
    case 'faqs':
      nodes.push(faqsSection(ctx));
      break;
    case 'about':
      nodes.push(listSection(ctx, 'timeline'), listSection(ctx, 'values'), listSection(ctx, 'team'), listSection(ctx, 'origins'));
      break;
    case 'contact':
      nodes.push(...settingsSection(ctx));
      break;
  }
  return nodes;
}
