// Small shared helpers.
import { gsap } from 'gsap';

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/** Smoothly scroll to an element / selector, accounting for the sticky navbar. */
export function scrollToTarget(target, offset = 90) {
  gsap.to(window, {
    duration: reducedMotion ? 0 : 1.1,
    ease: 'power3.inOut',
    scrollTo: { y: target, offsetY: offset, autoKill: true },
  });
}

/** Escape user-provided strings before putting them in innerHTML. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
