(() => {
  "use strict";

  const editor = document.querySelector("#editor-drawer");
  const form = editor?.querySelector("form");
  if (!editor || !form || window.NexArticleWorkspacePersistence) return;

  const storageKey = "nexgear-admin-article-extras-v1";
  const extraFields = ["content", "imageAlt", "tags", "author", "scheduledAt", "visibility", "seoTitle", "metaDescription", "canonical", "featured"];
  let pendingSnapshot = null;

  const readStore = () => {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  };

  const writeStore = (value) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Editorial tetap berjalan ketika penyimpanan browser diblokir.
    }
  };

  const normalizeKey = (value) => String(value || "").trim().toLowerCase();

  const snapshot = () => {
    const values = {};
    extraFields.forEach((name) => {
      const control = form.elements[name];
      if (!control) return;
      values[name] = control.type === "checkbox" ? control.checked : control.value;
    });
    return {
      title: form.elements.title?.value.trim() || "",
      slug: form.elements.slug?.value.trim() || "",
      values,
    };
  };

  const applyToRow = (payload) => {
    if (!payload?.title) return;
    const row = Array.from(document.querySelectorAll(".article-row")).find((item) => {
      const title = item.querySelector("h2")?.textContent.trim();
      const slug = item.querySelector(".article-title-cell p")?.textContent.split("·")[0].trim();
      return title === payload.title || normalizeKey(slug) === normalizeKey(payload.slug);
    });
    if (!row) return;

    Object.entries(payload.values).forEach(([name, value]) => {
      row.dataset[name] = String(value);
    });

    const store = readStore();
    store[normalizeKey(payload.slug || payload.title)] = payload.values;
    writeStore(store);
  };

  const persistAfterBaseSave = () => {
    pendingSnapshot = snapshot();
    window.setTimeout(() => {
      applyToRow(pendingSnapshot);
      pendingSnapshot = null;
    }, 0);
  };

  const hydrate = () => {
    if (!editor.classList.contains("is-open")) return;
    window.setTimeout(() => {
      const slug = form.elements.slug?.value || "";
      const store = readStore();
      const values = store[normalizeKey(slug)];
      if (!values) return;
      extraFields.forEach((name) => {
        const control = form.elements[name];
        if (!control || !(name in values)) return;
        if (control.type === "checkbox") control.checked = Boolean(values[name]);
        else control.value = values[name];
        control.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }, 140);
  };

  form.addEventListener("submit", persistAfterBaseSave, true);
  editor.addEventListener("click", (event) => {
    if (event.target.closest("[data-workspace-draft], [data-save-draft]")) persistAfterBaseSave();
  }, true);

  new MutationObserver(hydrate).observe(editor, { attributes: true, attributeFilter: ["class", "aria-hidden"] });

  window.NexArticleWorkspacePersistence = Object.freeze({ hydrate, snapshot });
})();