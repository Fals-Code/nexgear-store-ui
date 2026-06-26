(() => {
  "use strict";

  const body = document.body;
  if (!body?.classList.contains("dashboard-v3")) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const liveRegion = $("#dashboard-live-region");

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
        // Dashboard tetap berfungsi saat penyimpanan browser diblokir.
      }
    },
  };

  const announce = (message) => {
    if (window.NexA11y?.announce) {
      window.NexA11y.announce(message);
      return;
    }
    if (!liveRegion) return;
    liveRegion.textContent = "";
    window.requestAnimationFrame(() => {
      liveRegion.textContent = message;
    });
  };

  const chartData = {
    "7d": {
      revenue: "Rp12,8jt",
      revenueTrend: "+18,2% dibanding 7 hari sebelumnya",
      orders: "47",
      orderTrend: "Rata-rata 6,7 pesanan per hari",
      labels: ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"],
      line: "M38 236L148 204L258 218L368 158L478 176L588 104L732 76",
      area: "M38 236L148 204L258 218L368 158L478 176L588 104L732 76L732 272L38 272Z",
      points: [[38, 236], [148, 204], [258, 218], [368, 158], [478, 176], [588, 104], [732, 76]],
      description: "Pendapatan meningkat selama tujuh hari terakhir dengan nilai tertinggi pada hari terakhir.",
    },
    "30d": {
      revenue: "Rp48,6jt",
      revenueTrend: "+12,4% dibanding 30 hari sebelumnya",
      orders: "184",
      orderTrend: "Rata-rata 6,1 pesanan per hari",
      labels: ["1", "5", "10", "15", "20", "25", "30"],
      line: "M38 220L148 178L258 192L368 128L478 150L588 86L732 112",
      area: "M38 220L148 178L258 192L368 128L478 150L588 86L732 112L732 272L38 272Z",
      points: [[38, 220], [148, 178], [258, 192], [368, 128], [478, 150], [588, 86], [732, 112]],
      description: "Pendapatan tiga puluh hari bergerak naik dengan beberapa koreksi di pertengahan periode.",
    },
    "90d": {
      revenue: "Rp139,2jt",
      revenueTrend: "+21,7% dibanding 90 hari sebelumnya",
      orders: "526",
      orderTrend: "Rata-rata 5,8 pesanan per hari",
      labels: ["Apr", "M1", "Mei", "M2", "Jun", "M3", "Hari ini"],
      line: "M38 242L148 214L258 164L368 188L478 132L588 108L732 68",
      area: "M38 242L148 214L258 164L368 188L478 132L588 108L732 68L732 272L38 272Z",
      points: [[38, 242], [148, 214], [258, 164], [368, 188], [478, 132], [588, 108], [732, 68]],
      description: "Pendapatan sembilan puluh hari menunjukkan tren pertumbuhan berkelanjutan hingga hari ini.",
    },
  };

  const setTheme = (theme, shouldAnnounce = false) => {
    const next = theme === "light" ? "light" : "dark";
    body.dataset.adminTheme = next;
    storage.write("nexgear-admin-theme", next);

    const toggle = $("[data-theme-toggle]");
    if (toggle) {
      const isLight = next === "light";
      toggle.setAttribute("aria-label", isLight ? "Gunakan tema gelap" : "Gunakan tema terang");
      toggle.title = isLight ? "Tema gelap" : "Tema terang";
    }

    document.dispatchEvent(new CustomEvent("nexgear:themechange", { detail: { theme: next } }));
    if (shouldAnnounce) announce(`Tema ${next === "light" ? "terang" : "gelap"} diaktifkan.`);
  };

  const initTheme = () => {
    const preferred = window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
    setTheme(storage.read("nexgear-admin-theme", preferred));
    $("[data-theme-toggle]")?.addEventListener("click", () => {
      setTheme(body.dataset.adminTheme === "light" ? "dark" : "light", true);
    });
  };

  const closeSidebar = () => {
    body.classList.remove("admin-menu-open");
    $(".admin-menu-toggle")?.setAttribute("aria-expanded", "false");
  };

  const initSidebar = () => {
    const toggle = $(".admin-menu-toggle");
    const backdrop = $("[data-sidebar-close]");

    toggle?.addEventListener("click", () => {
      window.requestAnimationFrame(() => {
        toggle.setAttribute("aria-expanded", String(body.classList.contains("admin-menu-open")));
      });
    });

    backdrop?.addEventListener("click", closeSidebar);
    $$(".admin-nav-link").forEach((link) => link.addEventListener("click", closeSidebar));
  };

  const initDate = () => {
    const target = $("[data-dashboard-date]");
    if (!target) return;
    target.textContent = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
  };

  const closeNotifications = () => {
    const panel = $("#dashboard-notifications");
    const toggle = $("[data-notification-toggle]");
    if (!panel || !toggle) return;
    panel.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
  };

  const initNotifications = () => {
    const panel = $("#dashboard-notifications");
    const toggle = $("[data-notification-toggle]");
    if (!panel || !toggle) return;

    toggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const shouldOpen = panel.hidden;
      panel.hidden = !shouldOpen;
      toggle.setAttribute("aria-expanded", String(shouldOpen));
      if (shouldOpen) announce("Panel notifikasi dibuka. Terdapat tiga notifikasi baru.");
    });

    panel.addEventListener("click", (event) => {
      event.stopPropagation();
      const markButton = event.target.closest("[data-mark-notifications]");
      if (!markButton) return;
      const badge = panel.querySelector("header small");
      if (badge) badge.textContent = "Semua dibaca";
      toggle.querySelector(".admin-dot")?.remove();
      announce("Semua notifikasi ditandai sudah dibaca.");
    });

    document.addEventListener("click", (event) => {
      if (!event.target.closest("#dashboard-notifications") && !event.target.closest("[data-notification-toggle]")) {
        closeNotifications();
      }
    });
  };

  const renderChart = (range) => {
    const data = chartData[range];
    const chart = $(".dashboard-chart");
    if (!data || !chart) return;

    chart.dataset.chartState = "updating";

    window.setTimeout(() => {
      $("[data-revenue-value]").textContent = data.revenue;
      $("[data-revenue-trend]").textContent = data.revenueTrend;
      $("[data-order-value]").textContent = data.orders;
      $("[data-order-trend]").textContent = data.orderTrend;
      $("[data-chart-line]").setAttribute("d", data.line);
      $("[data-chart-area]").setAttribute("d", data.area);
      $("[data-chart-points]").innerHTML = data.points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5"></circle>`).join("");
      $("[data-chart-labels]").innerHTML = data.labels.map((label) => `<span>${label}</span>`).join("");
      $("#sales-chart-desc").textContent = data.description;
      chart.dataset.chartState = "ready";
      announce(`Rentang grafik diperbarui. ${data.revenueTrend}`);
    }, 130);
  };

  const initChart = () => {
    const rangeGroup = $(".dashboard-range");
    if (!rangeGroup) return;

    rangeGroup.addEventListener("click", (event) => {
      const button = event.target.closest("[data-range]");
      if (!button || button.dataset.state === "active") return;

      $$("[data-range]", rangeGroup).forEach((item) => {
        const active = item === button;
        item.dataset.state = active ? "active" : "idle";
        item.setAttribute("aria-pressed", String(active));
      });

      renderChart(button.dataset.range);
    });
  };

  const initSearch = () => {
    const input = $("#dashboard-search");
    const emptyState = $("#dashboard-search-empty");
    if (!input) return;

    const items = $$("[data-dashboard-searchable]");
    const apply = () => {
      const query = input.value.trim().toLowerCase();
      let visibleTransactions = 0;

      items.forEach((item) => {
        const searchable = (item.dataset.dashboardSearchable || item.textContent).toLowerCase();
        const visible = !query || searchable.includes(query);
        item.hidden = !visible;
        if (visible && item.matches(".dashboard-table tbody tr")) visibleTransactions += 1;
      });

      if (emptyState) {
        emptyState.hidden = !query || visibleTransactions > 0;
      }

      if (query) announce(`${items.filter((item) => !item.hidden).length} item cocok dengan pencarian.`);
    };

    input.addEventListener("input", apply);

    document.addEventListener("keydown", (event) => {
      const editable = event.target instanceof HTMLInputElement
        || event.target instanceof HTMLTextAreaElement
        || event.target instanceof HTMLSelectElement
        || event.target?.isContentEditable;

      if (event.key === "/" && !editable) {
        event.preventDefault();
        input.focus();
        input.select();
      }
    });
  };

  const initReveal = () => {
    const targets = $$(".admin-reveal");
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -24px" });

    targets.forEach((target, index) => {
      target.style.setProperty("--reveal-delay", `${Math.min(index * 55, 260)}ms`);
      observer.observe(target);
    });
  };

  const initKeyboard = () => {
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      closeSidebar();
      closeNotifications();
    });
  };

  const init = () => {
    body.classList.add("dashboard-v3-ready");
    initTheme();
    initSidebar();
    initDate();
    initNotifications();
    initChart();
    initSearch();
    initReveal();
    initKeyboard();
  };

  window.NexDashboard = Object.freeze({ setTheme, renderChart, closeSidebar });
  init();
})();