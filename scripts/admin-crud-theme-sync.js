(() => {
  "use strict";

  if (window.NexAdminCrudThemeSync) return;

  const body = document.body;
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
    body.dataset.adminTheme = next;
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  };

  applyTheme(readTheme());

  new MutationObserver(() => {
    const current = body.dataset.adminTheme;
    if (current === "light" || current === "dark") applyTheme(current);
  }).observe(body, { attributes: true, attributeFilter: ["data-admin-theme"] });

  document.addEventListener("nexgear:themechange", (event) => applyTheme(event.detail?.theme));

  window.NexAdminCrudThemeSync = Object.freeze({ applyTheme });
})();