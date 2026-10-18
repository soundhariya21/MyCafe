// Tiny toast notifications:  toast('Saved!')  or  toast('Oops', 'error')
import { gsap } from 'gsap';
import { $, escapeHtml, reducedMotion } from '../utils.js';

export function toast(message, type = 'success', duration = 4200) {
  const wrap = $('[data-toast-wrap]');
  if (!wrap) return;

  const el = document.createElement('div');
  el.className = `toast${type === 'error' ? ' toast--error' : ''}`;
  el.setAttribute('role', type === 'error' ? 'alert' : 'status');
  el.innerHTML = `<span class="toast__icon">${type === 'error' ? '!' : '✓'}</span><span>${escapeHtml(message)}</span>`;
  wrap.appendChild(el);

  const remove = () => el.remove();
  if (reducedMotion) {
    setTimeout(remove, duration);
    return;
  }
  gsap.fromTo(el, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: 'back.out(1.6)' });
  gsap.to(el, { x: 40, opacity: 0, duration: 0.4, ease: 'power2.in', delay: duration / 1000, onComplete: remove });
}
