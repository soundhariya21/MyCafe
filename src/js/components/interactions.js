// Pointer-driven GSAP interactions: magnetic buttons and 3D tilt cards.
import { gsap } from 'gsap';
import { $$, finePointer, reducedMotion } from '../utils.js';

const enabled = finePointer && !reducedMotion;

/** Buttons with [data-magnetic] gently follow the cursor. */
export function initMagnetic(root = document) {
  if (!enabled) return;
  $$('[data-magnetic]', root).forEach((el) => {
    if (el.dataset.magneticReady) return;
    el.dataset.magneticReady = '1';
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
    let snapBack;
    el.addEventListener('mousemove', (e) => {
      snapBack?.kill(); // stop the elastic return if the pointer comes back mid-bounce
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    });
    el.addEventListener('mouseleave', () => {
      snapBack = gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' });
    });
  });
}

/** Elements with [data-tilt] rotate in 3D toward the pointer. Safe to call again after rendering new cards. */
export function initTilt(root = document) {
  if (!enabled) return;
  $$('[data-tilt]', root).forEach((el) => {
    if (el.dataset.tiltReady) return;
    el.dataset.tiltReady = '1';
    gsap.set(el, { transformPerspective: 1000 });
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3' });
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3' });
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      ry(px * 10);
      rx(-py * 10);
    });
    el.addEventListener('mouseleave', () => {
      rx(0);
      ry(0);
    });
  });
}
