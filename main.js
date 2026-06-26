(function () {
  'use strict';

  // ---------- Theme toggle (persisted) ----------
  const root = document.documentElement;
  const stored = localStorage.getItem('str1x-theme');
  if (stored === 'light') root.setAttribute('data-theme', 'light');

  const themeButtons = document.querySelectorAll('.theme-toggle [data-theme-set]');
  function syncThemeButtons() {
    const current = root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    themeButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.themeSet === current);
    });
  }
  themeButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = btn.dataset.themeSet;
      if (next === 'light') root.setAttribute('data-theme', 'light');
      else root.removeAttribute('data-theme');
      localStorage.setItem('str1x-theme', next);
      syncThemeButtons();
    });
  });
  syncThemeButtons();

  // ---------- Splits: scroll spy + click to scroll ----------
  const splits = Array.from(document.querySelectorAll('.split[data-target]'));
  const sections = splits
    .map((s) => document.getElementById(s.dataset.target))
    .filter(Boolean);

  splits.forEach((split) => {
    split.addEventListener('click', () => {
      const target = document.getElementById(split.dataset.target);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  function setActiveSplit(id) {
    splits.forEach((s) => s.classList.toggle('active', s.dataset.target === id));
  }

  if ('IntersectionObserver' in window && sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSplit(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    sections.forEach((sec) => observer.observe(sec));
  }
})();
