(() => {
  "use strict";

  const scriptUrl = document.currentScript?.src || "";
  const experienceCss = scriptUrl
    ? new URL("../styles/experience-system.css?v=1", scriptUrl).href
    : "styles/experience-system.css?v=1";

  if (!document.querySelector('link[data-nx-experience-style]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = experienceCss;
    link.dataset.nxExperienceStyle = "true";
    document.head.append(link);
  }

  const THEME_KEY = "nexgear-theme";
  const REQUIRED_PAGES = [
    { group: "Storefront", href: "index.html", label: "Landing Page", note: "Brand, kategori, produk unggulan" },
    { group: "Konten", href: "blog.html", label: "Arsip Artikel", note: "Daftar insight dan pencarian" },
    { group: "Konten", href: "blog-post.html", label: "Detail Artikel", note: "Single post dan artikel terkait" },
    { group: "Storefront", href: "catalog.html", label: "Katalog Produk", note: "Filter, urutkan, dan pencarian" },
    { group: "Storefront", href: "product-detail.html", label: "Detail Produk", note: "Galeri, spesifikasi, dan ulasan" },
    { group: "Transaksi", href: "cart.html", label: "Keranjang", note: "Kuantitas dan ringkasan belanja" },
    { group: "Transaksi", href: "payment.html", label: "Pembayaran", note: "Metode dan verifikasi pembayaran" },
    { group: "Transaksi", href: "transaction-history.html", label: "History Transaksi", note: "Status dan detail pesanan" },
    { group: "Admin", href: "admin-dashboard.html", label: "Dashboard", note: "Ringkasan performa toko" },
    { group: "Admin", href: "admin-articles.html", label: "Kelola Artikel", note: "CRUD konten" },
    { group: "Admin", href: "admin-products.html", label: "Kelola Produk", note: "CRUD katalog" },
    { group: "Admin", href: "admin-users.html", label: "Kelola Pengguna", note: "Data akun dan peran" },
    { group: "Admin", href: "admin-transactions.html", label: "Kelola Transaksi", note: "Status pesanan dan pembayaran" },
  ];

  const page = window.location.pathname.split("/").pop() || "index.html";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const state = {
    mapOpen: false,
    returnFocus: null,
    scrollFrame: 0,
  };

  const onReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const announce = (message) => {
    if (!message) return;
    if (window.NexA11y?.announce) {
      window.NexA11y.announce(message);
      return;
    }

    let region = document.getElementById("nexgear-experience-live");
    if (!region) {
      region = document.createElement("div");
      region.id = "nexgear-experience-live";
      region.className = "visually-hidden";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.append(region);
    }

    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = String(message);
    }, 20);
  };

  const readTheme = () => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch (error) {
      console.warn("NEXGEAR theme storage fallback", error);
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  };

  const applyTheme = (theme, { persist = false, announceChange = false } = {}) => {
    const next = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;

    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.append(meta);
    }
    meta.content = next === "light" ? "#f4f7fb" : "#05070b";

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (error) {
        console.warn("NEXGEAR theme persistence fallback", error);
      }
    }

    document.dispatchEvent(
      new CustomEvent("nexgear:themechange", { detail: { theme: next } }),
    );

    if (announceChange) {
      announce(`Tema ${next === "light" ? "terang" : "gelap"} aktif.`);
    }
  };

  const pageMapMarkup = () => {
    const groups = REQUIRED_PAGES.reduce((result, item) => {
      (result[item.group] ||= []).push(item);
      return result;
    }, {});

    const sections = Object.entries(groups)
      .map(
        ([group, items]) => `
          <section class="nx-page-map__group" aria-labelledby="nx-map-${group.toLowerCase()}">
            <h3 id="nx-map-${group.toLowerCase()}">${group}</h3>
            <div class="nx-page-map__grid">
              ${items
                .map((item) => {
                  const active = item.href === page;
                  return `
                    <a class="nx-page-map__item${active ? " is-current" : ""}" href="${item.href}"${active ? ' aria-current="page"' : ""}>
                      <span class="nx-page-map__index" aria-hidden="true">${String(REQUIRED_PAGES.indexOf(item) + 1).padStart(2, "0")}</span>
                      <span class="nx-page-map__copy">
                        <strong>${item.label}</strong>
                        <small>${item.note}</small>
                      </span>
                      <span class="nx-page-map__arrow" aria-hidden="true">↗</span>
                    </a>`;
                })
                .join("")}
            </div>
          </section>`,
      )
      .join("");

    return `
      <div class="nx-page-map__backdrop" data-nx-map-close></div>
      <div class="nx-page-map__panel" role="document">
        <header class="nx-page-map__header">
          <div>
            <span class="nx-page-map__eyebrow">Workshop Desain UI</span>
            <h2 id="nx-page-map-title">Peta 13 Halaman Wajib</h2>
            <p id="nx-page-map-description">Akses cepat seluruh alur yang dinilai pada brief UAS.</p>
          </div>
          <button class="nx-page-map__close" type="button" data-nx-map-close aria-label="Tutup peta halaman">×</button>
        </header>
        <div class="nx-page-map__body">${sections}</div>
        <footer class="nx-page-map__footer">
          <span><kbd>Alt</kbd> + <kbd>U</kbd> buka/tutup</span>
          <span>${REQUIRED_PAGES.length} halaman terhubung</span>
        </footer>
      </div>`;
  };

  const createPageMap = () => {
    if (document.getElementById("nx-page-map")) return;

    const modal = document.createElement("div");
    modal.id = "nx-page-map";
    modal.className = "nx-page-map";
    modal.hidden = true;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "nx-page-map-title");
    modal.setAttribute("aria-describedby", "nx-page-map-description");
    modal.innerHTML = pageMapMarkup();
    document.body.append(modal);

    modal.querySelectorAll("[data-nx-map-close]").forEach((control) => {
      control.addEventListener("click", () => setPageMap(false));
    });
  };

  const focusableInMap = () => {
    const modal = document.getElementById("nx-page-map");
    if (!modal || modal.hidden) return [];

    return Array.from(
      modal.querySelectorAll(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => element.getClientRects().length > 0);
  };

  const setPageMap = (open) => {
    createPageMap();
    const modal = document.getElementById("nx-page-map");
    if (!modal) return;

    state.mapOpen = Boolean(open);
    modal.hidden = !state.mapOpen;
    document.body.dataset.nxOverlayOpen = String(state.mapOpen);

    if (state.mapOpen) {
      state.returnFocus ||= document.activeElement;
      window.requestAnimationFrame(() => {
        modal.dataset.state = "open";
        const current = modal.querySelector('[aria-current="page"]');
        (current || focusableInMap()[0])?.focus();
      });
      announce("Peta halaman dibuka. Tersedia 13 halaman wajib UAS.");
      return;
    }

    modal.dataset.state = "closed";
    state.returnFocus?.focus?.();
    state.returnFocus = null;
    announce("Peta halaman ditutup.");
  };

  const initKeyboard = () => {
    document.addEventListener("keydown", (event) => {
      if (event.altKey && event.key.toLowerCase() === "u") {
        event.preventDefault();
        if (!state.mapOpen) state.returnFocus = document.activeElement;
        setPageMap(!state.mapOpen);
        return;
      }

      if (!state.mapOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        setPageMap(false);
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = focusableInMap();
      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  };

  const initScrollProgress = () => {
    if (document.querySelector("[data-nx-scroll-progress]")) return;

    const bar = document.createElement("div");
    bar.className = "nx-scroll-progress";
    bar.dataset.nxScrollProgress = "true";
    bar.setAttribute("aria-hidden", "true");
    document.body.prepend(bar);

    const render = () => {
      state.scrollFrame = 0;
      const root = document.documentElement;
      const max = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.min(1, Math.max(0, window.scrollY / max));
      bar.style.transform = `scaleX(${progress})`;
      bar.hidden = root.scrollHeight <= window.innerHeight + 4;
    };

    const schedule = () => {
      if (state.scrollFrame) return;
      state.scrollFrame = window.requestAnimationFrame(render);
    };

    render();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
  };

  const CARD_SELECTOR = [
    ".category-card",
    ".creator-product-card",
    ".showcase-card",
    ".insight-card",
    ".product-card",
    ".blog-card",
    ".article-card",
    ".support-card",
    ".profile-card",
    ".cart-summary",
    ".checkout-summary",
    ".payment-status-card",
    ".history-card",
    ".order-card",
    ".metric-card",
    ".stat-card",
    ".suite-stat",
    ".suite-card",
    ".admin-card",
    ".dashboard-card",
  ].join(",");

  const enhanceCard = (card) => {
    if (!(card instanceof HTMLElement) || card.dataset.nxMagicCard === "true") {
      return;
    }

    card.dataset.nxMagicCard = "true";
    card.classList.add("nx-magic-card");

    if (!finePointer.matches || reduceMotion.matches) return;

    let frame = 0;
    let x = -400;
    let y = -400;

    const paint = () => {
      frame = 0;
      card.style.setProperty("--nx-pointer-x", `${x}px`);
      card.style.setProperty("--nx-pointer-y", `${y}px`);
    };

    card.addEventListener(
      "pointermove",
      (event) => {
        const rect = card.getBoundingClientRect();
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
        if (!frame) frame = window.requestAnimationFrame(paint);
      },
      { passive: true },
    );

    card.addEventListener("pointerleave", () => {
      x = -400;
      y = -400;
      if (!frame) frame = window.requestAnimationFrame(paint);
    });
  };

  const scanCards = (root = document) => {
    root.querySelectorAll?.(CARD_SELECTOR).forEach(enhanceCard);
    if (root instanceof Element && root.matches(CARD_SELECTOR)) enhanceCard(root);
  };

  const initMagicCards = () => {
    scanCards();

    const observer = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) scanCards(node);
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });
  };

  const init = () => {
    applyTheme(readTheme());
    createPageMap();
    initKeyboard();
    initScrollProgress();
    initMagicCards();
    document.body.dataset.nxExperienceReady = "true";
  };

  applyTheme(readTheme());
  onReady(init);
  window.NexExperience = Object.freeze({
    applyTheme,
    openPageMap: () => setPageMap(true),
  });
})();
