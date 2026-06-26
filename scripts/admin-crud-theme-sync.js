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

  const loadArticlePersistence = () => {
    if (page !== "articles" || window.NexArticleWorkspacePersistence || document.querySelector('script[data-article-workspace-persistence]')) return;
    const script = document.createElement("script");
    script.src = "scripts/admin-article-workspace-persistence.js?v=1";
    script.dataset.articleWorkspacePersistence = "true";
    document.body.append(script);
  };

  const loadEntityActions = () => {
    if (window.NexAdminEntityActions || document.querySelector('script[data-admin-entity-actions]')) return;
    const script = document.createElement("script");
    script.src = "scripts/admin-entity-actions.js?v=2";
    script.dataset.adminEntityActions = "true";
    document.body.append(script);
  };

  const loadFullscreenWorkspace = () => {
    if (window.NexAdminFullscreenWorkspace || document.querySelector('script[data-admin-fullscreen-workspace]')) return;
    const script = document.createElement("script");
    script.src = "scripts/admin-fullscreen-workspace.js?v=2";
    script.dataset.adminFullscreenWorkspace = "true";
    document.body.append(script);
  };

  const restoreAdminTheme = () => applyTheme(body.dataset.adminTheme || readTheme());

  applyTheme(readTheme());
  window.setTimeout(applyMobileArticleView, 80);
  loadArticlePersistence();
  loadEntityActions();
  loadFullscreenWorkspace();

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
    loadArticlePersistence();
    loadEntityActions();
    loadFullscreenWorkspace();
    window.setTimeout(applyMobileArticleView, 120);
  }, { once: true });

  window.addEventListener("load", () => {
    restoreAdminTheme();
    loadEntityActions();
    loadFullscreenWorkspace();
    window.setTimeout(applyMobileArticleView, 120);
  }, { once: true });

  document.addEventListener("nexgear:themechange", (event) => applyTheme(event.detail?.theme));

  window.NexAdminCrudThemeSync = Object.freeze({ applyTheme, loadEntityActions, loadFullscreenWorkspace });
})();
