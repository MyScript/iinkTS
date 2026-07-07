(function () {
  const saved = localStorage.getItem('theme');
  if (saved) document.documentElement.setAttribute('data-theme', saved);

  window.toggleTheme = function () {
    const current = document.documentElement.getAttribute('data-theme');
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = current === 'dark' || (!current && systemDark);
    const next = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  const header = document.querySelector('.header-main');
  if (header) {
    const btn = document.createElement('button');
    btn.className = 'ex-theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.onclick = window.toggleTheme;
    btn.innerHTML = '<span class="ico-sun">&#x2600;&#xFE0F;</span><span class="ico-moon">&#x1F319;</span>';
    header.appendChild(btn);
  }
})();
