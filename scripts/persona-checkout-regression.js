(() => {
  "use strict";

  if (window.NexPersonaCheckoutRegression) return;

  const page = window.location.pathname.split("/").pop() || "index.html";
  const supported = new Set(["cart.html", "checkout.html", "payment.html", "success.html", "transaction-history.html"]);
  if (!supported.has(page)) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const textNumber = (selector) => {
    const text = $(selector)?.textContent || "";
    return Number(text.replace(/[^0-9]/g, "")) || 0;
  };

  const parse = (key, fallback = null) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const run = () => {
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const checks = [
      {
        name: "layout:no-horizontal-overflow",
        pass: documentWidth - innerWidth <= 4,
        detail: `Overflow: ${Math.max(0, documentWidth - innerWidth)}px`,
      },
    ];

    if (page === "checkout.html") {
      const form = $("#checkout-form");
      const submit = $("#checkout-submit");
      const ready = document.body.dataset.checkoutValidity === "ready";
      checks.push(
        {
          name: "checkout:phase-ready",
          pass: document.body.dataset.personaCheckoutPhase === "continuity-ready",
          detail: `State: ${document.body.dataset.personaCheckoutPhase || "missing"}`,
        },
        {
          name: "checkout:progress",
          pass: Boolean($("[data-persona-checkout-progress]")),
          detail: "Progress kelengkapan tersedia.",
        },
        {
          name: "checkout:snapshot",
          pass: Boolean($("[data-persona-checkout-continuity]")),
          detail: "Snapshot pengiriman, pembayaran, alamat, dan total tersedia.",
        },
        {
          name: "checkout:saved-address-option",
          pass: Boolean($("#persona-save-address")),
          detail: "Opsi simpan alamat tersedia.",
        },
        {
          name: "checkout:shipping-eta",
          pass: $$("input[name='shipping']", form).every((input) => Boolean($(".persona-shipping-eta", input.closest(".checkout-choice")))),
          detail: "Setiap metode pengiriman memiliki ETA.",
        },
        {
          name: "checkout:submit-state",
          pass: Boolean(submit) && submit.disabled === !ready,
          detail: `Ready: ${ready}; disabled: ${submit?.disabled}`,
        },
        {
          name: "checkout:total-visible",
          pass: textNumber("#checkout-total") > 0 || $("#checkout-layout")?.hidden,
          detail: `Total: ${$("#checkout-total")?.textContent || "missing"}`,
        },
      );
    }

    if (["payment.html", "success.html"].includes(page)) {
      const orderId = new URLSearchParams(location.search).get("order");
      const orders = parse("nexgear_orders", []);
      const pending = parse("nexgear_pending_order", null);
      const order = (Array.isArray(orders) ? orders.find((item) => item.id === orderId) : null) || pending;
      const renderedTotal = page === "payment.html" ? textNumber("#payment-total") : textNumber("#success-total");
      checks.push(
        {
          name: `${page}:phase-ready`,
          pass: document.body.dataset.personaCheckoutPhase === "continuity-ready",
          detail: `State: ${document.body.dataset.personaCheckoutPhase || "missing"}`,
        },
        {
          name: `${page}:continuity-card`,
          pass: Boolean($("[data-persona-order-continuity]")),
          detail: "Order continuity card tersedia.",
        },
        {
          name: `${page}:total-consistent`,
          pass: !order || renderedTotal === Number(order.total || 0),
          detail: `Rendered: ${renderedTotal}; stored: ${order?.total || 0}`,
        },
        {
          name: `${page}:shipping-snapshot`,
          pass: !order || Boolean(order.shipping?.label),
          detail: `Shipping: ${order?.shipping?.label || "missing"}`,
        },
        {
          name: `${page}:payment-snapshot`,
          pass: !order || Boolean(order.payment?.label),
          detail: `Payment: ${order?.payment?.label || "missing"}`,
        },
      );
    }

    if (page === "transaction-history.html") {
      const persistedOrders = parse("nexgear_orders", []);
      const persistedIds = new Set((Array.isArray(persistedOrders) ? persistedOrders : []).map((item) => item.id));
      const renderedIds = new Set($$(".transaction-card h2").map((heading) => heading.textContent.trim()));
      checks.push({
        name: "history:persisted-orders-rendered",
        pass: [...persistedIds].every((id) => renderedIds.has(id)),
        detail: `${persistedIds.size} order tersimpan; ${renderedIds.size} order tampil.`,
      });
    }

    const failures = checks.filter((check) => !check.pass);
    const report = {
      pass: failures.length === 0,
      page,
      viewport: { width: innerWidth, height: innerHeight },
      checks,
      failures,
      timestamp: new Date().toISOString(),
    };

    document.body.dataset.personaCheckoutRegression = report.pass ? "pass" : "fail";
    window.dispatchEvent(new CustomEvent("nexgear:persona-checkout-regression", { detail: report }));

    if (failures.length) {
      console.groupCollapsed(`[NEXGEAR] Persona checkout regression gagal (${failures.length})`);
      console.table(failures);
      console.groupEnd();
    }

    return report;
  };

  const schedule = () => requestAnimationFrame(() => requestAnimationFrame(run));
  window.addEventListener("load", schedule, { once: true });
  window.addEventListener("resize", schedule, { passive: true });
  window.addEventListener("nexgear:checkout-continuity-ready", schedule);
  window.addEventListener("nexgear:checkout-snapshot", schedule);
  window.addEventListener("nexgear:order-continuity-ready", schedule);

  window.NexPersonaCheckoutRegression = Object.freeze({ run, schedule });
})();
