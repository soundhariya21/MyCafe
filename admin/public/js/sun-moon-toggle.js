// Sun / moon theme toggle — the same animation as the public site's React component, in plain JS.
// The moon sets and the sun rises along an arc, a night / day sky cross-fades inside the button,
// and the whole page fades between themes.
const KEY = 'mycafe-admin-theme';
const DURATION = 1740;
const ARC_RADIUS = 115;
const QUARTER_TURN = Math.PI / 2;
const STEPS = 30;
const MOON = { side: -1, spin: 25 };
const SUN = { side: 1, spin: 120 };
const STARS = [
  { x: 24, y: 22, r: 1.6, t: 2100 },
  { x: 66, y: 16, r: 1.2, t: 2600 },
  { x: 80, y: 42, r: 1.8, t: 1900 },
  { x: 38, y: 58, r: 1.1, t: 2900 },
  { x: 58, y: 74, r: 1.4, t: 2300 },
  { x: 14, y: 72, r: 1.2, t: 2500 },
];
const MOON_SVG =
  '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>';
const SUN_SVG =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2m-7.07-15.07 1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
const current = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

const arc = (side, a) => ({ x: side * ARC_RADIUS * Math.sin(a), y: ARC_RADIUS * (1 - Math.cos(a)) });
const easeIn = (t) => t * t * t;
const easeOutBack = (t) => 1 + 2.4 * (t - 1) ** 3 + 1.4 * (t - 1) ** 2;

const setting = ({ side, spin }) =>
  Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const p = easeIn(t);
    const { x, y } = arc(side, p * QUARTER_TURN);
    return { offset: t, transform: `translate(${x}%, ${y}%) rotate(${side * spin * p}deg)`, opacity: t < 0.55 ? 1 : (1 - t) / 0.45 };
  });
const rising = ({ side, spin }) =>
  Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS;
    const rem = 1 - easeOutBack(t);
    const { x, y } = arc(side, rem * QUARTER_TURN);
    return { offset: t, transform: `translate(${x}%, ${y}%) rotate(${side * spin * rem}deg) scale(${1 - 0.28 * rem})`, opacity: Math.min(1, t / 0.3) };
  });
const KF = { moonSets: setting(MOON), moonRises: rising(MOON), sunSets: setting(SUN), sunRises: rising(SUN) };

let fadeTimer = 0;
function setTheme(theme) {
  if (!reduced) {
    const style = document.getElementById('theme-fade') ?? document.head.appendChild(Object.assign(document.createElement('style'), { id: 'theme-fade' }));
    style.textContent = `*,*::before,*::after{transition-property:color,background-color,border-color,outline-color,fill,stroke !important;transition-duration:${DURATION}ms !important;transition-timing-function:cubic-bezier(0.65,0,0.35,1) !important;transition-delay:0s !important}`;
    clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => style.remove(), DURATION + 100);
  }
  root.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* ignore */
  }
}

function mount(button) {
  const stars = STARS.map((s) => `<span class="sm-toggle__star" data-star style="left:${s.x}%;top:${s.y}%;width:${s.r * 2}px;height:${s.r * 2}px"></span>`).join('');
  button.innerHTML = `
    <span class="sm-toggle__sky sm-toggle__sky--night" aria-hidden="true">${stars}</span>
    <span class="sm-toggle__sky sm-toggle__sky--day" aria-hidden="true"></span>
    <span class="sm-toggle__body sm-toggle__body--moon" aria-hidden="true">${MOON_SVG}</span>
    <span class="sm-toggle__body sm-toggle__body--sun" aria-hidden="true">${SUN_SVG}</span>`;
  const night = button.querySelector('.sm-toggle__sky--night');
  const day = button.querySelector('.sm-toggle__sky--day');
  const moon = button.querySelector('.sm-toggle__body--moon');
  const sun = button.querySelector('.sm-toggle__body--sun');
  let flight = [];

  const rest = (theme) => {
    const place = (el, body, visible) => {
      el.style.transform = visible ? 'none' : `translate(${body.side * ARC_RADIUS}%, ${ARC_RADIUS}%)`;
      el.style.opacity = visible ? '1' : '0';
    };
    place(moon, MOON, theme === 'dark');
    place(sun, SUN, theme === 'light');
    night.style.opacity = theme === 'dark' ? '1' : '0';
    day.style.opacity = theme === 'light' ? '1' : '0';
    button.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  };

  const swap = (next) => {
    if (flight.length) return flight.forEach((a) => a.reverse());
    if (reduced || typeof moon.animate !== 'function') return;
    const toLight = next === 'light';
    const a1 = (toLight ? moon : sun).animate(toLight ? KF.moonSets : KF.sunSets, { duration: DURATION * 0.65, fill: 'both' });
    const a2 = (toLight ? sun : moon).animate(toLight ? KF.sunRises : KF.moonRises, { duration: DURATION * 0.64, delay: DURATION * 0.36, fill: 'both' });
    const o = { duration: DURATION, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'both' };
    const a3 = night.animate([{ opacity: toLight ? 1 : 0 }, { opacity: toLight ? 0 : 1 }], o);
    const a4 = day.animate([{ opacity: toLight ? 0 : 1 }, { opacity: toLight ? 1 : 0 }], o);
    const pair = [a1, a2, a3, a4];
    flight = pair;
    Promise.all(pair.map((a) => a.finished)).then(
      () => {
        if (flight !== pair) return;
        flight = [];
        pair.forEach((a) => a.cancel());
      },
      () => {}
    );
  };

  if (!reduced && typeof night.animate === 'function') {
    night.querySelectorAll('[data-star]').forEach((star, i) =>
      star.animate([{ opacity: 0.35 }, { opacity: 1 }, { opacity: 0.35 }], { duration: STARS[i].t, delay: -i * 530, iterations: Infinity, easing: 'ease-in-out' })
    );
  }

  let shown = current();
  rest(shown);
  button.addEventListener('click', () => setTheme(shown === 'dark' ? 'light' : 'dark'));
  new MutationObserver(() => {
    const now = current();
    if (now === shown) return;
    shown = now;
    rest(now);
    swap(now);
  }).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
}

export function initThemeToggles() {
  document.querySelectorAll('[data-theme-toggle]').forEach(mount);
}
