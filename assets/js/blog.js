/* ============================================================
   Blog index — client-side filter, search, sort.
   Pure DOM, no deps. Cards carry data-category / data-date.
   ============================================================ */
(function () {
  "use strict";
  var grid = document.querySelector(".post-grid");
  if (!grid) return;

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".post-card"));
  var chips = document.querySelectorAll(".chip");
  var search = document.querySelector("#blog-search");
  var sortSel = document.querySelector("#blog-sort");

  var state = { category: "all", query: "", sort: "newest" };

  function apply() {
    var q = state.query.trim().toLowerCase();
    var visible = 0;

    cards.forEach(function (card) {
      var catOk = state.category === "all" || card.dataset.category === state.category;
      var textOk = !q || card.textContent.toLowerCase().indexOf(q) !== -1;
      var show = catOk && textOk;
      card.style.display = show ? "" : "none";
      if (show) visible++;
    });

    // Sort by date among all cards, then re-append in order
    var sorted = cards.slice().sort(function (a, b) {
      var da = a.dataset.date, db = b.dataset.date;
      return state.sort === "newest" ? (db < da ? -1 : db > da ? 1 : 0)
                                     : (da < db ? -1 : da > db ? 1 : 0);
    });
    sorted.forEach(function (c) { grid.appendChild(c); });

    grid.classList.toggle("empty", visible === 0);
  }

  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      chips.forEach(function (c) { c.setAttribute("aria-pressed", "false"); });
      chip.setAttribute("aria-pressed", "true");
      state.category = chip.dataset.category;
      apply();
    });
  });

  if (search) {
    search.addEventListener("input", function () { state.query = search.value; apply(); });
  }
  if (sortSel) {
    sortSel.addEventListener("change", function () { state.sort = sortSel.value; apply(); });
  }

  // Honour a #category hash arriving from the landing page tiles
  var hash = (location.hash || "").replace("#", "");
  if (hash) {
    var match = document.querySelector('.chip[data-category="' + hash + '"]');
    if (match) match.click();
  }

  apply();
})();
