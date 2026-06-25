(function () {
  "use strict";

  const body = document.body;
  const tableBody = document.getElementById("article-list");
  if (!tableBody) return;

  const tableWrap = document.getElementById("article-table-wrap");
  const gridView = document.getElementById("article-grid-view");
  const emptyState = document.getElementById("article-empty");
  const visibleCount = document.getElementById("article-visible-count");
  const searchInput = document.getElementById("article-search-input");
  const globalSearch = document.getElementById("admin-global-search-input");
  const statusFilter = document.getElementById("article-status-filter");
  const categoryFilter = document.getElementById("article-category-filter");
  const sortSelect = document.getElementById("article-sort");
  const selectAll = document.getElementById("select-all-articles");
  const viewButtons = Array.from(document.querySelectorAll("[data-view]"));
  const rowMenu = document.getElementById("article-row-menu");
  const bulkBar = document.getElementById("bulk-action");
  const bulkCount = document.getElementById("bulk-count");
  const bulkClose = document.getElementById("bulk-close");
  const editor = document.getElementById("editor-drawer");
  const editorForm = editor.querySelector("form");
  const editorHeading = document.getElementById("editor-title");
  const titleInput = document.getElementById("editor-title-input");
  const slugInput = document.getElementById("editor-slug-input");
  const categoryInput = document.getElementById("editor-category-input");
  const statusInput = document.getElementById("editor-status-input");
  const excerptInput = document.getElementById("editor-excerpt-input");
  const imageInput = document.getElementById("editor-image-input");
  const deleteModal = document.getElementById("delete-modal");
  const deleteMessage = document.getElementById("delete-message");
  const deleteCancel = document.getElementById("delete-cancel");
  const deleteConfirm = document.getElementById("delete-confirm");
  const toast = document.getElementById("admin-toast");
  const menuToggle = document.querySelector(".admin-menu-toggle");
  const storageKey = "nexgear-admin-articles-v1";

  const statusMap = {
    published: { label: "Terbit", className: "status-published" },
    draft: { label: "Draft", className: "status-draft" },
    scheduled: { label: "Terjadwal", className: "status-scheduled" },
    review: { label: "Review", className: "status-review" },
    archived: { label: "Arsip", className: "status-archived" },
  };

  let activeRow = null;
  let editingRow = null;
  let pendingDeleteRows = [];
  let currentView = "table";
  let toastTimer = null;

  function rows() {
    return Array.from(tableBody.querySelectorAll(".article-row"));
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function slugify(value) {
    return `/${normalize(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")}`;
  }

  function todayIso() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(value) {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(`${value}T12:00:00`));
  }

  function formatViews(value) {
    return new Intl.NumberFormat("id-ID").format(Number(value) || 0);
  }

  function statusKeyFromLabel(label) {
    const normalized = normalize(label);
    if (normalized === "terbit") return "published";
    if (normalized === "terjadwal") return "scheduled";
    if (normalized === "review") return "review";
    if (normalized === "arsip") return "archived";
    return "draft";
  }

  function showToast(message) {
    window.clearTimeout(toastTimer);
    toast.textContent = message;
    toast.hidden = false;
    toastTimer = window.setTimeout(() => {
      toast.hidden = true;
    }, 2800);
  }

  function createRow(article) {
    const tr = document.createElement("tr");
    const status = statusMap[article.status] || statusMap.draft;
    tr.className = "article-row";
    tr.dataset.id = article.id || `article-${Date.now()}`;
    tr.dataset.status = article.status || "draft";
    tr.dataset.category = article.category || "Hardware";
    tr.dataset.title = normalize(article.title);
    tr.dataset.author = article.author || "Admin NEXGEAR";
    tr.dataset.views = String(article.views || 0);
    tr.dataset.updated = article.updated || todayIso();
    tr.dataset.excerpt = article.excerpt || "";
    tr.dataset.image = article.image || "";
    tr.innerHTML = `
      <td><input type="checkbox" class="article-check" aria-label="Pilih artikel ${article.title}"></td>
      <td>
        <div class="article-title-cell">
          <img src="${article.image}" alt="${article.title}">
          <div><h2>${article.title}</h2><p>${article.slug} · ${article.reading || 6} menit baca</p></div>
        </div>
      </td>
      <td><span class="article-category-pill">${article.category}</span></td>
      <td><span class="status-pill ${status.className}"><i></i>${status.label}</span></td>
      <td><time datetime="${article.updated}">${formatDate(article.updated)}</time></td>
      <td>${formatViews(article.views)}</td>
      <td><button class="row-action" type="button" data-row-menu aria-label="Aksi artikel ${article.title}">•••</button></td>`;
    return tr;
  }

  function serializeRows() {
    return rows().map((row) => {
      const title = row.querySelector("h2")?.textContent.trim() || "Artikel";
      const meta = row.querySelector(".article-title-cell p")?.textContent || "/artikel · 6 menit baca";
      const readingMatch = meta.match(/(\d+)\s+menit/);
      return {
        id: row.dataset.id || `article-${title.length}-${row.dataset.updated}`,
        title,
        slug: meta.split("·")[0].trim(),
        reading: readingMatch ? Number(readingMatch[1]) : 6,
        category: row.dataset.category,
        status: row.dataset.status,
        author: row.dataset.author,
        views: Number(row.dataset.views),
        updated: row.dataset.updated,
        excerpt: row.dataset.excerpt || "",
        image: row.dataset.image || row.querySelector("img")?.src || "",
      };
    });
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(serializeRows()));
    } catch (error) {
      console.warn("NEXGEAR admin state could not be saved", error);
    }
  }

  function restoreState() {
    let saved;
    try {
      saved = JSON.parse(localStorage.getItem(storageKey));
    } catch (error) {
      saved = null;
    }
    if (!Array.isArray(saved) || !saved.length) {
      rows().forEach((row, index) => {
        row.dataset.id = `seed-${index + 1}`;
        row.dataset.image = row.querySelector("img")?.src || "";
      });
      return;
    }
    tableBody.innerHTML = "";
    saved.forEach((article) => tableBody.appendChild(createRow(article)));
  }

  function matches(row) {
    const query = normalize(searchInput.value);
    const haystack = `${row.dataset.title} ${row.dataset.category} ${row.dataset.author}`;
    const searchMatch = !query || normalize(haystack).includes(query);
    const statusMatch = statusFilter.value === "all" || row.dataset.status === statusFilter.value;
    const categoryMatch = categoryFilter.value === "all" || row.dataset.category === categoryFilter.value;
    return searchMatch && statusMatch && categoryMatch;
  }

  function sortRows() {
    const mode = sortSelect.value;
    const sorted = [...rows()].sort((a, b) => {
      if (mode === "views") return Number(b.dataset.views) - Number(a.dataset.views);
      if (mode === "title") return a.dataset.title.localeCompare(b.dataset.title, "id");
      return new Date(b.dataset.updated) - new Date(a.dataset.updated);
    });
    sorted.forEach((row) => tableBody.appendChild(row));
  }

  function renderGrid(visibleRows) {
    gridView.innerHTML = "";
    visibleRows.forEach((row) => {
      const card = document.createElement("article");
      const status = statusMap[row.dataset.status] || statusMap.draft;
      const title = row.querySelector("h2").textContent;
      const image = row.querySelector("img").src;
      const selected = row.querySelector(".article-check").checked;
      card.className = "article-grid-card";
      card.dataset.rowId = row.dataset.id;
      card.innerHTML = `
        <div class="article-grid-card__media">
          <input type="checkbox" class="article-grid-card__check" ${selected ? "checked" : ""} aria-label="Pilih ${title}">
          <img src="${image}" alt="${title}">
        </div>
        <div class="article-grid-card__body">
          <div class="article-grid-card__meta">
            <span class="article-category-pill">${row.dataset.category}</span>
            <span class="status-pill ${status.className}"><i></i>${status.label}</span>
          </div>
          <h2>${title}</h2>
          <p>${row.querySelector(".article-title-cell p").textContent}</p>
          <div class="article-grid-card__footer">
            <span>${formatViews(row.dataset.views)} views</span>
            <button class="row-action" type="button" data-grid-menu aria-label="Aksi ${title}">•••</button>
          </div>
        </div>`;
      gridView.appendChild(card);
    });
  }

  function updateBulkBar() {
    const selected = rows().filter((row) => row.querySelector(".article-check").checked);
    bulkCount.textContent = String(selected.length);
    bulkBar.hidden = selected.length === 0;
    const visible = rows().filter((row) => !row.hidden);
    selectAll.checked = visible.length > 0 && visible.every((row) => row.querySelector(".article-check").checked);
    selectAll.indeterminate = visible.some((row) => row.querySelector(".article-check").checked) && !selectAll.checked;
    if (currentView === "grid") renderGrid(visible);
  }

  function render() {
    sortRows();
    const visibleRows = rows().filter(matches);
    rows().forEach((row) => {
      row.hidden = !visibleRows.includes(row);
    });
    visibleCount.textContent = String(visibleRows.length);
    emptyState.hidden = visibleRows.length !== 0;
    tableWrap.hidden = currentView !== "table" || visibleRows.length === 0;
    gridView.hidden = currentView !== "grid" || visibleRows.length === 0;
    renderGrid(visibleRows);
    updateBulkBar();
  }

  function closeRowMenu() {
    rowMenu.hidden = true;
    document.querySelectorAll("[data-row-menu], [data-grid-menu]").forEach((button) => button.setAttribute("aria-expanded", "false"));
    activeRow = null;
  }

  function openRowMenu(button, row) {
    activeRow = row;
    const rect = button.getBoundingClientRect();
    rowMenu.hidden = false;
    rowMenu.style.top = `${Math.min(rect.bottom + 7, window.innerHeight - rowMenu.offsetHeight - 12)}px`;
    rowMenu.style.left = `${Math.max(12, Math.min(rect.right - rowMenu.offsetWidth, window.innerWidth - rowMenu.offsetWidth - 12))}px`;
    button.setAttribute("aria-expanded", "true");
  }

  function openEditor(row, mode) {
    editingRow = mode === "new" ? null : row;
    editorHeading.textContent = mode === "new" ? "Artikel Baru" : "Edit Artikel";
    if (mode === "new") {
      editorForm.reset();
      titleInput.value = "";
      slugInput.value = "";
      categoryInput.value = "Hardware";
      statusInput.value = "Draft";
      excerptInput.value = "";
      imageInput.value = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=85";
    } else {
      const meta = row.querySelector(".article-title-cell p").textContent;
      titleInput.value = row.querySelector("h2").textContent;
      slugInput.value = meta.split("·")[0].trim();
      categoryInput.value = row.dataset.category;
      statusInput.value = statusMap[row.dataset.status]?.label || "Draft";
      excerptInput.value = row.dataset.excerpt || "Panduan editorial NEXGEAR untuk membantu pembaca memilih dan menggunakan gear dengan lebih tepat.";
      imageInput.value = row.dataset.image || row.querySelector("img").src;
    }
    editor.classList.add("is-open");
    editor.setAttribute("aria-hidden", "false");
    body.style.overflow = "hidden";
    window.setTimeout(() => titleInput.focus(), 250);
  }

  function closeEditor() {
    editor.classList.remove("is-open");
    editor.setAttribute("aria-hidden", "true");
    body.style.overflow = "";
    editingRow = null;
  }

  function setRowStatus(row, statusKey) {
    const status = statusMap[statusKey] || statusMap.draft;
    row.dataset.status = statusKey;
    const pill = row.querySelector(".status-pill");
    pill.className = `status-pill ${status.className}`;
    pill.innerHTML = `<i></i>${status.label}`;
  }

  function applyEditor(statusOverride) {
    const title = titleInput.value.trim();
    if (!title) {
      titleInput.focus();
      return false;
    }
    const statusKey = statusOverride || statusKeyFromLabel(statusInput.value);
    const article = {
      id: editingRow?.dataset.id || `article-${Date.now()}`,
      title,
      slug: slugInput.value.trim() || slugify(title),
      reading: 6,
      category: categoryInput.value,
      status: statusKey,
      author: editingRow?.dataset.author || "Admin NEXGEAR",
      views: editingRow ? Number(editingRow.dataset.views) : 0,
      updated: todayIso(),
      excerpt: excerptInput.value.trim(),
      image: imageInput.value.trim() || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=85",
    };
    if (editingRow) editingRow.replaceWith(createRow(article));
    else tableBody.prepend(createRow(article));
    saveState();
    closeEditor();
    render();
    showToast(editingRow ? "Artikel berhasil diperbarui." : "Artikel baru berhasil dibuat.");
    return true;
  }

  function askDelete(targetRows, label) {
    pendingDeleteRows = targetRows;
    deleteMessage.textContent = `${label} akan dihapus dari daftar editorial. Tindakan ini dapat disimulasikan kembali dengan reset penyimpanan browser.`;
    deleteModal.hidden = false;
    body.style.overflow = "hidden";
    deleteCancel.focus();
  }

  function closeDeleteModal() {
    deleteModal.hidden = true;
    pendingDeleteRows = [];
    body.style.overflow = "";
  }

  searchInput.addEventListener("input", render);
  statusFilter.addEventListener("change", render);
  categoryFilter.addEventListener("change", render);
  sortSelect.addEventListener("change", render);

  globalSearch.addEventListener("input", () => {
    searchInput.value = globalSearch.value;
    render();
  });

  document.getElementById("article-reset-filter").addEventListener("click", () => {
    searchInput.value = "";
    globalSearch.value = "";
    statusFilter.value = "all";
    categoryFilter.value = "all";
    sortSelect.value = "updated";
    render();
    searchInput.focus();
  });

  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentView = button.dataset.view;
      viewButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      render();
    });
  });

  selectAll.addEventListener("change", () => {
    rows().filter((row) => !row.hidden).forEach((row) => {
      row.querySelector(".article-check").checked = selectAll.checked;
    });
    updateBulkBar();
  });

  tableBody.addEventListener("change", (event) => {
    if (event.target.matches(".article-check")) updateBulkBar();
  });

  tableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-row-menu]");
    if (!button) return;
    const row = button.closest(".article-row");
    if (!rowMenu.hidden && activeRow === row) closeRowMenu();
    else {
      closeRowMenu();
      openRowMenu(button, row);
    }
  });

  gridView.addEventListener("change", (event) => {
    const check = event.target.closest(".article-grid-card__check");
    if (!check) return;
    const card = check.closest(".article-grid-card");
    const row = rows().find((item) => item.dataset.id === card.dataset.rowId);
    if (row) row.querySelector(".article-check").checked = check.checked;
    updateBulkBar();
  });

  gridView.addEventListener("click", (event) => {
    const button = event.target.closest("[data-grid-menu]");
    if (!button) return;
    const card = button.closest(".article-grid-card");
    const row = rows().find((item) => item.dataset.id === card.dataset.rowId);
    if (row) {
      closeRowMenu();
      openRowMenu(button, row);
    }
  });

  rowMenu.addEventListener("click", (event) => {
    const button = event.target.closest("[data-menu-action]");
    if (!button || !activeRow) return;
    const row = activeRow;
    const action = button.dataset.menuAction;
    const title = row.querySelector("h2").textContent;
    closeRowMenu();
    if (action === "view") window.location.href = "blog-post.html";
    if (action === "edit") openEditor(row, "edit");
    if (action === "duplicate") {
      const article = serializeRows().find((item) => item.id === row.dataset.id);
      article.id = `article-${Date.now()}`;
      article.title = `${article.title} (Salinan)`;
      article.slug = `${article.slug}-salinan`;
      article.status = "draft";
      article.views = 0;
      article.updated = todayIso();
      tableBody.prepend(createRow(article));
      saveState();
      render();
      showToast("Artikel berhasil diduplikasi sebagai draft.");
    }
    if (action === "schedule") {
      setRowStatus(row, "scheduled");
      row.dataset.updated = todayIso();
      saveState();
      render();
      showToast("Artikel dijadwalkan untuk publikasi.");
    }
    if (action === "archive") {
      setRowStatus(row, "archived");
      saveState();
      render();
      showToast("Artikel dipindahkan ke arsip.");
    }
    if (action === "delete") askDelete([row], `“${title}”`);
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#article-row-menu") && !event.target.closest("[data-row-menu]") && !event.target.closest("[data-grid-menu]")) closeRowMenu();
  });

  document.querySelector("[data-open-editor='new']").addEventListener("click", () => openEditor(null, "new"));
  editor.querySelectorAll("[data-close-editor]").forEach((button) => button.addEventListener("click", closeEditor));

  titleInput.addEventListener("input", () => {
    if (!editingRow || !slugInput.value.trim()) slugInput.value = slugify(titleInput.value);
  });

  editorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    applyEditor();
  });

  editor.querySelector("[data-save-draft]").addEventListener("click", () => applyEditor("draft"));

  bulkClose.addEventListener("click", () => {
    rows().forEach((row) => row.querySelector(".article-check").checked = false);
    updateBulkBar();
  });

  bulkBar.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bulk-action]");
    if (!button) return;
    const selectedRows = rows().filter((row) => row.querySelector(".article-check").checked);
    if (!selectedRows.length) return;
    if (button.dataset.bulkAction === "delete") {
      askDelete(selectedRows, `${selectedRows.length} artikel terpilih`);
      return;
    }
    const status = button.dataset.bulkAction === "publish" ? "published" : "archived";
    selectedRows.forEach((row) => {
      setRowStatus(row, status);
      row.querySelector(".article-check").checked = false;
    });
    saveState();
    render();
    showToast(`${selectedRows.length} artikel berhasil diperbarui.`);
  });

  deleteCancel.addEventListener("click", closeDeleteModal);
  deleteModal.addEventListener("click", (event) => {
    if (event.target === deleteModal) closeDeleteModal();
  });
  deleteConfirm.addEventListener("click", () => {
    const count = pendingDeleteRows.length;
    pendingDeleteRows.forEach((row) => row.remove());
    saveState();
    closeDeleteModal();
    render();
    showToast(`${count} artikel berhasil dihapus.`);
  });

  menuToggle.addEventListener("click", () => {
    const open = !body.classList.contains("admin-menu-open");
    body.classList.toggle("admin-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  document.querySelectorAll(".admin-nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 900) {
        body.classList.remove("admin-menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeRowMenu();
    if (editor.classList.contains("is-open")) closeEditor();
    if (!deleteModal.hidden) closeDeleteModal();
    body.classList.remove("admin-menu-open");
  });

  restoreState();
  render();
})();
