// Entry point shared by every page.
//   1. registers the GSAP plugins
//   2. boots the shared components (theme, navbar, cursor, footer…)
//   3. loads the page-specific module  ->  src/js/pages/<data-page>.js
//   4. plays the intro, then lets the page animate its hero in
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';

import { initTheme } from './components/theme.js';
import { initNavbar } from './components/navbar.js';
import { mountNavTabs } from './components/nav-tabs-mount.tsx';
import { mountThemeToggle } from './components/theme-toggle-mount.tsx';
import { initCursor } from './components/cursor.js';
import { initMagnetic, initTilt } from './components/interactions.js';
import { initFooter, initAnchorScroll } from './components/footer.js';
import { runIntro, initPageTransitions } from './components/loader.js';
import { initScrollAnimations } from './animations/reveal.js';
import { loadContent } from './data/remote.js';
import { applySettings } from './site-settings.js';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, SplitText, Flip);

// Every file in ./pages is lazily available; the <body data-page="..."> attribute picks one.
const pageModules = import.meta.glob('./pages/*.js');

async function boot() {
  initTheme();
  initNavbar();
  mountNavTabs();
  mountThemeToggle();
  initCursor();
  initFooter();
  initAnchorScroll();
  initPageTransitions();

  // Start fetching admin-managed content right away (it overlaps with font loading)
  const contentReady = loadContent();

  // Wait for web-fonts so SplitText measures the real line breaks (but never hang more than 2s)
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2000))]);

  // Contact details / opening hours in footer, navbar and Contact page
  applySettings((await contentReady).settings);

  const loadPage = pageModules[`./pages/${document.body.dataset.page}.js`];
  const page = loadPage ? await loadPage() : null;
  // init() renders dynamic content and returns an optional enter() that plays once the intro is done
  const enter = await page?.init?.();

  initScrollAnimations();
  initTilt();
  initMagnetic();

  await runIntro();
  enter?.();
  ScrollTrigger.refresh();
}

boot().catch((err) => {
  // Never leave visitors staring at a loader if something goes wrong
  console.error('[MY.CAFÉ] boot failed:', err);
  document.querySelector('[data-loader]')?.remove();
  document.querySelector('[data-curtain]')?.remove();
});

// Re-measure after images load (layout shifts change ScrollTrigger positions)
window.addEventListener('load', () => ScrollTrigger.refresh());
