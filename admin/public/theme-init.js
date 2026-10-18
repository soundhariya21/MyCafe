// Runs before first paint (loaded synchronously in <head>) so the admin never flashes the wrong theme.
(function () {
  var theme = null;
  try {
    theme = localStorage.getItem('mycafe-admin-theme');
  } catch (e) {}
  if (theme !== 'light' && theme !== 'dark') {
    theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
