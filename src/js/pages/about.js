// About page: timeline (scroll-drawn line), values, origins and team rendered from data.
import { gsap } from 'gsap';
import { $, $$, escapeHtml, reducedMotion } from '../utils.js';
import { loadContent } from '../data/remote.js';
import { initTilt } from '../components/interactions.js';

export async function init() {
  const { timeline, values, origins, team } = await loadContent();

  // ---- timeline ----
  const wrap = $('[data-timeline]');
  wrap.insertAdjacentHTML(
    'beforeend',
    timeline
      .map(
        (t, i) => `
        <article class="tl-item ${i % 2 ? 'tl-item--right' : ''}" data-tl>
          <span class="tl-dot" aria-hidden="true"></span>
          <div class="tl-card card">
            <span class="tl-year">${escapeHtml(t.year)}</span>
            <h3 class="h3">${escapeHtml(t.title)}</h3>
            <p>${escapeHtml(t.text)}</p>
          </div>
        </article>`
      )
      .join('')
  );

  if (!reducedMotion) {
    // The gold line draws itself as you scroll through the timeline
    gsap.fromTo(
      '[data-timeline-line]',
      { scaleY: 0 },
      { scaleY: 1, ease: 'none', scrollTrigger: { trigger: wrap, start: 'top 65%', end: 'bottom 65%', scrub: 0.5 } }
    );
    $$('[data-tl]').forEach((item) => {
      const fromX = item.classList.contains('tl-item--right') ? 60 : -60;
      const mobile = window.matchMedia('(max-width: 800px)').matches;
      gsap.from($('.tl-card', item), {
        opacity: 0,
        x: mobile ? 30 : fromX,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 82%', once: true },
      });
      gsap.from($('.tl-dot', item), {
        scale: 0,
        duration: 0.6,
        ease: 'back.out(3)',
        scrollTrigger: { trigger: item, start: 'top 75%', once: true },
      });
    });
  }

  // ---- values ----
  $('[data-values]').innerHTML = values
    .map(
      (v) => `
      <article class="value card">
        <span class="value__icon" aria-hidden="true">${v.icon}</span>
        <h3 class="h3">${escapeHtml(v.title)}</h3>
        <p>${escapeHtml(v.text)}</p>
      </article>`
    )
    .join('');

  // ---- origins ----
  $('[data-origins]').innerHTML = origins
    .map(
      (o) => `
      <article class="origin card" data-tilt>
        <small>Altitude · ${escapeHtml(o.alt)}</small>
        <h3 class="h3">${escapeHtml(o.name)}</h3>
        <p>${escapeHtml(o.note)}</p>
      </article>`
    )
    .join('');

  // ---- team ----
  $('[data-team]').innerHTML = team
    .map(
      (m) => `
      <article class="member card" data-tilt>
        <span class="avatar avatar--lg" aria-hidden="true">${escapeHtml(m.name.split(' ').map((n) => n[0]).join(''))}</span>
        <h3 class="h3">${escapeHtml(m.name)}</h3>
        <strong>${escapeHtml(m.role)}</strong>
        <p>${escapeHtml(m.bio)}</p>
      </article>`
    )
    .join('');

  initTilt();
  return null;
}
