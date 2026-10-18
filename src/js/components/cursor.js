// Custom follow cursor (desktop / fine pointers only). Add data-cursor-label="View" to any element to show a label.
import { gsap } from 'gsap';
import { $, finePointer, reducedMotion } from '../utils.js';

export function initCursor() {
  const ring = $('[data-cursor]');
  const dot = $('[data-cursor-dot]');
  const label = $('[data-cursor-label]');
  if (!ring || !dot || !finePointer || reducedMotion) return;

  const ringX = gsap.quickTo(ring, 'x', { duration: 0.5, ease: 'power3' });
  const ringY = gsap.quickTo(ring, 'y', { duration: 0.5, ease: 'power3' });
  const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3' });

  let shown = false;
  window.addEventListener('mousemove', (e) => {
    if (!shown) {
      shown = true;
      gsap.set([ring, dot], { x: e.clientX, y: e.clientY });
      gsap.to([ring, dot], { opacity: 1, duration: 0.3 });
    }
    ringX(e.clientX);
    ringY(e.clientY);
    dotX(e.clientX);
    dotY(e.clientY);
  });
  document.addEventListener('mouseleave', () => gsap.to([ring, dot], { opacity: 0, duration: 0.2 }));
  document.addEventListener('mouseenter', () => shown && gsap.to([ring, dot], { opacity: 1, duration: 0.2 }));

  // Hover states via event delegation so dynamically-rendered cards work too
  const interactive = 'a, button, input, select, textarea, label, [data-cursor-label], summary';
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest(interactive);
    if (!el) return;
    const text = el.closest('[data-cursor-label]')?.dataset.cursorLabel;
    if (text) {
      label.textContent = text;
      ring.classList.add('has-label');
      gsap.to(ring, { scale: 2.2, duration: 0.35, ease: 'power3.out' });
      gsap.to(dot, { scale: 0, duration: 0.2 });
    } else {
      gsap.to(ring, { scale: 1.6, duration: 0.3, ease: 'power3.out' });
    }
  });
  document.addEventListener('mouseout', (e) => {
    const el = e.target.closest(interactive);
    if (!el || el.contains(e.relatedTarget)) return;
    ring.classList.remove('has-label');
    gsap.to(ring, { scale: 1, duration: 0.3, ease: 'power3.out' });
    gsap.to(dot, { scale: 1, duration: 0.2 });
  });
}
