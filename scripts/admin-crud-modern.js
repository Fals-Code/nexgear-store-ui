(() => {
  "use strict";

  if (window.NexAdminCrudModern) return;

  const body = document.body;
  if (!body?.classList.contains("page-admin")) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const page = body.dataset.adminPage || (body.classList.contains("page-admin-articles") ? "articles" : "");
  const supportedPages = new Set(["articles", "products", "users", "transactions"]);
  if (!supportedPages.has(page)) return;

  const config = {
    articles: {
      eyebrow: "Content database",
      title: "Daftar Artikel",
      description: "Cari, filter, edit, jadwalkan, dan kelola publikasi tanpa berpindah konteks.",
      singular: "artikel",
      plural: "artikel",
      search: "#article-search-input",
      filters: ["#article-status-filter", "#article-category-filter", "#article-sort"],
      count: "#article-visible-count",
      panel: ".article-panel",
      toolbar: ".article-toolbar",
      reset: "#article-reset-filter",
      gridButton: ".article-view-toggle [data-view='grid']",
      tableButton: ".article-view-toggle [data-view='table']",
      drawer: "#editor-drawer",
      form: "#editor-drawer form",
      imageInput: "#editor-image-input",
      menu: "#article-row-menu",
      statFilters: ["all", "published", "draft", "scheduled"],
    },
    products: {
      eyebrow: "Inventory database",
      title: "Daftar Produk",
      description: "Kelola katalog, harga, stok, status, dan visibilitas produk dari satu workspace.",
      singular: "produk",
      plural: "produk",
      search: "#suite-search",
      filters: ["#suite-filter-1", "#suite-filter-2", "#suite-sort"],
      count: "#suite-count",
      panel: ".suite-panel",
      toolbar: ".suite-toolbar",
      reset: "#suite-reset",
      gridButton: ".suite-view-toggle [data-view='grid']",
      tableButton: ".suite-view-toggle [data-view='table']",
      drawer: "#suite-drawer",
      form: "#suite-form",
      imageInput: "[name='image']",
      menu: "#suite-menu",
      statFilters: ["all", "active", "low", "out"],
    },
    users: {
      eyebrow: "Customer database",
      title: "Daftar Pengguna",
      description: "Kelola identitas, role, status akun, dan akses pengguna secara terstruktur.",
      singular: "pengguna",
      plural: "pengguna",
      search: "#suite-search",
      filters: ["#suite-filter-1", "#suite-filter-2", "#suite-sort"],
      count: "#suite-count",
      panel: ".suite-panel",
      toolbar: ".suite-toolbar",
      reset: "#suite-reset",
      gridButton: ".suite-view-toggle [data-view='grid']",
      tableButton: ".suite-view-toggle [data-view='table']",
      drawer: "#suite-drawer",
      form: "#suite-form",
      imageInput: null,
      menu: "#suite-menu",
      statFilters: ["all", "active", null, "blocked"],
    },
    transactions: {
      eyebrow: "Order database",
      title: "Daftar Transaksi",
      description: "Pantau pembayaran, pemrosesan, pengiriman, refund, dan penyelesaian pesanan.",
      singular: "transaksi",
      plural: "transaksi",
      search: "#suite-search",
      filters: ["#suite-filter-1", "#suite-filter-2", "#suite-sort"],
      count: "#suite-count",
      panel: ".suite-panel",
      toolbar: ".suite-toolbar",
      reset: "#suite-reset",
      gridButton: ".suite-view-toggle [data-view='grid']",
      tableButton: ".suite-view-toggle [data-view='table']",
      drawer: "#suite-drawer",
      form: "#suite-form",
      imageInput: null,
      menu: "#suite-menu",
      statFilters: ["all", "waiting", "processing", null],
    },
  }[page];

  const panel = $(config.panel);
  const toolbar = $(config.toolbar);
  const searchInput = $(config.search);
  const countNode = $(config.count);
  const filterControls = config.filters.map((selector) => $(selector)).filter(Boolean);
  const drawer = $(config.drawer);
  const form = $(config.form);
  const viewStorageKey = `nexgear-admin-${page}-view-v2`;
  let liveRegion = null;
  let lastModalFocus = null;
  let formInitialSnapshot = "";

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
        // UI tetap berjalan saat storage browser diblokir.
      }
    },
  };

  const escapeHtml = (value) => String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

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

  const dispatchInput = (control) => {
    if (!control) return;
    const eventName = control.matches("input, textarea") ? "input" : "change";
    control.dispatchEvent(new Event(eventName, { bubbles: true }));
  };

  const showToast = (message) => {
    const toast = $(page === "articles" ? "#admin-toast" : "#suite-toast");
    if (!toast) {
      announce(message);
      return;
    }
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2800);
    announce(message);
  };

  const getCount = () => Number.parseInt(countNode?.textContent || "0", 10) || 0;

  const createLiveRegion = () => {
    liveRegion = document.createElement("div");
    liveRegion.className = "crud-live-region";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    liveRegion.setAttribute("aria-atomic", "true");
    document.body.append(liveRegion);
  };

  const createPanelHeading = () => {
    if (!panel || !toolbar || $(".crud-panel-heading", panel)) return;

    const heading = document.createElement("header");
    heading.className = "crud-panel-heading";
    heading.innerHTML = `
      <div class="crud-panel-heading__copy">
        <span class="crud-panel-heading__eyebrow">${config.eyebrow}</span>
        <h2>${config.title}</h2>
        <p>${config.description}</p>
      </div>
      <div class="crud-panel-heading__actions">
        <span class="crud-sync-state"><i aria-hidden="true"></i> Tersimpan lokal</span>
        <span class="crud-record-count"><strong data-crud-record-count>${getCount()}</strong> ${config.plural}</span>
        <button class="crud-refresh-button" type="button" data-crud-refresh aria-label="Segarkan data" title="Segarkan data">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6v5h-5"></path><path d="M4 18v-5h5"></path><path d="M18.5 9A7 7 0 0 0 6.2 6.2L4 8"></path><path d="M5.5 15A7 7 0 0 0 17.8 17.8L20 16"></path></svg>
        </button>
      </div>`;
    panel.insertBefore(heading, toolbar);

    const refresh = $("[data-crud-refresh]", heading);
    refresh.addEventListener("click", () => {
      refresh.dataset.state = "loading";
      panel.dataset.refreshing = "true";
      filterControls.forEach(dispatchInput);
      dispatchInput(searchInput);
      window.setTimeout(() => {
        refresh.dataset.state = "idle";
        panel.dataset.refreshing = "false";
        showToast("Data berhasil disegarkan.");
      }, 520);
    });
  };

  const syncRecordCount = () => {
    const target = $("[data-crud-record-count]");
    if (target) target.textContent = String(getCount());
  };

  const observeCount = () => {
    if (!countNode) return;
    countNode.setAttribute("aria-live", "polite");
    const observer = new MutationObserver(syncRecordCount);
    observer.observe(countNode, { childList: true, characterData: true, subtree: true });
  };

  const enhanceSearch = () => {
    if (!searchInput) return;
    const label = searchInput.closest("label");
    if (!label || $(".crud-search-clear", label)) return;

    label.classList.add("crud-search-shell");
    searchInput.setAttribute("autocomplete", "off");
    searchInput.setAttribute("aria-label", `Cari ${config.plural}`);

    let icon = $("svg", label);
    if (!icon) {
      icon = document.createElement("span");
      icon.className = "crud-search-icon";
      icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-4.4-4.4"></path></svg>';
      label.prepend(icon);
    } else {
      icon.classList.add("crud-search-icon");
    }

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "crud-search-clear";
    clear.setAttribute("aria-label", "Hapus pencarian");
    clear.textContent = "×";
    clear.hidden = !searchInput.value;
    label.append(clear);

    const syncClear = () => {
      clear.hidden = !searchInput.value.trim();
      updateActiveFilters();
    };

    searchInput.addEventListener("input", syncClear);
    clear.addEventListener("click", () => {
      searchInput.value = "";
      dispatchInput(searchInput);
      searchInput.focus();
      syncClear();
    });
  };

  let activeFiltersBar = null;

  const describeControl = (control) => {
    if (!control) return null;
    if (control === searchInput) {
      const value = control.value.trim();
      return value ? { label: "Pencarian", value: `“${value}”` } : null;
    }
    if (control.value === "all" || !control.value) return null;
    const option = control.selectedOptions?.[0];
    const isSort = control.id.includes("sort");
    return {
      label: isSort ? "Urutan" : control.id.includes("category") || control.id.includes("filter-2") ? "Kategori/tipe" : "Status",
      value: option?.textContent.trim() || control.value,
    };
  };

  const updateActiveStat = () => {
    const statusControl = page === "articles" ? $("#article-status-filter") : $("#suite-filter-1");
    const status = statusControl?.value || "all";
    $$("[data-crud-filter]").forEach((card) => {
      card.dataset.filterActive = String(card.dataset.crudFilter === status);
    });
  };

  function updateActiveFilters() {
    if (!activeFiltersBar) return;
    const descriptors = [describeControl(searchInput), ...filterControls.map(describeControl)].filter(Boolean);
    activeFiltersBar.hidden = descriptors.length === 0;
    activeFiltersBar.dataset.state = descriptors.length ? "active" : "idle";
    activeFiltersBar.innerHTML = descriptors.length
      ? `<span class="crud-filter-label">Filter aktif</span>${descriptors.map((item) => `<span class="crud-filter-chip"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></span>`).join("")}<button class="crud-reset-filters" type="button" data-crud-reset>Reset semua</button>`
      : "";

    $("[data-crud-reset]", activeFiltersBar)?.addEventListener("click", resetFilters);
    updateActiveStat();
  }

  const resetFilters = () => {
    if (searchInput) searchInput.value = "";
    filterControls.forEach((control, index) => {
      if (control.id.includes("sort")) {
        control.selectedIndex = 0;
      } else {
        control.value = "all";
      }
      dispatchInput(control);
    });
    dispatchInput(searchInput);
    updateActiveFilters();
    searchInput?.focus();
    announce("Semua filter direset.");
  };

  const createActiveFilters = () => {
    if (!toolbar || $(".crud-active-filters", panel)) return;
    activeFiltersBar = document.createElement("div");
    activeFiltersBar.className = "crud-active-filters";
    activeFiltersBar.hidden = true;
    toolbar.insertAdjacentElement("afterend", activeFiltersBar);

    [searchInput, ...filterControls].filter(Boolean).forEach((control) => {
      control.addEventListener(control.matches("input") ? "input" : "change", updateActiveFilters);
    });
    updateActiveFilters();
  };

  const enhanceMetricCards = () => {
    const cards = $$(page === "articles" ? ".admin-stat-card" : ".metric-card");
    const statusControl = page === "articles" ? $("#article-status-filter") : $("#suite-filter-1");
    if (!statusControl) return;

    cards.forEach((card, index) => {
      const filter = config.statFilters[index];
      if (!filter) return;
      card.dataset.crudFilter = filter;
      card.setAttribute("role", "button");
      card.tabIndex = 0;
      card.setAttribute("aria-label", `${card.textContent.trim()}. Tampilkan data ini.`);

      const apply = () => {
        statusControl.value = filter;
        dispatchInput(statusControl);
        updateActiveFilters();
        panel?.scrollIntoView({ behavior: "smooth", block: "start" });
        announce(`Filter ${filter === "all" ? "semua data" : statusControl.selectedOptions[0]?.textContent || filter} diterapkan.`);
      };

      card.addEventListener("click", apply);
      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        apply();
      });
    });
    updateActiveStat();
  };

  const getCurrentView = () => body.dataset.view || ($(`${config.gridButton}.is-active`) ? "grid" : "table");

  const activateView = (view, persist = true) => {
    const button = $(view === "grid" ? config.gridButton : config.tableButton);
    if (!button) return;
    button.click();
    if (persist) storage.write(viewStorageKey, view);
  };

  const enhanceViewPreference = () => {
    const gridButton = $(config.gridButton);
    const tableButton = $(config.tableButton);
    if (!gridButton || !tableButton) return;

    [gridButton, tableButton].forEach((button) => {
      button.type = "button";
      button.addEventListener("click", () => storage.write(viewStorageKey, button.dataset.view));
    });

    const saved = storage.read(viewStorageKey);
    const preferred = saved || (window.matchMedia("(max-width: 720px)").matches ? "grid" : "table");
    window.setTimeout(() => activateView(preferred, Boolean(saved)), 0);
  };

  const syncSelectionState = () => {
    $$(".suite-row, .article-row").forEach((row) => {
      const checked = $("input[type='checkbox']", row)?.checked || false;
      row.dataset.selected = String(checked);
    });
    $$(".suite-card, .article-grid-card").forEach((card) => {
      const checked = $("input[type='checkbox']", card)?.checked || false;
      card.dataset.selected = String(checked);
    });
  };

  const enhanceSelection = () => {
    document.addEventListener("change", (event) => {
      if (!event.target.matches("input[type='checkbox']")) return;
      window.requestAnimationFrame(syncSelectionState);
    });

    const target = page === "articles" ? $("#article-list") : $("#suite-body");
    if (target) {
      new MutationObserver(() => window.requestAnimationFrame(syncSelectionState)).observe(target, { childList: true, subtree: true });
    }
    syncSelectionState();
  };

  const enhanceActionButtons = () => {
    const decorate = () => {
      $$("[data-menu], [data-row-menu], [data-grid-menu]").forEach((button) => {
        button.type = "button";
        button.setAttribute("aria-haspopup", "menu");
        if (!button.hasAttribute("aria-expanded")) button.setAttribute("aria-expanded", "false");
        button.title = "Buka menu aksi";
      });
    };
    decorate();
    const target = page === "articles" ? $("#article-list") : $("#suite-body");
    if (target) new MutationObserver(decorate).observe(target, { childList: true, subtree: true });
  };

  const snapshotForm = () => {
    if (!form) return "";
    const values = [];
    new FormData(form).forEach((value, key) => values.push([key, String(value)]));
    $$('input:not([name]), select:not([name]), textarea:not([name])', form).forEach((control) => values.push([control.id, control.value]));
    return JSON.stringify(values);
  };

  const markDirty = () => {
    if (!drawer || !form) return;
    drawer.dataset.dirty = String(snapshotForm() !== formInitialSnapshot);
  };

  const updateFormValidity = () => {
    if (!form) return;
    const submit = $("button[type='submit']", form);
    if (submit) submit.disabled = !form.checkValidity();

    $$('input, select, textarea', form).forEach((control) => {
      const invalid = control.matches(":invalid") && (control.value || control.dataset.touched === "true");
      control.setAttribute("aria-invalid", String(invalid));
      const existing = control.parentElement?.querySelector(".crud-field-error");
      if (invalid && !existing) {
        const error = document.createElement("small");
        error.className = "crud-field-error";
        error.textContent = control.validity.valueMissing ? "Field ini wajib diisi." : control.validity.typeMismatch ? "Format data belum valid." : "Nilai yang dimasukkan belum valid.";
        control.insertAdjacentElement("afterend", error);
      } else if (!invalid) {
        existing?.remove();
      }
    });
  };

  const createImagePreview = () => {
    if (!form || !config.imageInput) return;
    const input = $(config.imageInput, form);
    if (!input || input.dataset.previewReady === "true") return;
    input.dataset.previewReady = "true";

    const preview = document.createElement("div");
    preview.className = "crud-image-preview";
    preview.innerHTML = `<img alt="Preview gambar" loading="lazy"><div><strong>Preview media</strong><small data-preview-url>URL gambar belum tersedia</small></div>`;
    input.closest("label")?.insertAdjacentElement("afterend", preview);

    const image = $("img", preview);
    const urlLabel = $("[data-preview-url]", preview);
    const update = () => {
      const value = input.value.trim();
      preview.dataset.state = value ? "loading" : "empty";
      image.src = value || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='160' viewBox='0 0 240 160'%3E%3Crect width='240' height='160' fill='%23111722'/%3E%3Cpath d='M70 110l32-36 25 27 18-18 28 27' fill='none' stroke='%2300e5ff' stroke-width='4'/%3E%3Ccircle cx='155' cy='54' r='10' fill='%2300e5ff' opacity='.5'/%3E%3C/svg%3E";
      urlLabel.textContent = value || "URL gambar belum tersedia";
    };
    image.addEventListener("load", () => preview.dataset.state = "ready");
    image.addEventListener("error", () => preview.dataset.state = "error");
    input.addEventListener("input", update);
    update();
  };

  const decorateForm = () => {
    if (!drawer || !form) return;
    drawer.setAttribute("role", "dialog");
    drawer.setAttribute("aria-modal", "true");

    const panelElement = $(".suite-drawer-panel, .editor-drawer__panel", drawer);
    const header = $(".suite-drawer-header, .editor-drawer__panel > header", drawer);
    if (panelElement && !$(".crud-form-context", panelElement)) {
      const context = document.createElement("div");
      context.className = "crud-form-context";
      context.innerHTML = `<div><span>Form workspace</span><strong>Lengkapi informasi utama</strong><small>Periksa kembali data sebelum menyimpan perubahan.</small></div><span class="crud-dirty-indicator">Tersimpan</span>`;
      header?.insertAdjacentElement("afterend", context);
    }

    $$('input[type="number"]', form).forEach((input) => input.min = "0");
    $$('input, select, textarea', form).forEach((control) => {
      control.addEventListener("input", () => {
        markDirty();
        updateFormValidity();
      });
      control.addEventListener("change", () => {
        markDirty();
        updateFormValidity();
      });
      control.addEventListener("blur", () => {
        control.dataset.touched = "true";
        updateFormValidity();
      });
    });

    createImagePreview();
    formInitialSnapshot = snapshotForm();
    drawer.dataset.dirty = "false";
    updateFormValidity();
  };

  const observeDrawer = () => {
    if (!drawer || !form) return;
    const formFields = $("#suite-form-fields", form);
    if (formFields) {
      new MutationObserver(() => window.requestAnimationFrame(decorateForm)).observe(formFields, { childList: true, subtree: true });
    }

    const drawerObserver = new MutationObserver(() => {
      const isOpen = drawer.classList.contains("is-open");
      if (!isOpen) return;
      window.requestAnimationFrame(() => {
        decorateForm();
        formInitialSnapshot = snapshotForm();
        drawer.dataset.dirty = "false";
      });
    });
    drawerObserver.observe(drawer, { attributes: true, attributeFilter: ["class", "aria-hidden"] });

    form.addEventListener("submit", (event) => {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopImmediatePropagation();
        updateFormValidity();
        $(":invalid", form)?.focus();
        announce("Form belum lengkap. Periksa field yang ditandai.");
        return;
      }
      drawer.dataset.dirty = "false";
      formInitialSnapshot = snapshotForm();
    }, true);

    decorateForm();
  };

  const enhanceModals = () => {
    const modal = $(page === "articles" ? "#delete-modal" : "#suite-delete-modal");
    if (!modal) return;
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    const heading = $("h2", modal);
    if (heading) {
      if (!heading.id) heading.id = `${page}-delete-dialog-title`;
      modal.setAttribute("aria-labelledby", heading.id);
    }

    const observer = new MutationObserver(() => {
      if (modal.hidden) return;
      lastModalFocus = document.activeElement;
      const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal).filter((item) => !item.disabled);
      focusable[0]?.focus();
    });
    observer.observe(modal, { attributes: true, attributeFilter: ["hidden"] });

    modal.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const focusable = $$('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])', modal).filter((item) => !item.disabled);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const closeButtons = page === "articles" ? [$("#delete-cancel")] : [$("#suite-delete-cancel")];
    closeButtons.filter(Boolean).forEach((button) => button.addEventListener("click", () => lastModalFocus?.focus?.()));
  };

  const enhanceKeyboard = () => {
    document.addEventListener("keydown", (event) => {
      const editable = event.target instanceof HTMLInputElement
        || event.target instanceof HTMLTextAreaElement
        || event.target instanceof HTMLSelectElement
        || event.target?.isContentEditable;

      if (event.key === "/" && !editable) {
        event.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      }

      if (event.key.toLowerCase() === "n" && !editable && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const addButton = page === "articles" ? $("[data-open-editor='new']") : $("#suite-add");
        if (addButton) {
          event.preventDefault();
          addButton.click();
        }
      }
    });
  };

  const markPanel = () => {
    panel?.classList.add("crud-panel");
    body.classList.add("admin-crud-modern");
    body.dataset.adminPage = page;
  };

  const init = () => {
    markPanel();
    createLiveRegion();
    createPanelHeading();
    observeCount();
    enhanceSearch();
    createActiveFilters();
    enhanceMetricCards();
    enhanceViewPreference();
    enhanceSelection();
    enhanceActionButtons();
    observeDrawer();
    enhanceModals();
    enhanceKeyboard();
    syncRecordCount();
  };

  window.NexAdminCrudModern = Object.freeze({ resetFilters, activateView, updateActiveFilters });
  init();
})();