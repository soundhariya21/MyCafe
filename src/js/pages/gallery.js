// Gallery page: category filter (GSAP Flip) + keyboard / swipe-friendly lightbox.
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { $, $$, escapeHtml, reducedMotion } from '../utils.js';
import { galleryItems } from '../data/content.js';
import { initTilt } from '../components/interactions.js';

export function init() {
  const grid = $('[data-gallery-grid]');
  const filters = $('[data-gallery-filters]');

  grid.innerHTML = galleryItems
    .map(
      (item, i) => `
      <button type="button" class="g-tile card ${item.size ? `g-tile--${item.size}` : ''}" data-index="${i}" data-cat="${item.cat}" data-flip-id="g${i}" data-cursor-label="View" aria-label="View ${escapeHtml(item.title)}">
        <img src="${item.src}" alt="${escapeHtml(item.title)}" loading="lazy" />
        <span class="g-tile__overlay">
          <small>${escapeHtml(item.tag)}</small>
          <strong>${escapeHtml(item.title)}</strong>
        </span>
      </button>`
    )
    .join('');
  grid.setAttribute('data-stagger', 'scale');
  grid.setAttribute('data-stagger-amount', '0.06');

  const tiles = $$('.g-tile', grid);

  // ---- filter ----
  filters.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filter]');
    if (!btn) return;
    const cat = btn.dataset.filter;
    $$('.chip', filters).forEach((c) => {
      c.classList.toggle('is-active', c === btn);
      c.setAttribute('aria-selected', String(c === btn));
    });
    const state = reducedMotion ? null : Flip.getState(tiles);
    tiles.forEach((t) => t.classList.toggle('is-hidden', cat !== 'all' && t.dataset.cat !== cat));
    if (state) {
      Flip.from(state, {
        duration: 0.8,
        ease: 'power3.inOut',
        absolute: true,
        stagger: 0.03,
        onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5, delay: 0.25, clearProps: 'opacity,scale' }),
        onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.3 }),
      });
    }
  });

  initLightbox(tiles);
  initTilt(grid);
  return null;
}

function initLightbox(tiles) {
  const box = $('[data-lightbox]');
  const img = $('[data-lb-img]', box);
  const title = $('[data-lb-title]', box);
  const tag = $('[data-lb-tag]', box);
  const count = $('[data-lb-count]', box);
  const closeBtn = $('[data-lb-close]', box);

  let list = []; // currently visible tiles
  let index = 0;
  let opener = null;
  let isOpen = false;

  const data = (tile) => galleryItems[Number(tile.dataset.index)];

  function show(i, dir = 0) {
    index = (i + list.length) % list.length;
    const item = data(list[index]);
    const fill = () => {
      img.src = item.src.replace('w=900', 'w=1600');
      img.alt = item.title;
      title.textContent = item.title;
      tag.textContent = item.tag;
      count.textContent = `${String(index + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    };
    if (reducedMotion || !dir) return fill();
    gsap.to(img, {
      x: -60 * dir,
      opacity: 0,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        fill();
        gsap.fromTo(img, { x: 60 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, ease: 'power3.out' });
      },
    });
  }

  function open(tile) {
    list = tiles.filter((t) => !t.classList.contains('is-hidden'));
    opener = tile;
    isOpen = true;
    show(list.indexOf(tile));
    box.setAttribute('aria-hidden', 'false');
    document.documentElement.style.overflow = 'hidden';
    gsap.set(box, { visibility: 'visible' });
    if (reducedMotion) {
      gsap.set(box, { opacity: 1 });
    } else {
      gsap.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.35 });
      gsap.fromTo(img, { scale: 0.86, y: 40, opacity: 0 }, { scale: 1, y: 0, opacity: 1, duration: 0.8, ease: 'power4.out' });
      gsap.from('.lightbox__figure figcaption', { y: 20, opacity: 0, duration: 0.6, delay: 0.25 });
    }
    closeBtn.focus();
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    box.setAttribute('aria-hidden', 'true');
    document.documentElement.style.overflow = '';
    gsap.to(box, {
      opacity: 0,
      duration: reducedMotion ? 0 : 0.3,
      onComplete: () => gsap.set(box, { visibility: 'hidden' }),
    });
    opener?.focus();
  }

  tiles.forEach((tile) => tile.addEventListener('click', () => open(tile)));
  closeBtn.addEventListener('click', close);
  $('[data-lb-next]', box).addEventListener('click', () => show(index + 1, 1));
  $('[data-lb-prev]', box).addEventListener('click', () => show(index - 1, -1));
  box.addEventListener('click', (e) => (e.target === box || e.target.classList.contains('lightbox__figure')) && close());

  window.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(index + 1, 1);
    if (e.key === 'ArrowLeft') show(index - 1, -1);
  });

  // Swipe on touch devices
  let startX = null;
  box.addEventListener('pointerdown', (e) => (startX = e.pointerType === 'touch' ? e.clientX : null));
  box.addEventListener('pointerup', (e) => {
    if (startX === null) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
    startX = null;
  });
}
