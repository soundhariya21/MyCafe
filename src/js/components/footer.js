// Footer behaviours: year, back-to-top button, newsletter form.
import { $, $$, scrollToTarget } from '../utils.js';
import { toast } from './toast.js';

export function initFooter() {
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

  $('[data-to-top]')?.addEventListener('click', () => scrollToTarget(0, 0));

  $('[data-newsletter]')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.email;
    if (!input.value || !input.checkValidity()) {
      toast('Please enter a valid email address.', 'error');
      input.focus();
      return;
    }
    // No backend in this demo — hook your email provider (Mailchimp, Buttondown…) in here.
    toast('Welcome to The Slow Letter! Check your inbox soon.');
    form.reset();
  });
}

/** Smooth-scroll for in-page anchors such as href="#reserve". */
export function initAnchorScroll() {
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href*="#"]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname || !url.hash || url.hash === '#') return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    scrollToTarget(target);
    history.pushState(null, '', url.hash);
  });
}
