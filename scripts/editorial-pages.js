(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pageRoot = document.querySelector(".page-about, .page-help, .page-contact");
  if (!pageRoot) return;

  class EditorialPages {
    constructor(root) {
      this.root = root;
      this.revealItems = [...root.querySelectorAll("[data-page-reveal]")];
      this.glowCards = [...root.querySelectorAll(".ui-glow-card")];
      this.form = root.querySelector("[data-support-form]");
      this.readiness = root.querySelector("[data-ticket-readiness]");
      this.progress = root.querySelector("[data-ticket-progress]");
      this.readinessValue = root.querySelector("[data-ticket-readiness-value]");
      this.readinessLabel = root.querySelector("[data-ticket-readiness-label]");
      this.init();
    }

    init() {
      this.initReveal();
      this.initGlowCards();
      this.initHelpQueries();
      this.initTicketReadiness();
      this.openHelpHash();
    }

    initReveal() {
      this.revealItems.forEach((item) => {
        const delay = Number(item.dataset.delay) || 0;
        item.style.setProperty("--page-reveal-delay", `${delay}ms`);
      });

      document.documentElement.classList.add("page-motion-ready");

      if (reduceMotion || !("IntersectionObserver" in window)) {
        this.revealItems.forEach((item) => item.classList.add("is-visible"));
        return;
      }

      const observer = new IntersectionObserver(
        (entries, activeObserver) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            activeObserver.unobserve(entry.target);
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -36px" },
      );

      this.revealItems.forEach((item) => observer.observe(item));
    }

    initGlowCards() {
      if (reduceMotion || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

      this.glowCards.forEach((card) => {
        card.addEventListener("pointermove", (event) => {
          const rect = card.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty("--glow-x", `${x}%`);
          card.style.setProperty("--glow-y", `${y}%`);
        });
      });
    }

    initHelpQueries() {
      const search = this.root.querySelector("[data-help-search]");
      const buttons = [...this.root.querySelectorAll("[data-help-query]")];
      if (!search || !buttons.length) return;

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          search.value = button.dataset.helpQuery || button.textContent.trim();
          search.dispatchEvent(new Event("input", { bubbles: true }));
          search.focus({ preventScroll: true });
        });
      });
    }

    openHelpHash() {
      if (!this.root.classList.contains("page-help") || !window.location.hash) return;
      const target = this.root.querySelector(window.location.hash);
      const trigger = target?.querySelector("[data-accordion-trigger]");
      if (!trigger) return;

      window.requestAnimationFrame(() => {
        trigger.click();
        target.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "center",
        });
      });
    }

    initTicketReadiness() {
      if (!this.form || !this.readiness || !this.progress) return;

      const calculate = () => {
        const topic = Boolean(this.form.elements.topic?.value);
        const email = Boolean(this.form.elements.email?.value.trim());
        const subject = Boolean(this.form.elements.subject?.value.trim());
        const messageLength = this.form.elements.message?.value.trim().length || 0;
        const consent = Boolean(this.form.elements.consent?.checked);
        const context = Boolean(
          this.form.elements.orderNumber?.value.trim() ||
          this.form.elements.product?.value.trim() ||
          this.form.querySelector("[data-support-files]")?.files?.length,
        );

        let score = 0;
        if (topic) score += 15;
        if (email) score += 15;
        if (subject) score += 20;
        if (messageLength >= 30) score += 30;
        else if (messageLength > 0) score += 15;
        if (consent) score += 15;
        if (context) score += 5;

        this.renderReadiness(Math.min(100, score));
      };

      this.form.addEventListener("input", calculate);
      this.form.addEventListener("change", calculate);
      this.root.addEventListener("nexgear:support-ticket-created", () => {
        this.renderReadiness(100, "Tiket siap dan berhasil dibuat.");
      });
      calculate();
    }

    renderReadiness(score, forcedLabel = "") {
      const labels = [
        [30, "Mulai dari topik dan email aktif."],
        [60, "Tambahkan subjek dan detail kendala."],
        [85, "Sudah cukup jelas. Tambahkan konteks bila ada."],
        [101, "Informasi tiket siap dikirim."],
      ];
      const label = forcedLabel || labels.find(([limit]) => score < limit)?.[1] || labels.at(-1)[1];

      this.progress.style.width = `${score}%`;
      this.readiness.setAttribute("aria-valuenow", String(score));
      if (this.readinessValue) this.readinessValue.textContent = `${score}%`;
      if (this.readinessLabel) this.readinessLabel.textContent = label;
    }
  }

  new EditorialPages(pageRoot);
})();
