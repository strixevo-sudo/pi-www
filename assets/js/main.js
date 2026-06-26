/* ============================================================
   STRIXEVO — global behaviours
   Theme toggle · mobile nav · scroll reveal · code copy
   No dependencies. Runs on every page.
   ============================================================ */
(function () {
  "use strict";

  /* ---- Theme (persisted, respects system on first visit) --- */
  var root = document.documentElement;
  var stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  if (stored) {
    root.setAttribute("data-theme", stored);
  } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) {
    root.setAttribute("data-theme", "light");
  } else {
    root.setAttribute("data-theme", "dark");
  }

  function syncToggle() {
    var current = root.getAttribute("data-theme");
    document.querySelectorAll("[data-theme-set]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-theme-set") === current));
    });
  }

  document.addEventListener("click", function (e) {
    var setter = e.target.closest("[data-theme-set]");
    if (setter) {
      var theme = setter.getAttribute("data-theme-set");
      root.setAttribute("data-theme", theme);
      try { localStorage.setItem("theme", theme); } catch (err) {}
      syncToggle();
    }

    /* ---- Code copy buttons ---- */
    var copyBtn = e.target.closest(".code-block-copy");
    if (copyBtn) {
      var pre = copyBtn.parentElement.querySelector("pre");
      if (pre && navigator.clipboard) {
        navigator.clipboard.writeText(pre.innerText).then(function () {
          var label = copyBtn.textContent;
          copyBtn.textContent = "Copied";
          setTimeout(function () { copyBtn.textContent = label; }, 1600);
        });
      }
    }
  });
  syncToggle();

  /* ---- Mobile nav -------------------------------------------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navLinks = document.querySelector(".nav-links");
  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var open = navLinks.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
    navLinks.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        navLinks.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---- Scroll reveal ----------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }
})();
