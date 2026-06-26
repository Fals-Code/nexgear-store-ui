(() => {
  "use strict";

  if (window.NexAdminFullscreenWorkspace) return;

  const body = document.body;
  const page = body?.dataset.adminPage || (body?.classList.contains("page-admin-articles") ? "articles" : "");
  const supported = new Set(["articles", "products", "users", "transactions"]);
  if (!body?.classList.contains("page-admin") || !supported.has(page)) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const storageKey = `nexgear-admin-workspace-layout-${page}`;
  let drawer = null;
  let resizeTimer = 0;
  let active = false;
  let lastDirty = null;

  const emit = (name, detail = {}) => {
    window.dispatchEvent(new CustomEvent(`nexgear:${name}`, {
      detail: { page, drawer, ...detail },
    }));
  };

  const readPreference = () => {
    try {
      const value = JSON.parse(localStorage.getItem(storageKey));
      return value && typeof value === "object" ? value : {};
    } catch {
      return {};
    }
  };

  const writePreference = (value) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Layout tetap berfungsi saat storage browser diblokir.
    }
  };

  const isOpen = () => drawer?.classList.contains("is-open") || drawer?.getAttribute("aria-hidden") === "false";
  const hasSummary = () => Boolean($(".form-workspace__aside", drawer));
  const hasNavigation = () => Boolean($(".form-workspace__nav", drawer));

  const setButtonLabel = (button, text) => {
    const label = $("span", button);
    if (label && label.textContent !== text) label.textContent = text;
  };

  const setSummary = (value, persist = true) => {
    if (!drawer || !hasSummary()) return;
    const next = value === "collapsed" ? "collapsed" : "visible";
    const changed = drawer.dataset.summary !== next;
    drawer.dataset.summary = next;
    const button = $("[data-workspace-summary-toggle]", drawer);
    if (button) {
      const collapsed = next === "collapsed";
      const actionLabel = collapsed ? "Tampilkan panel ringkasan" : "Sembunyikan panel ringkasan";
      button.setAttribute("aria-pressed", String(collapsed));
      button.setAttribute("aria-label", actionLabel);
      button.title = actionLabel;
      setButtonLabel(button, "Ringkasan");
    }
    if (persist) writePreference({ ...readPreference(), summary: next });
    if (changed && active) emit("workspace-layoutchange", { property: "summary", value: next });
  };

  const setNavigation = (value, persist = true) => {
    if (!drawer || !hasNavigation()) return;
    const next = value === "compact" ? "compact" : "expanded";
    const changed = drawer.dataset.nav !== next;
    drawer.dataset.nav = next;
    const button = $("[data-workspace-nav-toggle]", drawer);
    if (button) {
      const compact = next === "compact";
      const actionLabel = compact ? "Perluas navigasi form" : "Ringkas navigasi form";
      button.setAttribute("aria-pressed", String(compact));
      button.setAttribute("aria-label", actionLabel);
      button.title = actionLabel;
      setButtonLabel(button, "Navigasi");
    }
    if (persist) writePreference({ ...readPreference(), nav: next });
    if (changed && active) emit("workspace-layoutchange", { property: "navigation", value: next });
  };

  const defaultLayout = () => {
    const saved = readPreference();
    const width = window.innerWidth;
    return {
      summary: saved.summary || (width < 1180 ? "collapsed" : "visible"),
      nav: saved.nav || (width < 1360 && width > 820 ? "compact" : "expanded"),
    };
  };

  const createHeaderButton = ({ attribute, icon, label, ariaLabel }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "workspace-header-button";
    button.setAttribute(attribute, "true");
    button.setAttribute("aria-label", ariaLabel);
    button.title = ariaLabel;
    button.innerHTML = `<i aria-hidden="true">${icon}</i><span>${label}</span>`;
    return button;
  };

  const enhanceHeader = () => {
    if (!drawer) return;
    const header = $(".suite-drawer-header, .editor-drawer__panel > header", drawer);
    if (!header) return;

    const title = header.firstElementChild;
    if (title instanceof HTMLElement) title.classList.add("workspace-header-title");

    const close = $("[data-close-drawer], [data-close-editor]", header);
    close?.classList.add("workspace-header-close");

    if ($(".workspace-header-controls", header)) return;

    const controls = document.createElement("div");
    controls.className = "workspace-header-controls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Kontrol tampilan form");

    if (hasNavigation()) {
      const navButton = createHeaderButton({
        attribute: "data-workspace-nav-toggle",
        icon: "☷",
        label: "Navigasi",
        ariaLabel: "Ringkas navigasi form",
      });
      navButton.addEventListener("click", () => setNavigation(drawer.dataset.nav === "compact" ? "expanded" : "compact"));
      controls.append(navButton);
    }

    if (hasSummary()) {
      const summaryButton = createHeaderButton({
        attribute: "data-workspace-summary-toggle",
        icon: "◫",
        label: "Ringkasan",
        ariaLabel: "Sembunyikan panel ringkasan",
      });
      summaryButton.addEventListener("click", () => setSummary(drawer.dataset.summary === "collapsed" ? "visible" : "collapsed"));
      controls.append(summaryButton);
    }

    if (close) controls.append(close);
    header.append(controls);
  };

  const syncModeLabel = () => {
    if (!drawer) return;
    const workspace = $(".form-workspace", drawer);
    const header = $(".suite-drawer-header, .editor-drawer__panel > header", drawer);
    if (!workspace || !header) return;
    const mode = workspace.dataset.formMode || drawer.dataset.formMode || "edit";
    const text = mode === "create" || mode === "new" ? "Create mode" : "Edit mode";
    drawer.dataset.workspaceMode = mode;
    const badge = $(".form-mode-badge", header);
    if (badge && badge.textContent !== text) badge.textContent = text;
  };

  const bindFormLifecycle = () => {
    if (!drawer) return;
    const form = $("form", drawer);
    if (!form || form.dataset.workspaceLifecycleBound === "true") return;
    form.dataset.workspaceLifecycleBound = "true";

    form.addEventListener("invalid", (event) => {
      const field = event.target;
      emit("workspace-validated", {
        valid: false,
        field: field?.name || field?.id || "unknown",
      });
    }, true);

    form.addEventListener("submit", () => {
      emit("workspace-validated", { valid: true });
      emit("entity-save-requested", {
        mode: drawer.dataset.workspaceMode || "edit",
      });
    }, true);
  };

  const syncDirtyState = () => {
    if (!drawer || !active) return;
    const dirty = drawer.dataset.dirty === "true";
    if (lastDirty === dirty) return;
    lastDirty = dirty;
    emit("workspace-dirty", { dirty });
  };

  const activate = () => {
    if (!drawer) return;
    body.classList.add("admin-workspace-fullscreen", "admin-workspace-active");
    drawer.dataset.workspaceDisplay = "full";
    enhanceHeader();
    syncModeLabel();
    bindFormLifecycle();
    const layout = defaultLayout();
    setSummary(layout.summary, false);
    setNavigation(layout.nav, false);

    if (!active) {
      active = true;
      lastDirty = null;
      emit("workspace-opened", {
        mode: drawer.dataset.workspaceMode || "edit",
        navigation: drawer.dataset.nav || "expanded",
        summary: drawer.dataset.summary || "visible",
      });
    }
    syncDirtyState();
  };

  const deactivate = () => {
    body.classList.remove("admin-workspace-active");
    if (!active) return;
    active = false;
    emit("workspace-closed", { dirty: lastDirty === true });
    lastDirty = null;
  };

  const syncDrawer = () => (isOpen() ? activate() : deactivate());

  const observeDrawer = () => {
    drawer = $(page === "articles" ? "#editor-drawer" : "#suite-drawer");
    if (!drawer) return;

    new MutationObserver((mutations) => {
      const dirtyChanged = mutations.some((mutation) => mutation.attributeName === "data-dirty");
      if (dirtyChanged) syncDirtyState();
      if (mutations.some((mutation) => mutation.attributeName !== "data-dirty")) syncDrawer();
    }).observe(drawer, {
      attributes: true,
      attributeFilter: ["class", "aria-hidden", "data-form-mode", "data-dirty"],
    });

    syncDrawer();
  };

  const bindKeyboard = () => {
    document.addEventListener("keydown", (event) => {
      if (!isOpen() || !(event.ctrlKey || event.metaKey) || !event.shiftKey) return;
      if (event.key.toLowerCase() === "p" && hasSummary()) {
        event.preventDefault();
        setSummary(drawer.dataset.summary === "collapsed" ? "visible" : "collapsed");
      }
      if (event.key.toLowerCase() === "n" && hasNavigation()) {
        event.preventDefault();
        setNavigation(drawer.dataset.nav === "compact" ? "expanded" : "compact");
      }
    });
  };

  const bindResize = () => {
    window.addEventListener("resize", () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        if (!isOpen() || window.innerWidth > 820) return;
        setNavigation("expanded", false);
        setSummary("collapsed", false);
      }, 120);
    }, { passive: true });
  };

  const init = () => {
    body.classList.add("admin-workspace-fullscreen");
    observeDrawer();
    bindKeyboard();
    bindResize();
  };

  window.NexAdminFullscreenWorkspace = Object.freeze({
    setSummary,
    setNavigation,
    refresh: syncDrawer,
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
