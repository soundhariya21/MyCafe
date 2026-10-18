// Intro loader (first page of a visit). Page-to-page transitions: see page-transitions.js
import { gsap } from 'gsap';
import { $, $$, reducedMotion } from '../utils.js';
import { playArrival } from './page-transitions.js';

const root = document.documentElement;
const loader = $('[data-loader]');
const curtain = $('[data-curtain]');

/** Plays the intro. Resolves when the page content may start animating in. */
export function runIntro() {
  return new Promise((resolve) => {
    // JS is alive: cancel the CSS fail-safes
    if (loader) loader.style.animation = 'none';
    if (curtain) curtain.style.animation = 'none';

    const visited = root.classList.contains('visited');
    try {
      sessionStorage.setItem('mycafe-visited', '1');
    } catch {
      /* ignore */
    }

    if (reducedMotion) {
      loader?.remove();
      curtain?.remove();
      return resolve();
    }

    if (!visited && loader) {
      curtain?.remove();
      const letters = $$('.loader__logo span', loader);
      const bar = $('[data-loader-bar]', loader);
      gsap
        .timeline({ onComplete: () => loader.remove() })
        .from(letters, { yPercent: 120, opacity: 0, rotate: 8, duration: 0.8, stagger: 0.07, ease: 'power4.out' })
        .to(bar, { scaleX: 1, duration: 1.1, ease: 'power2.inOut' }, 0.2)
        .to('.loader__text', { opacity: 0, duration: 0.3 }, '+=0.1')
        .to(letters, { yPercent: -120, opacity: 0, duration: 0.5, stagger: 0.03, ease: 'power3.in' }, '<')
        .to(loader, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, '-=0.1')
        .add(resolve, '-=0.45');
      return;
    }

    // Navigated here from another page of the site: uncover the page with that page's own transition
    loader?.remove();
    playArrival().then(resolve);
  });
}

// Page-to-page transitions live in their own module (one style per destination page)
export { initPageTransitions } from './page-transitions.js';
