// Light / dark theme bookkeeping.
// - The toggle button is the React <SunMoonThemeToggle /> (src/components/ui/sun-moon-theme-toggle.tsx).
//   It flips the `.dark` class on <html> (shadcn convention), saves the choice in localStorage ("mycafe-theme")
//   and fades the page colours over the sun / moon animation.
// - All of the site's CSS variables key off <html data-theme="light|dark"> (see base.css),
//   so this file keeps `data-theme` in sync with `.dark` — whoever changes one.
// - The very first paint is handled by the inline script in partials/head.html (no light/dark flash).
const root = document.documentElement;
const KEY = 'mycafe-theme';

const fromDataTheme = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');
const fromClass = () => (root.classList.contains('dark') ? 'dark' : 'light');

function setMeta(theme) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#faf5ec' : '#0b0907');
}

/** Make both representations of the theme agree. */
function paint(theme) {
  root.classList.toggle('dark', theme === 'dark');
  root.setAttribute('data-theme', theme);
  setMeta(theme);
}

export function initTheme() {
  paint(fromDataTheme());

  // The toggle component changes `.dark`; mirror that into data-theme
  new MutationObserver(() => {
    const theme = fromClass();
    if (theme !== fromDataTheme()) {
      root.setAttribute('data-theme', theme);
      setMeta(theme);
    }
  }).observe(root, { attributes: true, attributeFilter: ['class'] });

  // Follow the OS theme live, but only while the visitor has not picked one manually.
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    let saved = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      /* private mode */
    }
    if (!saved) paint(e.matches ? 'light' : 'dark');
  });
}
