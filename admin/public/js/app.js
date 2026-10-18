// Admin app controller: login, tabs, publish / discard, unsaved-changes protection.
import { ADMIN_PAGES, sanitizeContent } from '/schema.js';
import { getConfig, login, loadContent, saveContent, getToken, clearToken, setUnauthorizedHandler, ApiError } from './api.js';
import { h, toast, modal, confirmDialog } from './ui.js';
import { renderPage } from './views.js';
import { initThemeToggles } from './sun-moon-toggle.js';

const $ = (id) => document.getElementById(id);
const els = {
  login: $('login'),
  loginForm: $('login-form'),
  loginError: $('login-error'),
  loginWarn: $('login-warn'),
  loginSubmit: $('login-submit'),
  app: $('app'),
  nav: $('nav'),
  main: $('main'),
  status: $('status'),
  publish: $('publish'),
  discard: $('discard'),
  logout: $('logout'),
  exportBtn: $('export'),
  viewSite: $('view-site'),
};

const state = { rev: 0, content: null, baseline: null, dirty: false, saving: false, page: 'menu' };
const clone = (v) => JSON.parse(JSON.stringify(v));

/* ---------- Context handed to the views ---------- */
const ctx = {
  get content() {
    return state.content;
  },
  get baseline() {
    return state.baseline;
  },
  /** Call after any edit. By default re-draws the page; pass { rerender: false } when typing in a field. */
  changed({ rerender = true } = {}) {
    state.dirty = true;
    paintStatus();
    if (rerender) render();
  },
  rerender: () => render(),
};

/* ---------- Rendering ---------- */
function paintNav() {
  els.nav.replaceChildren(
    ...ADMIN_PAGES.map((p) => h('a', { href: `#/${p.id}`, class: p.id === state.page ? 'is-active' : '', 'aria-current': p.id === state.page ? 'page' : null }, p.label))
  );
}

function paintStatus() {
  els.publish.disabled = !state.dirty || state.saving;
  els.publish.textContent = state.saving ? 'Publishing…' : 'Publish changes';
  els.discard.hidden = !state.dirty;
  els.status.replaceChildren(
    state.dirty ? h('span', { class: 'pill pill--warn' }, h('i', { class: 'pulse' }), 'Unsaved changes') : h('span', {}, 'All changes published')
  );
}

function render() {
  const y = window.scrollY;
  paintNav();
  els.main.replaceChildren(...renderPage(state.page, ctx));
  window.scrollTo(0, y);
}

function route() {
  const id = location.hash.replace(/^#\/?/, '');
  const prev = state.page;
  state.page = ADMIN_PAGES.some((p) => p.id === id) ? id : 'menu';
  if (!state.content) return;
  render();
  if (prev !== state.page) window.scrollTo(0, 0);
}

/* ---------- Screens ---------- */
function showLogin(message = '') {
  els.app.hidden = true;
  els.login.hidden = false;
  els.loginError.textContent = message;
  $('password').value = '';
  $('password').focus();
}

async function enterApp() {
  const data = await loadContent();
  state.rev = data.rev;
  state.content = data.content;
  state.baseline = clone(data.content);
  // baseline lookup by id for "price changed" highlighting
  state.baseline.menu = Object.fromEntries(data.content.menu.map((m) => [m.id, clone(m)]));
  state.dirty = false;
  els.login.hidden = true;
  els.app.hidden = false;
  paintStatus();
  route();
}

/* ---------- Publish / discard ---------- */
async function publish() {
  if (!state.dirty || state.saving) return;
  const { content, errors } = sanitizeContent(state.content);
  if (errors.length) return showErrors(errors);

  state.saving = true;
  paintStatus();
  try {
    const saved = await saveContent(state.rev, content);
    state.rev = saved.rev;
    state.content = saved.content;
    state.baseline = clone(saved.content);
    state.baseline.menu = Object.fromEntries(saved.content.menu.map((m) => [m.id, clone(m)]));
    state.dirty = false;
    toast('Published! Your website will show the changes on its next load.');
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      modal({
        title: 'Changed somewhere else',
        size: 'sm',
        body: h('p', { class: 'muted' }, err.message),
        actions: [{ label: 'Reload latest', kind: 'gold', onClick: () => location.reload() }],
      });
    } else if (err instanceof ApiError && err.status === 422) {
      showErrors(err.errors);
    } else if (!(err instanceof ApiError && err.status === 401)) {
      toast(err.message || 'Could not publish.', { type: 'error' });
    }
  } finally {
    state.saving = false;
    paintStatus();
    render();
  }
}

function showErrors(errors) {
  modal({
    title: 'Please fix these first',
    body: h('div', {}, h('p', { class: 'muted' }, 'Nothing was published. Fix the items below and try again.'), h('ul', { class: 'error-list' }, errors.slice(0, 12).map((e) => h('li', {}, e)), errors.length > 12 ? h('li', {}, `…and ${errors.length - 12} more`) : null)),
    actions: [{ label: 'OK', kind: 'gold' }],
  });
}

async function discard() {
  const ok = await confirmDialog({ title: 'Discard changes?', message: 'Everything you changed since the last publish will be lost.', confirmLabel: 'Discard' });
  if (!ok) return;
  await enterApp();
  toast('Changes discarded.');
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(state.content, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `mycafe-content-${new Date().toISOString().slice(0, 10)}.json` });
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

/* ---------- Wiring ---------- */
els.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  els.loginError.textContent = '';
  els.loginSubmit.disabled = true;
  try {
    await login($('password').value);
    await enterApp();
  } catch (err) {
    els.loginError.textContent = err.message;
  } finally {
    els.loginSubmit.disabled = false;
  }
});

els.publish.addEventListener('click', publish);
els.discard.addEventListener('click', discard);
els.exportBtn.addEventListener('click', exportBackup);
els.logout.addEventListener('click', async () => {
  if (state.dirty && !(await confirmDialog({ title: 'Log out?', message: 'You have unpublished changes that will be lost.', confirmLabel: 'Log out' }))) return;
  state.dirty = false;
  clearToken();
  showLogin();
});

window.addEventListener('hashchange', route);
window.addEventListener('beforeunload', (e) => {
  if (state.dirty) (e.preventDefault(), (e.returnValue = ''));
});
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') (e.preventDefault(), publish());
});
setUnauthorizedHandler(() => {
  state.dirty = false;
  clearToken();
  showLogin('Your session expired — please log in again.');
});

/* ---------- Boot ---------- */
(async function boot() {
  initThemeToggles();
  try {
    const config = await getConfig();
    els.loginWarn.hidden = !config.defaultPassword;
    if (config.siteUrl) {
      els.viewSite.href = config.siteUrl;
      els.viewSite.hidden = false;
    }
  } catch {
    /* config is optional */
  }
  if (getToken()) {
    try {
      await enterApp();
      return;
    } catch {
      /* token expired or server restarted -> fall through to login */
    }
  }
  showLogin();
})();
