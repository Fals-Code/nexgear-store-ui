(() => {
  "use strict";

  if (window.NexAdminCrudThemeSync) return;

  const body = document.body;
  const root = document.documentElement;
  const page = body?.dataset.adminPage || (body?.classList.contains("page-admin-articles") ? "articles" : "");
  if (!body?.classList.contains("page-admin") || !["articles", "products", "users", "transactions"].includes(page)) return;

  const readTheme = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("nexgear-admin-theme"));
      if (stored === "light" || stored === "dark") return stored;
    } catch {
      // Gunakan tema gelap saat storage browser tidak tersedia.
    }
    return body.dataset.adminTheme === "light" ? "light" : "dark";
  };

  const applyTheme = (theme) => {
    const next = theme === "light" ? "light" : "dark";
    if (body.dataset.adminTheme !== next) body.dataset.adminTheme = next;
    if (root.dataset.theme !== next) root.dataset.theme = next;
    if (root.style.colorScheme !== next) root.style.colorScheme = next;
  };

  const applyMobileArticleView = () => {
    if (page !== "articles" || !window.matchMedia("(max-width: 720px)").matches) return;
    const gridButton = document.querySelector(".article-view-toggle [data-view='grid']");
    if (!gridButton || gridButton.classList.contains("is-active")) return;
    gridButton.click();
  };

  const loadScript = ({ globalName, selector, src, dataName }) => {
    if (window[globalName] || document.querySelector(selector)) return;
    const script = document.createElement("script");
    script.src = src;
    script.dataset[dataName] = "true";
    document.body.append(script);
  };

  const loadArticlePersistence = () => {
    if (page !== "articles") return;
    loadScript({
      globalName: "NexArticleWorkspacePersistence",
      selector: 'script[data-article-workspace-persistence]',
      src: "scripts/admin-article-workspace-persistence.js?v=1",
      dataName: "articleWorkspacePersistence",
    });
  };

  const loadEntityActions = () => loadScript({
    globalName: "NexAdminEntityActions",
    selector: 'script[data-admin-entity-actions]',
    src: "scripts/admin-entity-actions.js?v=2",
    dataName: "adminEntityActions",
  });

  const loadFullscreenWorkspace = () => loadScript({
    globalName: "NexAdminFullscreenWorkspace",
    selector: 'script[data-admin-fullscreen-workspace]',
    src: "scripts/admin-fullscreen-workspace.js?v=4",
    dataName: "adminFullscreenWorkspace",
  });

  const loadWorkspaceRegression = () => loadScript({
    globalName: "NexAdminWorkspaceRegression",
    selector: 'script[data-admin-workspace-regression]',
    src: "scripts/admin-workspace-regression.js?v=1",
    dataName: "adminWorkspaceRegression",
  });

  const restoreAdminTheme = () => applyTheme(body.dataset.adminTheme || readTheme());
  const loadAdminEnhancements = () => {
    loadArticlePersistence();
    loadEntityActions();
    loadFullscreenWorkspace();
    loadWorkspaceRegression();
  };

  applyTheme(readTheme());
  window.setTimeout(applyMobileArticleView, 80);
  loadAdminEnhancements();

  new MutationObserver(() => {
    const current = body.dataset.adminTheme;
    if (current === "light" || current === "dark") applyTheme(current);
  }).observe(body, { attributes: true, attributeFilter: ["data-admin-theme"] });

  new MutationObserver(() => {
    const expected = body.dataset.adminTheme || readTheme();
    if (root.dataset.theme !== expected) applyTheme(expected);
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  document.addEventListener("input", (event) => {
    if (event.target.matches('input[name="id"], input[name="email"]')) event.target.setCustomValidity("");
  });

  document.addEventListener("DOMContentLoaded", () => {
    restoreAdminTheme();
    loadAdminEnhancements();
    window.setTimeout(applyMobileArticleView, 120);
  }, { once: true });

  window.addEventListener("load", () => {
    restoreAdminTheme();
    loadAdminEnhancements();
    window.setTimeout(applyMobileArticleView, 120);
  }, { once: true });

  document.addEventListener("nexgear:themechange", (event) => applyTheme(event.detail?.theme));

  window.NexAdminCrudThemeSync = Object.freeze({
    applyTheme,
    loadEntityActions,
    loadFullscreenWorkspace,
    loadWorkspaceRegression,
  });
})();
