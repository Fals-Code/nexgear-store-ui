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

  const setSummary = (value, persist = true) => {
    if (!drawer || !hasSummary()) return;
    const next = value === "collapsed" ? "collapsed" : "visible";
    drawer.dataset.summary = next;
    const button = $("[data-workspace-summary-toggle]", drawer);
    if (button) {
      const collapsed = next === "collapsed";
      button.setAttribute("aria-pressed", String(collapsed));
      button.setAttribute("aria-label", collapsed ? "Tampilkan panel ringkasan" : "Sembunyikan panel ringkasan");
      button.title = collapsed ? "Tampilkan ringkasan" : "Sembunyikan ringkasan";
      $("span", button).textContent = collapsed ? "Tampilkan ringkasan" : "Sembunyikan ringkasan";
    }
    if (persist) writePreference({ ...readPreference(), summary: next });
  };

  const setNavigation = (value, persist = true) => {
    if (!drawer || !hasNavigation()) return;
    const next = value === "compact" ? "compact" : "expanded";
    drawer.dataset.nav = next;
    const button = $("[data-workspace-nav-toggle]", drawer);
    if (button) {
      const compact = next === "compact";
      button.setAttribute("aria-pressed", String(compact));
      button.setAttribute("aria-label", compact ? "Perluas navigasi form" : "Ringkas navigasi form");
      button.title = compact ? "Perluas navigasi" : "Ringkas navigasi";
      $("span", button).textContent = compact ? "Perluas navigasi" : "Ringkas navigasi";
    }
    if (persist) writePreference({ ...readPreference(), nav: next });
  };

  const defaultLayout = () => {
    const saved = readPreference();
    const width = window.innerWidth;
    const summary = saved.summary || (width < 1180 ? "collapsed" : "visible");
    const nav = saved.nav || (width < 1360 && width > 820 ? "compact" : "expanded");
    return { summary, nav };
  };

  const createHeaderButton = ({ attribute, icon, label }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "workspace-header-button";
    button.setAttribute(attribute, "true");
    button.innerHTML = `<i aria-hidden="true">${icon}</i><span>${label}</span>`;
    return button;
  };

  const enhanceHeader = () => {
    if (!drawer) return;
    const header = $(".suite-drawer-header, .editor-drawer__panel > header", drawer);
    if (!header || $(".workspace-header-controls", header)) return;

    const close = $("[data-close-drawer], [data-close-editor]", header);
    const controls = document.createElement("div");
    controls.className = "workspace-header-controls";

    if (hasNavigation()) {
      const navButton = createHeaderButton({
        attribute: "data-workspace-nav-toggle",
        icon: "☷",
        label: "Ringkas navigasi",
      });
      navButton.addEventListener("click", () => setNavigation(drawer.dataset.nav === "compact" ? "expanded" : "compact"));
      controls.append(navButton);
    }

    if (hasSummary()) {
      const summaryButton = createHeaderButton({
        attribute: "data-workspace-summary-toggle",
        icon: "◫",
        label: "Sembunyikan ringkasan",
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
    drawer.dataset.workspaceMode = mode;
    const badge = $(".form-mode-badge", header);
    if (badge) badge.textContent = mode === "create" ? "Create workspace" : "Full edit workspace";
  };

  const activate = () => {
    if (!drawer) return;
    body.classList.add("admin-workspace-fullscreen", "admin-workspace-active");
    drawer.dataset.workspaceDisplay = "full";
    enhanceHeader();
    syncModeLabel();
    const layout = defaultLayout();
    setSummary(layout.summary, false);
    setNavigation(layout.nav, false);
  };

  const deactivate = () => {
    body.classList.remove("admin-workspace-active");
  };

  const syncDrawer = () => {
    if (isOpen()) activate();
    else deactivate();
  };

  const observeDrawer = () => {
    drawer = $(page === "articles" ? "#editor-drawer" : "#suite-drawer");
    if (!drawer) return;

    new MutationObserver(() => window.setTimeout(syncDrawer, 0)).observe(drawer, {
      attributes: true,
      attributeFilter: ["class", "aria-hidden", "data-form-mode"],
      childList: true,
      subtree: true,
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
        if (!isOpen()) return;
        if (window.innerWidth <= 820) {
          setNavigation("expanded", false);
          setSummary("collapsed", false);
        }
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
