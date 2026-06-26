(() => {
  "use strict";

  if (window.NexPersonaProductRegression) return;

  const page = window.location.pathname.split("/").pop() || "index.html";
  if (!["catalog.html", "product-detail.html"].includes(page)) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const isVisible = (element) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };

  const run = () => {
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const baseChecks = [
      {
        name: "phase:ready",
        pass: document.body.dataset.personaProductPhase === "decision-ready",
        detail: `State: ${document.body.dataset.personaProductPhase || "missing"}`,
      },
      {
        name: "layout:no-horizontal-overflow",
        pass: documentWidth - innerWidth <= 4,
        detail: `Overflow: ${Math.max(0, documentWidth - innerWidth)}px`,
      },
    ];

    const pageChecks = page === "catalog.html"
      ? [
          {
            name: "catalog:quick-paths",
            pass: isVisible($("[data-persona-quick-paths]")),
            detail: "Fast path kebutuhan tersedia.",
          },
          {
            name: "catalog:quality-signals",
            pass: $$(".page-catalog .catalog-product-card").every((card) => Boolean($(".persona-quality-signals", card))),
            detail: "Setiap kartu memiliki rating, garansi, dan value signal.",
          },
          {
            name: "catalog:buy-now",
            pass: $$(".page-catalog .catalog-product-card").every((card) => Boolean($(".persona-card-decision__buy", card))),
            detail: "Setiap kartu memiliki aksi Beli Sekarang.",
          },
        ]
      : [
          {
            name: "detail:evidence",
            pass: isVisible($("[data-product-decision-evidence]")),
            detail: "Bukti kualitas terlihat sebelum area pembelian.",
          },
          {
            name: "detail:add-cart",
            pass: isVisible($(".btn-add-cart")),
            detail: "CTA Tambah ke Keranjang tersedia.",
          },
          {
            name: "detail:buy-now",
            pass: isVisible($(".persona-buy-now")),
            detail: "CTA Beli Sekarang tersedia.",
          },
          {
            name: "detail:secondary-feedback",
            pass: $$(".product-secondary-actions button").every((button) => button.hasAttribute("aria-pressed")),
            detail: "Wishlist dan compare memiliki state aksesibel.",
          },
          {
            name: "detail:mobile-buy-bar",
            pass: innerWidth > 720 || isVisible($(".persona-mobile-buy-bar")),
            detail: "Aksi pembelian mobile tetap terlihat.",
          },
        ];

    const checks = [...baseChecks, ...pageChecks];
    const failures = checks.filter((check) => !check.pass);
    const report = {
      pass: failures.length === 0,
      page,
      viewport: { width: innerWidth, height: innerHeight },
      checks,
      failures,
      timestamp: new Date().toISOString(),
    };

    document.body.dataset.personaProductRegression = report.pass ? "pass" : "fail";
    window.dispatchEvent(new CustomEvent("nexgear:persona-product-regression", { detail: report }));

    if (failures.length) {
      console.groupCollapsed(`[NEXGEAR] Persona product regression gagal (${failures.length})`);
      console.table(failures);
      console.groupEnd();
    }

    return report;
  };

  const schedule = () => requestAnimationFrame(() => requestAnimationFrame(run));

  document.addEventListener("nexgear:components-ready", schedule);
  window.addEventListener("load", schedule, { once: true });
  window.addEventListener("resize", schedule, { passive: true });

  window.NexPersonaProductRegression = Object.freeze({ run, schedule });
  schedule();
})();
