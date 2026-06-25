(() => {
  "use strict";

  class HelpCenter {
    constructor(root) {
      this.root = root;
      this.items = [...root.querySelectorAll(".accordion-item")];
      this.search = root.querySelector("[data-help-search]");
      this.status = root.querySelector("[data-help-search-status]");
      this.bindAccordion();
      this.bindSearch();
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
          if (matched) visible += 1;
        });

        if (this.status) {
          this.status.textContent = query ? `${visible} jawaban ditemukan.` : "";
        }
      });
    }
  }

  class OrderTracker {
    constructor(root) {
      this.root = root;
      this.form = root.querySelector("[data-order-track]");
      this.result = root.querySelector("[data-track-result]");
      this.orderNumber = root.querySelector("[data-order-number]");
      this.bind();
    }

    bind() {
      if (!this.form || !this.result) return;
      this.form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!this.form.checkValidity()) {
          this.form.reportValidity();
          return;
        }

        const input = this.form.querySelector("input");
        const value = input?.value.trim().toUpperCase() || "NEX-88392019A";
        if (this.orderNumber) this.orderNumber.textContent = value;
        this.result.hidden = false;
        this.result.dataset.state = "visible";
        this.result.setAttribute("tabindex", "-1");
        this.result.focus({ preventScroll: true });
        this.result.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  const helpRoot = document.querySelector(".page-help");
  const trackingRoot = document.querySelector(".page-track-order");
  if (helpRoot) new HelpCenter(helpRoot);
  if (trackingRoot) new OrderTracker(trackingRoot);
})();
