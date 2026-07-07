(() => {
  "use strict";

  const page = location.pathname.split("/").pop() || "index.html";
  const meta = {
    "product-detail.html": ["01", "PRODUCT LAB"],
    "cart.html": ["02", "CART REVIEW"],
    "checkout.html": ["03", "DELIVERY DATA"],
    "payment.html": ["04", "PAYMENT"],
    "success.html": ["05", "ORDER COMPLETE"],
    "track-order.html": ["06", "TRACKING"],
    "transaction-history.html": ["07", "ORDER ARCHIVE"],
    "leave-review.html": ["08", "FEEDBACK"],
    "profile.html": ["09", "ACCOUNT"],
    "about.html": ["10", "BRAND DOSSIER"],
    "contact.html": ["11", "CONTACT"],
    "help.html": ["12", "HELP CENTER"],
    "404.html": ["13", "ROUTE ERROR"],
    "admin-dashboard.html": ["14", "COMMAND CENTER"],
    "admin-articles.html": ["15", "CONTENT OPS"],
    "admin-products.html": ["16", "PRODUCT OPS"],
    "admin-users.html": ["17", "USER OPS"],
    "admin-transactions.html": ["18", "ORDER OPS"],
    "uas-compliance.html": ["19", "UAS DOSSIER"]
  };

  const remove = (...selectors) =>
    document.querySelectorAll(selectors.join(",")).forEach((node) => node.remove());

  const text = (selector, value) => {
    const node = document.querySelector(selector);
    if (node) node.textContent = value;
  };

  const readArray = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  };

  const identifyPage = () => {
    const [index = "00", label = "NEXGEAR"] = meta[page] || [];
    const key = page.replace(/\.html$/i, "").replace(/[^a-z0-9]+/gi, "-");
    document.body.classList.add("nx-redesign", `nx-page-${key}`);
    document.body.style.setProperty("--nx-page-index", `"${index}"`);
    const main = document.querySelector("main");
    if (!main) return;
    main.classList.add("nx-redesign-wrapper");
    if (!main.id) main.id = "main-content";
    if (!page.startsWith("admin-") && !main.querySelector(".nx-section-rail")) {
      const rail = document.createElement("div");
      rail.className = "nx-section-rail";
      rail.setAttribute("aria-hidden", "true");
      rail.innerHTML = `<span>${index}</span><strong>${label}</strong>`;
      main.prepend(rail);
    }
  };

  const cleanProduct = () => {
    if (page !== "product-detail.html") return;
    const purge = () => remove(
      ".product-promo-strip", ".stock-status", ".rating", ".product-service-list",
      ".promo-countdown", ".review-score-card", ".persona-detail-evidence",
      ".persona-buy-now", ".persona-mobile-buy-bar"
    );
    purge();
    new MutationObserver(purge).observe(document.body, { childList: true, subtree: true });
    text(".product-media-badge", "PRODUCT VIEW");
    document.querySelector(".price-stack em")?.remove();
    const reviews = document.querySelector('[data-tab-panel="reviews"]');
    if (reviews) reviews.innerHTML = '<div class="nx-empty-state"><div><span class="nx-empty-state__index">NO REVIEW DATA</span><h2>Belum ada ulasan tersimpan.</h2><p>Ulasan baru akan muncul setelah feedback disimpan melalui alur lokal.</p><a class="btn btn-primary" href="leave-review.html">Tulis Ulasan</a></div></div>';
    const source = document.querySelector(".btn-add-cart");
    const price = document.querySelector(".price-stack strong")?.textContent?.trim() || "";
    if (source && !document.querySelector(".nx-mobile-purchase")) {
      const bar = document.createElement("div");
      bar.className = "nx-mobile-purchase";
      bar.innerHTML = `<div><small>Harga produk</small><strong>${price}</strong></div><button type="button">Tambah</button>`;
      bar.querySelector("button").addEventListener("click", () => source.click());
      document.body.append(bar);
    }
  };

  const cleanTransaction = () => {
    if (page === "cart.html") {
      remove(".shipping-progress", ".promo-form", ".summary-readiness", ".cart-recommendations");
      text(".summary-secure-badge", "LOCAL CART");
      document.querySelector("#cart-total")?.setAttribute("aria-live", "polite");
    }
    if (page === "checkout.html") {
      remove(".saved-address-row", ".nx-checkout-note");
      document.querySelectorAll(".checkout-panel").forEach((panel, index) => {
        panel.dataset.step = String(index + 1).padStart(2, "0");
      });
    }
    if (page === "payment.html") {
      remove(".payment-deadline");
      text("#payment-status-description", "Pilih kanal simulasi lalu konfirmasi transaksi.");
    }
    if (page === "success.html") {
      remove(".success-estimate-badge");
      text("#success-arrival-date", "Menunggu pembaruan status");
      text("#success-shipping-window", "Belum ada jadwal aktual");
    }
  };

  const cleanAccount = () => {
    if (page === "profile.html") {
      remove(".quick-stats");
      text(".profile-content > h2", "Pusat Akun");
    }
    if (page === "transaction-history.html") {
      remove(".history-stats");
      document.querySelectorAll(".history-tab span").forEach((node) => node.remove());
    }
    if (page === "leave-review.html") {
      const checked = document.querySelector(".rating-input:checked");
      if (checked) checked.checked = false;
      remove(".review-upload", ".review-photo-upload", "[data-review-upload]");
    }
  };

  const enhanceAdmin = () => {
    if (!page.startsWith("admin-")) return;
    remove(".dashboard-kpi-grid", ".dashboard-health", ".dashboard-notifications", ".admin-dot", ".metric-grid");
    document.querySelectorAll("table").forEach((table) => {
      const heads = [...table.querySelectorAll("thead th")].map((cell) => cell.textContent.trim());
      table.classList.add("nx-mobile-records");
      table.querySelectorAll("tbody tr").forEach((row) => {
        [...row.children].forEach((cell, index) => {
          if (cell.tagName === "TD") cell.dataset.label = heads[index] || `Kolom ${index + 1}`;
        });
      });
    });
    const content = document.querySelector(".admin-content");
    if (content && !content.querySelector(".nx-command-metrics")) {
      const metrics = document.createElement("section");
      metrics.className = "nx-command-metrics";
      metrics.innerHTML = `<article><span>CART ITEMS</span><strong>${readArray("nexgear_cart").length}</strong><small>Data lokal</small></article><article><span>ORDERS</span><strong>${readArray("nexgear_order_history").length}</strong><small>Riwayat lokal</small></article><article><span>USERS</span><strong>${readArray("nexgear_users").length}</strong><small>Akun lokal</small></article>`;
      content.firstElementChild?.insertAdjacentElement("afterend", metrics);
    }
  };

  const improveForms = () => {
    document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("invalid", (event) => event.target.setAttribute("aria-invalid", "true"), true);
      form.addEventListener("input", (event) => {
        if (event.target.checkValidity?.()) event.target.removeAttribute("aria-invalid");
      });
    });
  };

  const init = () => {
    remove(".nx-prototype-disclosure", ".nx-content-integrity-note", ".nx-admin-disclosure");
    identifyPage();
    cleanProduct();
    cleanTransaction();
    cleanAccount();
    enhanceAdmin();
    improveForms();
    document.documentElement.classList.remove("nx-redesign-loading");
    document.documentElement.classList.add("nx-redesign-ready");
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init();
})();
