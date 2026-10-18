// Menu page: category filter + live search with GSAP Flip, pairings and roast meters.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, escapeHtml, reducedMotion } from '../utils.js';
import { menuItems, categories, pairings, roasts } from '../data/menu.js';
import { dishCard } from '../components/dish-card.js';
import { initTilt } from '../components/interactions.js';

export function init() {
  const grid = $('[data-menu-grid]');
  const filters = $('[data-menu-filters]');
  const search = $('[data-menu-search]');
  const count = $('[data-menu-count]');
  const empty = $('[data-menu-empty]');

  // ---- render ----
  grid.innerHTML = menuItems.map(dishCard).join('');
  filters.innerHTML = categories
    .map((c, i) => `<button type="button" role="tab" class="chip${i ? '' : ' is-active'}" data-filter="${c.id}" aria-selected="${i === 0}">${c.label}</button>`)
    .join('');
  grid.setAttribute('data-stagger', 'up');
  grid.setAttribute('data-stagger-amount', '0.07');

  const cards = $$('.dish', grid);
  let category = 'all';
  let query = '';

  const matches = (card) =>
    (category === 'all' || card.dataset.category === category) && (!query || card.dataset.name.includes(query));

  function apply(animate = true) {
    const state = animate && !reducedMotion ? Flip.getState(cards) : null;
    let visible = 0;
    cards.forEach((card) => {
      const show = matches(card);
      card.classList.toggle('is-hidden', !show);
      if (show) visible++;
    });
    empty.hidden = visible > 0;
    count.textContent = `Showing ${visible} of ${cards.length} items`;

    if (state) {
      Flip.from(state, {
        duration: 0.7,
        ease: 'power3.inOut',
        absolute: true,
        stagger: 0.03,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.2, clearProps: 'opacity,scale' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.85, duration: 0.3 }),
      });
    }
  }

  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn || btn.dataset.filter === category) return;
    category = btn.dataset.filter;
    $$('.chip', filters).forEach((c) => {
      const on = c === btn;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-selected', String(on));
    });
    apply();
  });

  let debounce;
  search.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      query = search.value.trim().toLowerCase();
      apply();
    }, 180);
  });
  $('[data-menu-clear]').addEventListener('click', () => {
    search.value = '';
    query = '';
    apply();
    search.focus();
  });

  apply(false);

  // ---- pairings ----
  $('[data-pairings]').innerHTML = pairings
    .map(
      (p, i) => `
      <article class="pairing card">
        <span class="pairing__no">0${i + 1}</span>
        <div class="pairing__combo">
          <strong>${escapeHtml(p.drink)}</strong>
          <span class="pairing__plus">+</span>
          <strong>${escapeHtml(p.bake)}</strong>
        </div>
        <p>${escapeHtml(p.why)}</p>
      </article>`
    )
    .join('');

  // ---- roasts with animated meters ----
  const meter = (label, value) => `
    <div class="meter"><span>${label}</span><div class="meter__bar"><i data-meter="${value}"></i></div></div>`;
  $('[data-roasts]').innerHTML = roasts
    .map(
      (r) => `
      <article class="roast card" data-tilt>
        <div class="roast__head">
          <h3 class="h3">${escapeHtml(r.name)}</h3>
          <span class="tag tag--gold">${escapeHtml(r.origin)}</span>
        </div>
        <p class="roast__notes">${escapeHtml(r.notes)}</p>
        ${meter('Body', r.body)}${meter('Acidity', r.acidity)}${meter('Roast', r.roast)}
      </article>`
    )
    .join('');

  $$('[data-meter]').forEach((bar) => {
    const value = Number(bar.dataset.meter) / 100;
    if (reducedMotion) return gsap.set(bar, { scaleX: value });
    gsap.fromTo(bar, { scaleX: 0 }, { scaleX: value, duration: 1.4, ease: 'power3.out', scrollTrigger: { trigger: bar, start: 'top 92%', once: true } });
  });

  initTilt();
  return null;
}
