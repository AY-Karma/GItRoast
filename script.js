// Minimal interactivity: theme toggle with persistence
(function(){
  const html = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  // Load persisted theme
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (saved === null && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    html.setAttribute('data-theme','dark');
  }
  // Attach listener
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
      toggle.textContent = next === 'dark' ? '🌙' : '🌗';
    });
  }
  // initialize icon based on current theme
  if (toggle) {
    const current = html.getAttribute('data-theme');
    toggle.textContent = current === 'dark' ? '🌙' : '🌗';
  }
})();

// Quick smooth scroll for anchor links (enhanced UX)
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
