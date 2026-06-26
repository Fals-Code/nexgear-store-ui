(() => {
  "use strict";

  if (window.NexAdminControl) return;

  const body = document.body;
  if (!body?.classList.contains("page-admin")) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const storage = {
    read(key, fallback = null) {
      try {
        const value = localStorage.getItem(key);
        return value === null ? fallback : JSON.parse(value);
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Prototype tetap dapat digunakan saat storage diblokir browser.
      }
    },
  };

  const pageFile = window.location.pathname.split("/").pop() || "admin-dashboard.html";
  const pageKey = body.dataset.adminPage || (pageFile.includes("articles") ? "articles" : "dashboard");
  const pageLabels = {
    dashboard: "Dashboard",
    articles: "Artikel",
    products: "Produk",
    users: "Pengguna",
    transactions: "Transaksi",
  };

  const routes = [
    { id: "dashboard", label: "Dashboard", hint: "Ringkasan performa dan prioritas", href: "admin-dashboard.html", keys: "G D" },
    { id: "articles", label: "Kelola Artikel", hint: "Publikasi, draft, dan jadwal", href: "admin-articles.html", keys: "G A" },
    { id: "products", label: "Kelola Produk", hint: "Katalog, harga, dan inventori", href: "admin-products.html", keys: "G P" },
    { id: "users", label: "Kelola Pengguna", hint: "Role, status, dan pelanggan", href: "admin-users.html", keys: "G U" },
    { id: "transactions", label: "Kelola Transaksi", hint: "Pembayaran hingga pengiriman", href: "admin-transactions.html", keys: "G T" },
    { id: "store", label: "Preview Store", hint: "Buka storefront NEXGEAR", href: "index.html", keys: "P S" },
  ];

  const announce = (message) => window.NexA11y?.announce?.(message);

  const createSvg = (name) => {
    const icons = {
      search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4.4-4.4"></path></svg>',
      bell: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"></path><path d="M10 19a2 2 0 0 0 4 0"></path></svg>',
      moon: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 15.2A8.4 8.4 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"></path></svg>',
      sun: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"></path></svg>',
      command: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6V5a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v14a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V5"></path></svg>',
      arrow: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>',
    };
    return icons[name] || "";
  };

  const closeMobileSidebar = () => {
    body.classList.remove("admin-menu-open");
    $(".admin-menu-toggle")?.setAttribute("aria-expanded", "false");
  };

  const enhanceSidebar = () => {
    const sidebar = $(".admin-sidebar");
    const nav = $(".admin-nav", sidebar || document);
    if (!sidebar || !nav || $(".admin-workspace-meta", sidebar)) return;

    const meta = document.createElement("div");
    meta.className = "admin-workspace-meta";
    meta.innerHTML = `
      <span class="admin-workspace-kicker">Workspace</span>
      <strong>Commerce Operations</strong>
      <small><i aria-hidden="true"></i> Sistem operasional</small>`;
    sidebar.insertBefore(meta, nav);

    const label = document.createElement("p");
    label.className = "admin-nav-label";
    label.textContent = "Navigasi utama";
    nav.prepend(label);

    $$('.admin-nav-link[href*="admin-products"]', nav).forEach((link) => link.dataset.badge = "5");
    $$('.admin-nav-link[href*="admin-transactions"]', nav).forEach((link) => link.dataset.badge = "8");

    const footer = $(".admin-sidebar-footer", sidebar);
    if (footer) {
      const status = document.createElement("div");
      status.className = "admin-system-card";
      status.innerHTML = `
        <span class="admin-system-card__icon" aria-hidden="true">✓</span>
        <div><strong>Store Online</strong><small>Semua layanan normal</small></div>`;
      footer.prepend(status);
    }

    const backdrop = document.createElement("button");
    backdrop.type = "button";
    backdrop.className = "admin-sidebar-backdrop";
    backdrop.setAttribute("aria-label", "Tutup navigasi admin");
    backdrop.addEventListener("click", closeMobileSidebar);
    body.append(backdrop);
  };

  const setTheme = (theme, shouldAnnounce = false) => {
    const next = theme === "light" ? "light" : "dark";
    body.dataset.adminTheme = next;
    storage.write("nexgear-admin-theme", next);
    const button = $("[data-admin-theme-toggle]");
    if (button) {
      const light = next === "light";
      button.innerHTML = createSvg(light ? "moon" : "sun");
      button.setAttribute("aria-label", light ? "Gunakan tema gelap" : "Gunakan tema terang");
      button.title = light ? "Tema gelap" : "Tema terang";
    }
    if (shouldAnnounce) announce(`Tema ${next === "light" ? "terang" : "gelap"} diaktifkan.`);
  };

  const createThemeToggle = () => {
    const actions = $(".admin-topbar-actions");
    if (!actions || $("[data-admin-theme-toggle]", actions)) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "admin-icon-button admin-theme-toggle";
    button.dataset.adminThemeToggle = "true";
    button.addEventListener("click", () => setTheme(body.dataset.adminTheme === "light" ? "dark" : "light", true));
    const notification = $(".admin-icon-button", actions);
    actions.insertBefore(button, notification || actions.firstChild);
    setTheme(storage.read("nexgear-admin-theme", "dark"));
  };

  let commandReturnFocus = null;
  let commandItems = [];

  const closeCommand = () => {
    const overlay = $("#admin-command-palette");
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    body.dataset.commandOpen = "false";
    commandReturnFocus?.focus?.();
    announce("Pusat perintah ditutup.");
  };

  const focusPageSearch = () => {
    const input = $("#suite-search") || $("#article-search-input") || $(".admin-global-search input");
    input?.focus();
    input?.select?.();
  };

  const renderCommandItems = (query = "") => {
    const list = $("#admin-command-results");
    if (!list) return;
    const normalized = query.trim().toLowerCase();
    const actions = [
      ...routes,
      {
        id: "theme",
        label: body.dataset.adminTheme === "light" ? "Aktifkan Tema Gelap" : "Aktifkan Tema Terang",
        hint: "Ubah tampilan panel admin",
        action: () => setTheme(body.dataset.adminTheme === "light" ? "dark" : "light", true),
        keys: "T",
      },
      {
        id: "search",
        label: "Cari Data di Halaman Ini",
        hint: "Fokus ke pencarian tabel aktif",
        action: focusPageSearch,
        keys: "/",
      },
    ];
    commandItems = actions.filter((item) => `${item.label} ${item.hint} ${item.id}`.toLowerCase().includes(normalized));

    list.innerHTML = commandItems.length
      ? commandItems
          .map(
            (item, index) => `
              <button type="button" class="admin-command-item${index === 0 ? " is-active" : ""}" data-command-index="${index}" role="option" aria-selected="${index === 0}">
                <span class="admin-command-item__icon" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
                <span><strong>${item.label}</strong><small>${item.hint}</small></span>
                <kbd>${item.keys || "↵"}</kbd>
              </button>`,
          )
          .join("")
      : '<div class="admin-command-empty"><strong>Tidak ada perintah yang cocok</strong><span>Coba kata kunci lain.</span></div>';
  };

  const runCommand = (index) => {
    const item = commandItems[Number(index)];
    if (!item) return;
    closeCommand();
    if (item.href) window.location.href = item.href;
    else item.action?.();
  };

  const openCommand = (source = document.activeElement) => {
    const overlay = $("#admin-command-palette");
    if (!overlay) return;
    commandReturnFocus = source instanceof HTMLElement ? source : null;
    overlay.hidden = false;
    body.dataset.commandOpen = "true";
    const input = $("#admin-command-input");
    input.value = "";
    renderCommandItems();
    window.setTimeout(() => input.focus(), 20);
    announce("Pusat perintah dibuka.");
  };

  const createCommandPalette = () => {
    if ($("#admin-command-palette")) return;

    const overlay = document.createElement("div");
    overlay.id = "admin-command-palette";
    overlay.className = "admin-command-palette";
    overlay.hidden = true;
    overlay.innerHTML = `
      <button type="button" class="admin-command-backdrop" data-command-close aria-label="Tutup pusat perintah"></button>
      <section class="admin-command-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-command-title">
        <header class="admin-command-header">
          ${createSvg("search")}
          <label class="visually-hidden" for="admin-command-input">Cari menu atau perintah</label>
          <input id="admin-command-input" type="search" autocomplete="off" placeholder="Cari halaman, aksi, atau data…">
          <kbd>ESC</kbd>
        </header>
        <div class="admin-command-meta"><strong id="admin-command-title">Command Center</strong><span>${pageLabels[pageKey] || "Admin"}</span></div>
        <div class="admin-command-results" id="admin-command-results" role="listbox"></div>
        <footer class="admin-command-footer"><span><kbd>↑</kbd><kbd>↓</kbd> Navigasi</span><span><kbd>↵</kbd> Pilih</span><span><kbd>ESC</kbd> Tutup</span></footer>
      </section>`;
    body.append(overlay);

    $("#admin-command-input").addEventListener("input", (event) => renderCommandItems(event.target.value));
    $("#admin-command-input").addEventListener("keydown", (event) => {
      const buttons = $$(".admin-command-item", overlay);
      if (!buttons.length) return;
      const current = Math.max(0, buttons.findIndex((button) => button.classList.contains("is-active")));
      let next = current;
      if (event.key === "ArrowDown") next = (current + 1) % buttons.length;
      else if (event.key === "ArrowUp") next = (current - 1 + buttons.length) % buttons.length;
      else if (event.key === "Enter") {
        event.preventDefault();
        runCommand(buttons[current].dataset.commandIndex);
        return;
      } else return;
      event.preventDefault();
      buttons.forEach((button, index) => {
        button.classList.toggle("is-active", index === next);
        button.setAttribute("aria-selected", String(index === next));
      });
      buttons[next].scrollIntoView({ block: "nearest" });
    });
    overlay.addEventListener("click", (event) => {
      const close = event.target.closest("[data-command-close]");
      const item = event.target.closest("[data-command-index]");
      if (close) closeCommand();
      if (item) runCommand(item.dataset.commandIndex);
    });

    const actions = $(".admin-topbar-actions");
    if (actions && !$("[data-command-open]", actions)) {
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.className = "admin-command-trigger";
      trigger.dataset.commandOpen = "true";
      trigger.innerHTML = `${createSvg("command")}<span>Command</span><kbd>⌘K</kbd>`;
      trigger.addEventListener("click", (event) => openCommand(event.currentTarget));
      actions.prepend(trigger);
    }
  };

  const createNotificationPanel = () => {
    const actions = $(".admin-topbar-actions");
    const button = actions ? $(".admin-icon-button:not(.admin-theme-toggle)", actions) : null;
    if (!button || $("#admin-notification-panel")) return;

    button.innerHTML = `${createSvg("bell")}<span class="admin-dot" aria-hidden="true"></span>`;
    button.setAttribute("aria-haspopup", "true");
    button.setAttribute("aria-expanded", "false");

    const panel = document.createElement("aside");
    panel.id = "admin-notification-panel";
    panel.className = "admin-notification-panel";
    panel.hidden = true;
    panel.innerHTML = `
      <header><div><span>Inbox operasional</span><strong>Notifikasi</strong></div><small>3 baru</small></header>
      <div class="admin-notification-list">
        <a href="admin-transactions.html"><i class="is-warning" aria-hidden="true"></i><span><strong>8 pembayaran menunggu</strong><small>Periksa transaksi yang mendekati batas waktu.</small></span><time>4m</time></a>
        <a href="admin-products.html"><i class="is-danger" aria-hidden="true"></i><span><strong>5 stok mulai menipis</strong><small>Prioritaskan restock sebelum katalog kehabisan.</small></span><time>22m</time></a>
        <a href="admin-articles.html"><i class="is-info" aria-hidden="true"></i><span><strong>4 artikel masih draft</strong><small>Editorial menunggu review publikasi.</small></span><time>1j</time></a>
      </div>
      <footer><button type="button" data-mark-notifications>Tandai semua dibaca</button></footer>`;
    actions.append(panel);

    const close = () => {
      panel.hidden = true;
      button.setAttribute("aria-expanded", "false");
    };
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const opening = panel.hidden;
      panel.hidden = !opening;
      button.setAttribute("aria-expanded", String(opening));
      if (opening) announce("Panel notifikasi dibuka. Terdapat tiga notifikasi baru.");
    });
    panel.addEventListener("click", (event) => {
      const mark = event.target.closest("[data-mark-notifications]");
      if (!mark) return;
      panel.querySelector("header small").textContent = "Semua dibaca";
      button.querySelector(".admin-dot")?.remove();
      announce("Semua notifikasi ditandai sudah dibaca.");
    });
    document.addEventListener("click", (event) => {
      if (!event.target.closest("#admin-notification-panel") && !event.target.closest(".admin-icon-button:not(.admin-theme-toggle)")) close();
    });
  };

  const enhanceTopbarSearch = () => {
    const wrapper = $(".admin-global-search");
    const input = wrapper?.querySelector("input");
    if (!wrapper || !input) return;
    if (!wrapper.querySelector("svg")) wrapper.insertAdjacentHTML("afterbegin", createSvg("search"));
    if (!wrapper.querySelector("kbd")) wrapper.insertAdjacentHTML("beforeend", "<kbd>/</kbd>");
    input.setAttribute("aria-label", "Cari data pada halaman ini");

    const sync = () => {
      const target = $("#suite-search") || $("#article-search-input");
      if (!target || target === input) return;
      target.value = input.value;
      target.dispatchEvent(new Event("input", { bubbles: true }));
    };
    input.addEventListener("input", sync);
  };

  const createContextStrip = () => {
    const hero = $(".admin-hero");
    if (!hero || $(".admin-context-strip")) return;
    const strip = document.createElement("section");
    strip.className = "admin-context-strip admin-reveal";
    strip.setAttribute("aria-label", "Status ruang kerja");
    strip.innerHTML = `
      <div><span class="admin-context-icon" aria-hidden="true">⌘</span><p><strong>Command Center</strong><small>Gunakan <kbd>Ctrl/⌘ K</kbd> untuk berpindah halaman lebih cepat.</small></p></div>
      <div><span class="admin-context-icon" aria-hidden="true">/</span><p><strong>Pencarian Instan</strong><small>Tekan <kbd>/</kbd> untuk fokus ke data pada halaman aktif.</small></p></div>
      <div><span class="admin-context-icon is-online" aria-hidden="true"></span><p><strong>Prototype Synced</strong><small>Perubahan tersimpan lokal pada browser ini.</small></p></div>`;
    hero.insertAdjacentElement("afterend", strip);
  };

  const createDashboardOps = () => {
    if (pageKey !== "dashboard" || $(".admin-ops-strip")) return;
    const metrics = $(".metric-grid");
    if (!metrics) return;
    const section = document.createElement("section");
    section.className = "admin-ops-strip admin-reveal";
    section.setAttribute("aria-labelledby", "admin-priority-title");
    section.innerHTML = `
      <header><span>Focus queue</span><h2 id="admin-priority-title">Prioritas hari ini</h2></header>
      <div class="admin-ops-actions">
        <a href="admin-transactions.html"><span class="admin-ops-index">01</span><p><strong>Verifikasi 8 pembayaran</strong><small>Batas respons operasional 30 menit</small></p>${createSvg("arrow")}</a>
        <a href="admin-products.html"><span class="admin-ops-index">02</span><p><strong>Restock 5 produk</strong><small>Dua SKU telah habis</small></p>${createSvg("arrow")}</a>
        <a href="admin-articles.html"><span class="admin-ops-index">03</span><p><strong>Review 4 draft</strong><small>Dua artikel dijadwalkan minggu ini</small></p>${createSvg("arrow")}</a>
      </div>`;
    metrics.insertAdjacentElement("afterend", section);
  };

  const decorateMetrics = () => {
    const cards = $$(".metric-card, .admin-stat-card");
    const bars = [42, 68, 54, 82, 34, 72, 61, 88];
    cards.forEach((card, index) => {
      if (card.querySelector(".admin-card-spark")) return;
      const spark = document.createElement("span");
      spark.className = "admin-card-spark";
      spark.setAttribute("aria-hidden", "true");
      spark.innerHTML = [0, 1, 2, 3, 4]
        .map((offset) => `<i style="--spark:${Math.max(18, Math.min(94, bars[(index + offset) % bars.length] + offset * 3))}%"></i>`)
        .join("");
      card.append(spark);
    });
  };

  const initReveal = () => {
    const targets = $$(".admin-reveal, .metric-card, .admin-stat-card, .suite-panel, .article-panel");
    if (!targets.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -30px" },
    );
    targets.forEach((target, index) => {
      target.style.setProperty("--reveal-delay", `${Math.min(index * 45, 240)}ms`);
      observer.observe(target);
    });
  };

  const initKeyboard = () => {
    let pendingG = false;
    let pendingTimer = 0;
    document.addEventListener("keydown", (event) => {
      const editable = event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement || event.target?.isContentEditable;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openCommand(event.target);
        return;
      }
      if (event.key === "Escape") {
        closeCommand();
        closeMobileSidebar();
        return;
      }
      if (editable) return;
      if (event.key === "/") {
        event.preventDefault();
        focusPageSearch();
        return;
      }
      if (event.key.toLowerCase() === "g") {
        pendingG = true;
        window.clearTimeout(pendingTimer);
        pendingTimer = window.setTimeout(() => (pendingG = false), 900);
        return;
      }
      if (!pendingG) return;
      const route = routes.find((item) => item.keys === `G ${event.key.toUpperCase()}`);
      pendingG = false;
      if (route) window.location.href = route.href;
    });
  };

  const initMobileMenuSync = () => {
    const toggle = $(".admin-menu-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      window.requestAnimationFrame(() => {
        const open = body.classList.contains("admin-menu-open");
        toggle.setAttribute("aria-expanded", String(open));
      });
    });
  };

  const init = () => {
    body.classList.add("admin-v2-ready");
    enhanceSidebar();
    createThemeToggle();
    createCommandPalette();
    createNotificationPanel();
    enhanceTopbarSearch();
    createContextStrip();
    createDashboardOps();
    decorateMetrics();
    initMobileMenuSync();
    initKeyboard();
    initReveal();
  };

  window.NexAdminControl = Object.freeze({ openCommand, closeCommand, setTheme });
  init();
})();
