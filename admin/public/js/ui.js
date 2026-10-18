// UI helpers: tiny hyperscript `h()`, toasts, modal, confirm dialog and the schema-driven form builder.
// Everything is built with DOM nodes / textContent (never innerHTML with user data) so content can't inject markup.
import { sanitizeField } from '/schema.js';
import { uploadImage } from './api.js';

/** h('div', { class: 'x', onclick: fn, dataset: {a: 1} }, 'text', childNode, [more]) */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key === 'dataset') Object.assign(el.dataset, value);
    else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
    else if (value === true) el.setAttribute(key, '');
    else el.setAttribute(key, value);
  }
  const add = (child) => {
    if (Array.isArray(child)) return child.forEach(add);
    if (child === null || child === undefined || child === false) return;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  };
  children.forEach(add);
  return el;
}


/* ---------- Icons (inline SVG, created in the SVG namespace) ---------- */
const ICON_PATHS = {
  edit: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  x: 'M18 6 6 18M6 6l12 12',
  up: 'M12 19V5M5 12l7-7 7 7',
  down: 'M12 5v14M19 12l-7 7-7-7',
  left: 'M19 12H5M12 19l-7-7 7-7',
  right: 'M5 12h14M12 5l7 7-7 7',
};
export function icon(name, size = 15) {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor', 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' })) svg.setAttribute(k, v);
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', ICON_PATHS[name]);
  svg.append(path);
  return svg;
}

/* ---------- Toasts ---------- */
export function toast(message, { type = 'success', action, duration = 4500 } = {}) {
  const wrap = document.getElementById('toasts');
  const el = h(
    'div',
    { class: `toast${type === 'error' ? ' toast--error' : ''}`, role: type === 'error' ? 'alert' : 'status' },
    h('span', { class: 'toast__icon' }, type === 'error' ? '!' : '✓'),
    h('span', {}, message)
  );
  const remove = () => el.remove();
  if (action) {
    el.append(
      h('button', { type: 'button', onclick: () => (action.onClick(), remove()) }, action.label)
    );
  }
  wrap.append(el);
  setTimeout(remove, action ? Math.max(duration, 7000) : duration);
}

/* ---------- Modal ---------- */
let openModals = 0;
/**
 * modal({ title, body, actions: [{label, kind: 'gold'|'ghost'|'danger', onClick: () => false to keep open}], size })
 * Returns { close, el }.
 */
export function modal({ title, body, actions = [], size = '', onClose }) {
  const previouslyFocused = document.activeElement;
  const closeBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close' }, icon('x'));
  const foot = actions.length
    ? h(
        'div',
        { class: 'modal__foot' },
        actions.map((a) =>
          h(
            'button',
            {
              type: 'button',
              class: `btn btn-sm btn-${a.kind ?? 'ghost'}`,
              onclick: async (e) => {
                const keepOpen = (await a.onClick?.(e)) === false;
                if (!keepOpen) close();
              },
            },
            a.label
          )
        )
      )
    : null;
  const dialog = h(
    'div',
    { class: `modal ${size ? `modal--${size}` : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'modal__head' }, h('h2', {}, title), closeBtn),
    h('div', { class: 'modal__body' }, body),
    foot
  );
  const backdrop = h('div', { class: 'modal-backdrop' }, dialog);

  function close() {
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
    if (--openModals === 0) document.documentElement.style.overflow = '';
    previouslyFocused?.focus?.();
    onClose?.();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      // keep keyboard focus inside the dialog
      const focusable = [...dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter((n) => !n.disabled && n.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
    }
  }
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('mousedown', (e) => e.target === backdrop && close());
  document.addEventListener('keydown', onKey);
  document.body.append(backdrop);
  openModals++;
  document.documentElement.style.overflow = 'hidden';
  setTimeout(() => (dialog.querySelector('input:not([type=hidden]), textarea, select') ?? closeBtn).focus(), 30);
  return { close, el: dialog };
}

export function confirmDialog({ title = 'Are you sure?', message, confirmLabel = 'Delete', kind = 'danger' }) {
  return new Promise((resolve) => {
    let decided = false;
    modal({
      title,
      size: 'sm',
      body: h('p', { class: 'muted' }, message),
      actions: [
        { label: 'Cancel', kind: 'ghost', onClick: () => ((decided = true), resolve(false)) },
        { label: confirmLabel, kind, onClick: () => ((decided = true), resolve(true)) },
      ],
      onClose: () => !decided && resolve(false),
    });
  });
}

/* ---------- Form builder (driven by schema.js) ---------- */
let uid = 0;

/**
 * buildForm(fields, values) -> { el, collect(), validate() }
 *   collect()  returns the raw values typed so far
 *   validate() shows inline errors, returns { ok, values } with cleaned values
 */
export function buildForm(fields, values = {}) {
  const readers = {};
  const errorEls = {};
  const inputs = {};
  const grid = h('div', { class: 'form-grid' });

  for (const field of fields) {
    const id = `f-${++uid}-${field.key}`;
    const wide = field.type === 'textarea' || field.type === 'image' || field.type === 'tags' || field.type === 'bool';
    const err = h('div', { class: 'error', id: `${id}-err` });
    errorEls[field.key] = err;
    let control;
    const value = values[field.key];

    switch (field.type) {
      case 'text': {
        const input = h('input', { class: 'input', id, type: 'text', maxlength: field.max ?? 200, value: value ?? '', 'aria-describedby': `${id}-err` });
        inputs[field.key] = input;
        readers[field.key] = () => input.value;
        control = input;
        break;
      }
      case 'textarea': {
        const input = h('textarea', { class: 'input', id, maxlength: field.max ?? 1000, rows: 4, 'aria-describedby': `${id}-err` });
        input.value = value ?? '';
        inputs[field.key] = input;
        readers[field.key] = () => input.value;
        control = input;
        break;
      }
      case 'number': {
        const input = h('input', { class: 'input', id, type: 'number', inputmode: 'numeric', step: 1, min: field.min, max: field.max, value: value ?? '', 'aria-describedby': `${id}-err` });
        inputs[field.key] = input;
        readers[field.key] = () => input.value;
        control = input;
        break;
      }
      case 'select': {
        const select = h('select', { class: 'input', id }, field.options.map(([val, label]) => h('option', { value: val }, label)));
        select.value = value ?? field.options[0][0];
        inputs[field.key] = select;
        readers[field.key] = () => select.value;
        control = select;
        break;
      }
      case 'tags': {
        const picked = new Set(value ?? []);
        const boxes = field.options.map(([val, label]) =>
          h('label', {}, h('input', { type: 'checkbox', value: val, checked: picked.has(val) }), h('span', {}, label))
        );
        readers[field.key] = () => boxes.map((b) => b.firstChild).filter((i) => i.checked).map((i) => i.value);
        control = h('div', { class: 'tag-picker' }, boxes);
        break;
      }
      case 'bool': {
        const input = h('input', { type: 'checkbox', id, checked: value === true });
        readers[field.key] = () => input.checked;
        inputs[field.key] = input;
        control = h('label', { class: 'switch' }, input, h('i'), field.label);
        break;
      }
      case 'image': {
        const picker = imageField(id, value ?? '', err);
        readers[field.key] = picker.read;
        inputs[field.key] = picker.input;
        control = picker.el;
        break;
      }
    }

    const showLabel = field.type !== 'bool';
    grid.append(
      h(
        'div',
        { class: `field ${wide ? 'span-2' : ''}` },
        showLabel ? h('label', { for: id }, field.label, field.required ? ' *' : '') : null,
        control,
        field.hint ? h('div', { class: 'hint' }, field.hint) : null,
        err
      )
    );
  }

  const collect = () => Object.fromEntries(Object.entries(readers).map(([k, read]) => [k, read()]));

  function validate() {
    const raw = collect();
    const cleaned = {};
    let firstBad = null;
    for (const field of fields) {
      const { value, error } = sanitizeField(field, raw[field.key]);
      errorEls[field.key].textContent = error ?? '';
      inputs[field.key]?.classList?.toggle('is-invalid', !!error);
      if (error && !firstBad) firstBad = inputs[field.key];
      else if (!error) cleaned[field.key] = value;
    }
    firstBad?.focus?.();
    return { ok: !firstBad, values: cleaned };
  }

  return { el: grid, collect, validate };
}

function imageField(id, initial, errEl) {
  const preview = h('div', { class: 'image-field__preview' }, 'No photo');
  const input = h('input', { class: 'input', id, type: 'text', placeholder: 'https://… or upload a file', value: initial, maxlength: 600 });
  const fileInput = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif,image/avif', hidden: true });
  const status = h('span', { class: 'hint' });
  const uploadBtn = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: () => fileInput.click() }, 'Upload photo');

  const refresh = () => {
    const url = input.value.trim();
    preview.replaceChildren();
    if (!url) return preview.append('No photo');
    const img = h('img', { alt: '', src: url, referrerpolicy: 'no-referrer' });
    img.addEventListener('error', () => preview.replaceChildren('Can’t load this image'));
    preview.append(img);
  };
  input.addEventListener('change', refresh);
  input.addEventListener('blur', refresh);
  refresh();

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    if (!file) return;
    uploadBtn.disabled = true;
    status.textContent = 'Uploading…';
    errEl.textContent = '';
    try {
      input.value = await uploadImage(file);
      refresh();
      status.textContent = 'Uploaded ✓';
    } catch (e) {
      status.textContent = '';
      errEl.textContent = e.message;
    } finally {
      uploadBtn.disabled = false;
      fileInput.value = '';
    }
  });

  return {
    input,
    read: () => input.value,
    el: h('div', { class: 'image-field' }, preview, h('div', { class: 'image-field__controls' }, input, h('div', { class: 'image-field__row' }, uploadBtn, status), fileInput)),
  };
}
