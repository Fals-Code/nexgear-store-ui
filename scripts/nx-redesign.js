(() => {
  "use strict";

  const page = window.location.pathname.split("/").pop() || "index.html";
  const pageKey = page.replace(/\.html$/i, "").replace(/[^a-z0-9]+/gi, "-");
  const demoPages = new Set([
    "profile.html",
    "transaction-history.html",
    "track-order.html",
    "admin-dashboard.html",
    "admin-articles.html",
    "admin-products.html",
    "admin-users.html",
    "admin-transactions.html",
  ]);

  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  const addPageIdentity = () => {
    document.body.classList.add("nx-redesign", `nx-page-${pageKey}`);
    document.documentElement.classList.remove("nx-redesign-loading");
    document.documentElement.classList.add("nx-redesign-ready");
  };

  const addSkipLink = () => {
    const main = document.querySelector("main");
    if (!main || document.querySelector(".nx-skip-link")) return;
    if (!main.id) main.id = "main-content";
    const link = document.createElement("a");
    link.className = "nx-skip-link";
    link.href = `#${main.id}`;
    link.textContent = "Lewati ke konten utama";
    document.body.prepend(link);
  };

  const addDisclosure = () => {
    if (!demoPages.has(page) || document.querySelector(".nx-prototype-disclosure")) {
      return;
    }

    const main = document.querySelector("main");
    if (!main) return;

    const note = document.createElement("p");
    note.className = "nx-prototype-disclosure";
    note.setAttribute("role", "note");
    note.textContent =
      "Halaman ini menampilkan data prototipe yang tersimpan atau disimulasikan secara lokal. Angka dan status bukan data operasional bisnis nyata.";
    main.prepend(note);
  };

  const replaceText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };

  const removeElements = (...selectors) => {
    document.querySelectorAll(selectors.join(",")).forEach((element) => {
      element.remove();
    });
  };

  const cleanProductDetailClaims = () => {
    if (page !== "product-detail.html") return;

    removeElements(
      ".product-promo-strip",
      ".stock-status",
      ".rating",
      ".product-service-list",
      ".promo-countdown",
      ".review-score-card",
    );

    const mediaBadge = document.querySelector(".product-media-badge");
    if (mediaBadge) mediaBadge.textContent = "Product Preview";

    const oldPrice = document.querySelector(".price-stack em");
    if (oldPrice) oldPrice.remove();

    const reviewsTab = document.querySelector('[data-tab-panel="reviews"]');
    if (reviewsTab) {
      reviewsTab.innerHTML = `
        <div class="nx-truthful-empty">
          <div>
            <h2>Belum ada ulasan tersimpan</h2>
            <p>Prototipe ini belum memiliki basis data ulasan terverifikasi. Form ulasan tetap tersedia untuk mendemonstrasikan alur input tanpa mengarang rating, jumlah pembeli, atau testimoni.</p>
            <a class="btn btn-primary" href="leave-review.html">Buka Form Ulasan</a>
          </div>
        </div>`;
    }

    const reviewTabButton = document.querySelector('[data-tab="reviews"]');
    if (reviewTabButton) reviewTabButton.textContent = "Ulasan";

    const title = document.querySelector("#product-title");
    if (title && !title.nextElementSibling?.classList.contains("nx-product-note")) {
      const note = document.createElement("p");
      note.className = "nx-product-note";
      note.textContent =
        "Informasi produk pada halaman ini merupakan konten prototipe. Status stok, garansi, dan statistik pembeli tidak ditampilkan tanpa sumber data.";
      title.insertAdjacentElement("afterend", note);
    }
  };

  const cleanCartClaims = () => {
    if (page !== "cart.html") return;

    removeElements(
      ".shipping-progress",
      ".promo-form",
      ".summary-readiness",
      ".cart-recommendations",
    );

    replaceText(".summary-secure-badge", "Local state");
    replaceText(".summary-total small", "Total dihitung dari isi keranjang lokal.");

    const shippingLabel = document.querySelector(
      ".summary-breakdown .summary-row:nth-child(2) span",
    );
    if (shippingLabel) shippingLabel.textContent = "Ongkir simulasi";
  };

  const cleanCheckoutClaims = () => {
    if (page !== "checkout.html") return;

    removeElements(".saved-address-row");

    const content = document.querySelector(".checkout-content");
    if (content && !content.querySelector(".nx-checkout-note")) {
      const note = document.createElement("p");
      note.className = "nx-prototype-disclosure nx-checkout-note";
      note.setAttribute("role", "note");
      note.textContent =
        "Alamat, kurir, dan pembayaran diproses sebagai simulasi frontend. Jangan masukkan data pribadi sungguhan.";
      content.prepend(note);
    }
  };

  const cleanPaymentClaims = () => {
    if (page !== "payment.html") return;

    removeElements(".payment-deadline");
    replaceText(
      "#payment-status-description",
      "Gunakan instruksi simulasi sesuai metode yang dipilih saat checkout.",
    );

    const replacements = new Map([
      ["BCA", "VA"],
      ["Virtual Account BCA", "Virtual Account"],
      ["GoPay / QRIS", "Pembayaran QR"],
      ["Visa, Mastercard, JCB", "Simulasi kartu"],
      ["Verifikasi otomatis", "Konfirmasi simulasi"],
    ]);

    document
      .querySelectorAll(".payment-method-picker :is(span, strong, small)")
      .forEach((element) => {
        const replacement = replacements.get(element.textContent.trim());
        if (replacement) element.textContent = replacement;
      });

    const supportText = document.querySelector(".payment-support-row small");
    if (supportText) {
      supportText.textContent =
        "Buka pusat bantuan untuk panduan penggunaan prototipe.";
    }
  };

  const cleanSuccessClaims = () => {
    if (page !== "success.html") return;

    removeElements(".success-estimate-badge");
    replaceText(
      ".success-timeline-card header p",
      "Urutan status simulasi setelah pesanan dicatat.",
    );

    const arrival = document.querySelector("#success-arrival-date");
    if (arrival) arrival.textContent = "Menunggu pembaruan status";

    const shipping = document.querySelector("#success-shipping-window");
    if (shipping) shipping.textContent = "Belum ada jadwal aktual";
  };

  const cleanProfileClaims = () => {
    if (page !== "profile.html") return;

    const stats = document.querySelector(".quick-stats");
    if (stats) {
      stats.hidden = true;
      stats.setAttribute("aria-hidden", "true");
    }

    const heading = document.querySelector(".profile-content > h2");
    if (heading) heading.textContent = "Pusat Akun";

    const intro = document.querySelector(".profile-content > .text-secondary");
    if (intro) {
      intro.textContent =
        "Kelola alur akun prototipe, pesanan lokal, dan navigasi bantuan.";
    }
  };

  const cleanHistoryClaims = () => {
    if (page !== "transaction-history.html") return;

    const stats = document.querySelector(".history-stats");
    if (stats) {
      stats.hidden = true;
      stats.setAttribute("aria-hidden", "true");
    }

    document.querySelectorAll(".history-tab span").forEach((count) => count.remove());

    const resultMeta = document.querySelector(".history-result-meta span");
    if (resultMeta) {
      resultMeta.textContent = "Data contoh lokal, bukan histori akun nyata.";
    }

    const cards = [...document.querySelectorAll(".transaction-card")];
    const visibleCount = document.querySelector("#history-visible-count");
    if (visibleCount) visibleCount.textContent = String(cards.length);
  };

  const cleanReviewDefaults = () => {
    if (page !== "leave-review.html") return;

    const checkedRating = document.querySelector(".rating-input:checked");
    if (checkedRating) checkedRating.checked = false;

    replaceText("#rating-status", "Belum ada rating yang dipilih.");

    const purchaseDate = document.querySelector(".review-product-card .rp-info p");
    if (purchaseDate) {
      purchaseDate.textContent =
        "Produk contoh untuk demonstrasi alur penulisan ulasan.";
    }
  };

  const cleanAdminClaims = () => {
    if (!page.startsWith("admin-")) return;

    document
      .querySelectorAll(".admin-nav-link[data-badge]")
      .forEach((link) => link.removeAttribute("data-badge"));

    removeElements(
      ".dashboard-kpi-grid",
      ".dashboard-health",
      ".dashboard-notifications",
      ".admin-dot",
    );

    document
      .querySelectorAll(
        ".admin-system-card small, .dashboard-date-card small, [data-dashboard-date]",
      )
      .forEach((element) => {
        if (element.matches("[data-dashboard-date]")) return;
        element.textContent = "Mode prototipe lokal";
      });

    const content = document.querySelector(".admin-content");
    if (content && !content.querySelector(".nx-admin-disclosure")) {
      const note = document.createElement("p");
      note.className = "nx-admin-disclosure";
      note.textContent =
        "Workspace prototipe. Tabel dan tindakan memakai data lokal, bukan data bisnis produksi.";
      const firstSection = content.firstElementChild;
      if (firstSection) firstSection.insertAdjacentElement("afterend", note);
      else content.prepend(note);
    }

    document.querySelectorAll("table").forEach((table) => {
      const headers = [...table.querySelectorAll("thead th")].map((th) =>
        th.textContent.trim().replace(/\s+/g, " "),
      );
      if (!headers.length) return;

      table.classList.add("nx-mobile-records");
      table.querySelectorAll("tbody tr").forEach((row) => {
        [...row.children].forEach((cell, index) => {
          if (cell.tagName !== "TD") return;
          cell.dataset.label = headers[index] || `Kolom ${index + 1}`;
        });
      });
    });
  };

  const enhanceCompliancePage = () => {
    if (page !== "uas-compliance.html") return;

    const main = document.querySelector("main");
    if (!main || main.querySelector(".nx-evidence-note")) return;

    const note = document.createElement("p");
    note.className = "nx-evidence-note";
    note.setAttribute("role", "note");
    note.textContent =
      "Halaman ini memetakan bukti implementasi terhadap rubrik UAS. Persentase rubrik berasal dari brief, bukan skor kepatuhan yang diklaim sendiri.";
    main.prepend(note);

    document
      .querySelectorAll('[class*="progress"], [class*="score"]')
      .forEach((element) => {
        const text = element.textContent || "";
        if (/100%|99%|fully compliant/i.test(text)) {
          element.hidden = true;
        }
      });
  };

  const enhanceForms = () => {
    document.querySelectorAll("form").forEach((form) => {
      form.addEventListener(
        "invalid",
        (event) => {
          const field = event.target;
          if (!(field instanceof HTMLElement)) return;
          field.setAttribute("aria-invalid", "true");
        },
        true,
      );

      form.addEventListener("input", (event) => {
        const field = event.target;
        if (
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement ||
          field instanceof HTMLSelectElement
        ) {
          if (field.checkValidity()) field.removeAttribute("aria-invalid");
        }
      });
    });
  };

  const init = () => {
    addPageIdentity();
    addSkipLink();
    addDisclosure();
    cleanProductDetailClaims();
    cleanCartClaims();
    cleanCheckoutClaims();
    cleanPaymentClaims();
    cleanSuccessClaims();
    cleanProfileClaims();
    cleanHistoryClaims();
    cleanReviewDefaults();
    cleanAdminClaims();
    enhanceCompliancePage();
    enhanceForms();

    document.dispatchEvent(
      new CustomEvent("nexgear:redesign-ready", {
        detail: { page },
      }),
    );
  };

  ready(init);
})();
