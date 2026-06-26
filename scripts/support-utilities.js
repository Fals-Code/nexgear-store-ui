(() => {
  "use strict";

  class HelpCenter {
    constructor(root) {
      this.root = root;
      this.items = [...root.querySelectorAll(".accordion-item")];
      this.search = root.querySelector("[data-help-search]");
      this.status = root.querySelector("[data-help-search-status]");
      this.empty = root.querySelector("[data-help-empty]");
      this.bindAccordion();
      this.bindSearch();
      this.bindKeyboardShortcut();
    }

    bindAccordion() {
      this.items.forEach((item) => {
        const trigger = item.querySelector("[data-accordion-trigger]");
        const panelId = trigger?.getAttribute("aria-controls");
        const panel = panelId ? this.root.querySelector(`#${panelId}`) : null;
        if (!trigger || !panel) return;

        trigger.addEventListener("click", () => {
          const shouldOpen = !item.classList.contains("active");
          this.closeAll();
          if (!shouldOpen) return;
          item.classList.add("active");
          trigger.setAttribute("aria-expanded", "true");
          panel.hidden = false;
        });
      });
    }

    closeAll() {
      this.items.forEach((item) => {
        item.classList.remove("active");
        item.querySelector("[data-accordion-trigger]")?.setAttribute("aria-expanded", "false");
        const panel = item.querySelector(".accordion-body");
        if (panel) panel.hidden = true;
      });
    }

    bindSearch() {
      if (!this.search) return;
      this.search.addEventListener("input", () => {
        const query = this.search.value.toLocaleLowerCase("id-ID").trim();
        let visible = 0;

        this.items.forEach((item) => {
          const matched = !query || item.textContent.toLocaleLowerCase("id-ID").includes(query);
          item.hidden = !matched;
          if (!matched && item.classList.contains("active")) this.closeAll();
          if (matched) visible += 1;
        });

        if (this.status) {
          this.status.textContent = query
            ? visible > 0
              ? `${visible} jawaban ditemukan.`
              : "Tidak ada jawaban yang cocok."
            : "";
        }

        if (this.empty) this.empty.hidden = !query || visible > 0;
        this.root.dataset.helpSearchState = query ? (visible ? "results" : "empty") : "idle";
      });
    }

    bindKeyboardShortcut() {
      if (!this.search) return;
      document.addEventListener("keydown", (event) => {
        const tag = document.activeElement?.tagName;
        const isTyping = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
        if (event.key !== "/" || isTyping) return;
        event.preventDefault();
        this.search.focus();
      });
    }
  }

  const helpRoot = document.querySelector(".page-help");
  if (helpRoot) new HelpCenter(helpRoot);
})();
