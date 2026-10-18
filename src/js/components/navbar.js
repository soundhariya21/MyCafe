// Navbar: active link, hide-on-scroll-down, scroll progress bar and the animated mobile menu.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { $, $$, reducedMotion } from '../utils.js';

export function initNavbar() {
  const navbar = $('[data-navbar]');
  if (!navbar) return;

  // ---- Active link ----
  const file = location.pathname.split('/').pop() || 'index.html';
  $$('[data-nav]').forEach((link) => {
    const href = link.getAttribute('href');
    const active = href === file || (file === '' && href === 'index.html');
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'page');
  });

  // ---- Mobile menu ----
  const burger = $('[data-burger]');
  const menu = $('[data-mobile-menu]');
  const menuLinks = $$('a', menu);
  const menuFoot = $('.mobile-menu__foot', menu);
  let open = false;

  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  tl.set(menu, { visibility: 'visible' })
    .fromTo(menu, { clipPath: 'circle(0% at calc(100% - 3rem) 2.5rem)' }, { clipPath: 'circle(150% at calc(100% - 3rem) 2.5rem)', duration: 0.9, ease: 'power3.inOut' })
    .fromTo(menuLinks, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.7, stagger: 0.06 }, '-=0.45')
    .fromTo(menuFoot, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
    .eventCallback('onReverseComplete', () => gsap.set(menu, { visibility: 'hidden' }));

  function toggleMenu(force) {
    open = typeof force === 'boolean' ? force : !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', String(!open));
    document.documentElement.style.overflow = open ? 'hidden' : '';
    if (reducedMotion) {
      gsap.set(menu, { visibility: open ? 'visible' : 'hidden', clipPath: 'none' });
      return;
    }
    open ? tl.timeScale(1).play() : tl.timeScale(1.4).reverse();
    if (open) gsap.to(navbar, { yPercent: 0, duration: 0.3 });
  }

  burger?.addEventListener('click', () => toggleMenu());
  menuLinks.forEach((link) => link.addEventListener('click', () => open && toggleMenu(false)));
  window.addEventListener('keydown', (e) => e.key === 'Escape' && open && toggleMenu(false));
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => e.matches && open && toggleMenu(false));

  // ---- Scroll behaviour ----
  const progress = $('[data-scroll-progress]');
  const setProgress = progress ? gsap.quickSetter(progress, 'scaleX') : null;
  let hidden = false;

  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      navbar.classList.toggle('is-scrolled', y > 24);
      setProgress?.(self.progress);

      if (open || reducedMotion) return;
      const shouldHide = self.direction === 1 && y > 420;
      const shouldShow = self.direction === -1 || y <= 420;
      if (shouldHide && !hidden) {
        hidden = true;
        gsap.to(navbar, { yPercent: -100, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
      } else if (shouldShow && hidden) {
        hidden = false;
        gsap.to(navbar, { yPercent: 0, duration: 0.45, ease: 'power3.out', overwrite: 'auto' });
      }
    },
  });
}
