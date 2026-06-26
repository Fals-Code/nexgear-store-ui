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

  const restoreAdminTheme = () => applyTheme(body.dataset.adminTheme || readTheme());

  applyTheme(readTheme());
  window.setTimeout(applyMobileArticleView, 80);
  loadArticlePersistence();

  new MutationObserver(() => {
    const current = body.dataset.adminTheme;
    if (current === "light" || current === "dark") applyTheme(current);
  }).observe(body, { attributes: true, attributeFilter: ["data-admin-theme"] });

  new MutationObserver(() => {
    const expected = body.dataset.adminTheme || readTheme();
    if (root.dataset.theme !== expected) applyTheme(expected);
  }).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  document.addEventListener("DOMContentLoaded", () => {
    restoreAdminTheme();
    loadArticlePersistence();
    window.setTimeout(applyMobileArticleView, 120);
  }, { once: true });

  window.addEventListener("load", () => {
    restoreAdminTheme();
    window.setTimeout(applyMobileArticleView, 120);
  }, { once: true });

  document.addEventListener("nexgear:themechange", (event) => applyTheme(event.detail?.theme));

  window.NexAdminCrudThemeSync = Object.freeze({ applyTheme });
})();