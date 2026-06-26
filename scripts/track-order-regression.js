(() => {
  "use strict";

  if (window.NexTrackOrderRegression) return;

  const root = document.querySelector(".page-track-order");
  if (!root) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const isVisible = (element) => {
    if (!element) return false;
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return !element.hidden && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
  };

  const run = () => {
    const result = $("[data-track-result]", root);
    const dashboardVisible = root.dataset.trackState !== "success" || isVisible(result);
    const milestones = $$("[data-track-milestones] .tracking-progress__item", root);
    const events = $$("[data-track-events] .tracking-event", root);
    const products = $$("[data-track-products] .tracking-product", root);
    const orderNumber = $("[data-track-order-number]", root)?.textContent?.trim() || "";
    const statusTitle = $("[data-track-status-title]", root)?.textContent?.trim() || "";
    const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);

    const checks = [
      { name: "state:known", pass: ["idle", "loading", "success", "not-found", "error"].includes(root.dataset.trackState), detail: `State: ${root.dataset.trackState || "missing"}` },
      { name: "dashboard:visible", pass: dashboardVisible, detail: "Dashboard terlihat ketika status sukses." },
      { name: "milestones:four", pass: root.dataset.trackState !== "success" || milestones.length === 4, detail: `Milestone: ${milestones.length}` },
      { name: "events:available", pass: root.dataset.trackState !== "success" || events.length > 0, detail: `Event: ${events.length}` },
      { name: "products:available", pass: root.dataset.trackState !== "success" || products.length > 0, detail: `Produk: ${products.length}` },
      { name: "order:rendered", pass: root.dataset.trackState !== "success" || /^NEX-[A-Z0-9]{8,14}$/.test(orderNumber), detail: `Order: ${orderNumber || "empty"}` },
      { name: "status:rendered", pass: root.dataset.trackState !== "success" || Boolean(statusTitle), detail: `Status: ${statusTitle || "empty"}` },
      { name: "layout:no-horizontal-overflow", pass: documentWidth - innerWidth <= 4, detail: `Overflow: ${Math.max(0, documentWidth - innerWidth)}px` },
      { name: "a11y:form-status", pass: Boolean($("[data-track-form-status][aria-live]", root)), detail: "Live status form tersedia." },
      { name: "a11y:result-focusable", pass: Boolean(result?.hasAttribute("tabindex")), detail: "Hasil dapat menerima fokus." },
    ];

    const failures = checks.filter((check) => !check.pass);
    const report = {
      pass: failures.length === 0,
      state: root.dataset.trackState,
      shipmentStatus: root.dataset.shipmentStatus,
      viewport: { width: innerWidth, height: innerHeight },
      checks,
      failures,
      timestamp: new Date().toISOString(),
    };

    root.dataset.trackRegression = report.pass ? "pass" : "fail";
    window.dispatchEvent(new CustomEvent("nexgear:tracking-regression", { detail: report }));

    if (failures.length) {
      console.groupCollapsed(`[NEXGEAR] Track order regression gagal (${failures.length})`);
      console.table(failures);
      console.groupEnd();
    }

    return report;
  };

  const schedule = () => requestAnimationFrame(() => requestAnimationFrame(run));

  window.addEventListener("nexgear:tracking-success", schedule);
  window.addEventListener("nexgear:tracking-not-found", schedule);
  window.addEventListener("nexgear:tracking-error", schedule);
  window.addEventListener("resize", schedule, { passive: true });

  window.NexTrackOrderRegression = Object.freeze({ run, schedule });
  schedule();
})();
