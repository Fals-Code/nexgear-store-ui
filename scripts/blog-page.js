(function () {
  "use strict";

  function initBlogFilters() {
    const buttons = Array.from(
      document.querySelectorAll("[data-blog-filter]"),
    );
    const articles = Array.from(
      document.querySelectorAll(".journal-article[data-category]"),
    );
    const status = document.getElementById("journal-filter-status");
    const target = document.getElementById("latest");

    if (!buttons.length || !articles.length) return;

    function updateStatus(count, label) {
      if (!status) return;
      status.textContent =
        label === "Semua" ? `${count} artikel` : `${count} artikel · ${label}`;
    }

    function applyFilter(button, shouldScroll) {
      const filter = button.dataset.blogFilter || "all";
      const label = button.textContent.trim();
      let visibleCount = 0;

      buttons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", active ? "true" : "false");
      });

      articles.forEach((article) => {
        const categories = (article.dataset.category || "")
          .split(" ")
          .filter(Boolean);
        const visible = filter === "all" || categories.includes(filter);
        article.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      updateStatus(visibleCount, label);

      if (shouldScroll && target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    buttons.forEach((button) => {
      button.addEventListener("click", () => applyFilter(button, true));
    });

    const initial =
      buttons.find((button) => button.classList.contains("is-active")) ||
      buttons[0];

    applyFilter(initial, false);
  }

  function initNewsletterFeedback() {
    const form = document.querySelector(".journal-newsletter-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const button = form.querySelector("button[type='submit']");
      const input = form.querySelector("input[type='email']");
      if (!input?.value.trim()) return;

      const originalText = button?.textContent || "Berlangganan";
      if (button) {
        button.disabled = true;
        button.textContent = "Tersimpan";
      }

      window.showNexToast?.("Berhasil berlangganan NEXGEAR Dispatch");
      form.reset();

      window.setTimeout(() => {
        if (!button) return;
        button.disabled = false;
        button.textContent = originalText;
      }, 1400);
    });
  }

  function init() {
    initBlogFilters();
    initNewsletterFeedback();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
