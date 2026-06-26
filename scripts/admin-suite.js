(() => {
  "use strict";

  const ensureQualityLayer = () => {
    if (!document.querySelector("link[data-quality-hardening]")) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "styles/quality-hardening.css?v=1";
      css.dataset.qualityHardening = "true";
      document.head.append(css);
    }
    if (!window.NexA11y && !document.querySelector("script[data-quality-hardening]")) {
      const script = document.createElement("script");
      script.src = "scripts/quality-hardening.js?v=1";
      script.dataset.qualityHardening = "true";
      document.head.append(script);
    }
  };
  ensureQualityLayer();

  const modalCss = document.createElement("link");
  modalCss.rel = "stylesheet";
  modalCss.href = "styles/admin-suite-modal.css?v=1";
  document.head.append(modalCss);

  const page = document.body.dataset.adminPage || "";
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const renderer = window.NEXGEAR_ADMIN_RENDER;
  const seed = window.NEXGEAR_ADMIN_DATA;
  const storageKey = `nexgear-admin-${page}-v1`;

  let data = page === "dashboard" ? [] : load();
  let selected = new Set();
  let activeId = null;
  let deleteIds = [];
  let menuReturnFocus = null;
  let drawerReturnFocus = null;
  let deleteReturnFocus = null;
  let activeDialog = null;
  const dialogFocusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(",");

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch {}
    return JSON.parse(JSON.stringify(seed[page] || []));
  }

  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch {}
  }

  function currentItem() {
    return data.find((entry) => entry.id === activeId);
  }

  function toast(message) {
    const element = $("#suite-toast");
    if (!element) return;
    element.textContent = message;
    element.hidden = false;
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => { element.hidden = true; }, 2800);
    window.NexA11y?.announce?.(message);
  }

  function isVisible(element) {
    return element instanceof HTMLElement && element.getClientRects().length > 0;
  }

  function getDialogFocusable(dialog) {
    if (!dialog) return [];
    return $$(dialogFocusableSelector, dialog).filter(isVisible);
  }

  function restoreFocus(element) {
    const fallback = $("#suite-search") || $("#suite-add") || $(".admin-menu-toggle");
    const target = element instanceof HTMLElement && element.isConnected ? element : fallback;
    window.setTimeout(() => target?.focus(), 0);
  }

  function syncBodyLock() {
    const drawerOpen = $("#suite-drawer")?.classList.contains("is-open");
    const deleteOpen = $("#suite-delete-modal") && !$("#suite-delete-modal").hidden;
    document.body.style.overflow = drawerOpen || deleteOpen ? "hidden" : "";
  }

  function setDialogState(dialog, open) {
    if (!dialog) return;
    dialog.dataset.state = open ? "open" : "closed";
    dialog.setAttribute("aria-hidden", String(!open));
    activeDialog = open ? dialog : activeDialog === dialog ? null : activeDialog;
    syncBodyLock();
  }

  function focusDialog(dialog) {
    window.setTimeout(() => {
      const first = getDialogFocusable(dialog)[0];
      (first || dialog)?.focus();
    }, 0);
  }

  function trapDialogFocus(event) {
    if (!activeDialog || event.key !== "Tab") return;
    const items = getDialogFocusable(activeDialog);
    if (!items.length) {
      event.preventDefault();
      activeDialog.focus();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function prepareDialogAccessibility() {
    const drawer = $("#suite-drawer");
    if (drawer) {
      drawer.setAttribute("role", "dialog");
      drawer.setAttribute("aria-modal", "true");
      drawer.setAttribute("aria-labelledby", "suite-drawer-title");
      drawer.setAttribute("tabindex", "-1");
      drawer.dataset.state = drawer.classList.contains("is-open") ? "open" : "closed";
      drawer.setAttribute("aria-hidden", String(!drawer.classList.contains("is-open")));
    }

    const deleteModal = $("#suite-delete-modal");
    if (deleteModal) {
      const title = deleteModal.querySelector("h2");
      if (title && !title.id) title.id = "suite-delete-modal-title";
      deleteModal.setAttribute("role", "dialog");
      deleteModal.setAttribute("aria-modal", "true");
      if (title) deleteModal.setAttribute("aria-labelledby", title.id);
      deleteModal.setAttribute("tabindex", "-1");
      deleteModal.dataset.state = deleteModal.hidden ? "closed" : "open";
      deleteModal.setAttribute("aria-hidden", String(deleteModal.hidden));
    }
  }

  function searchable(entry) {
    return Object.values(entry).flat().join(" ").toLowerCase();
  }

  function filtered() {
    const query = ($("#suite-search")?.value || "").toLowerCase();
    const filterOne = $("#suite-filter-1")?.value || "all";
    const filterTwo = $("#suite-filter-2")?.value || "all";
    const sort = $("#suite-sort")?.value || "newest";
    let list = data.filter((entry) => searchable(entry).includes(query));

    if (filterOne !== "all") list = list.filter((entry) => (entry.status || entry.role) === filterOne);
    if (filterTwo !== "all") list = list.filter((entry) => (entry.category || entry.paymentStatus || entry.role) === filterTwo);

    list.sort((a, b) => {
      if (sort === "name") return (a.name || a.customer || a.id).localeCompare(b.name || b.customer || b.id, "id");
      if (sort === "value") return (b.price || b.spent || b.total || 0) - (a.price || a.spent || a.total || 0);
      return new Date(b.updated || b.joined || b.date) - new Date(a.updated || a.joined || a.date);
    });
    return list;
  }

  function render() {
    if (page === "dashboard") return;
    const list = filtered();
    $("#suite-body").innerHTML = list.map((entry) => renderer.row(page, entry)).join("");
    $("#suite-grid").innerHTML = list.map((entry) => renderer.card(page, entry)).join("");
    $("#suite-count").textContent = String(list.length);
    $("#suite-empty").hidden = list.length > 0;
    $("#suite-table-wrap").hidden = list.length === 0 || document.body.dataset.view === "grid";
    $("#suite-grid").hidden = list.length === 0 || document.body.dataset.view !== "grid";

    $$('[data-id]').forEach((element) => {
      const checkbox = $(".suite-check", element);
      if (checkbox) checkbox.checked = selected.has(element.dataset.id);
    });
    updateBulk();
  }

  function updateBulk() {
    const bar = $("#suite-bulk");
    if (!bar) return;
    $("#suite-bulk-count").textContent = String(selected.size);
    bar.hidden = selected.size === 0;
    const selectAll = $("#suite-select-all");
    if (!selectAll) return;
    const visible = filtered();
    selectAll.checked = visible.length > 0 && visible.every((entry) => selected.has(entry.id));
    selectAll.indeterminate = visible.some((entry) => selected.has(entry.id)) && !selectAll.checked;
  }

  function closeMenu() {
    const menu = $("#suite-menu");
    if (!menu) return;
    menu.hidden = true;
    $$('[data-menu]').forEach((button) => button.setAttribute("aria-expanded", "false"));
  }

  function openMenu(button, id) {
    activeId = id;
    menuReturnFocus = button;
    const menu = $("#suite-menu");
    const rect = button.getBoundingClientRect();
    menu.hidden = false;
    menu.style.top = `${Math.min(rect.bottom + 6, innerHeight - menu.offsetHeight - 12)}px`;
    menu.style.left = `${Math.max(12, Math.min(rect.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 12))}px`;
    button.setAttribute("aria-expanded", "true");
  }

  function openDrawer(mode, trigger = document.activeElement) {
    const drawer = $("#suite-drawer");
    const object = mode === "new" ? null : currentItem();
    if (!drawer) return;
    drawerReturnFocus = trigger instanceof HTMLElement ? trigger : menuReturnFocus;
    $("#suite-drawer-title").textContent = mode === "new"
      ? document.body.dataset.newLabel || "Tambah Data"
      : document.body.dataset.editLabel || "Detail Data";
    $("#suite-form-fields").innerHTML = renderer.form(page, object);
    drawer.dataset.formMode = mode;
    drawer.classList.add("is-open");
    setDialogState(drawer, true);
    focusDialog(drawer);
  }

  function closeDrawer({ restore = true } = {}) {
    const drawer = $("#suite-drawer");
    if (!drawer || !drawer.classList.contains("is-open")) return;
    drawer.classList.remove("is-open");
    setDialogState(drawer, false);
    if (restore) restoreFocus(drawerReturnFocus);
    drawerReturnFocus = null;
  }
  function checkboxValues(form, name) {
    return $$(`input[name="${name}"]:checked`, form).map((input) => input.value);
  }

  function validateUnique(id, object) {
    return !data.some((entry) => entry !== object && entry.id.toLowerCase() === String(id).toLowerCase());
  }

  function productPayload(formData, object) {
    return {
      ...(object || {}),
      id: formData.id,
      name: formData.name,
      category: formData.category,
      brand: formData.brand,
      shortDescription: formData.shortDescription || "",
      description: formData.description || "",
      price: Number(formData.price) || 0,
      salePrice: Number(formData.salePrice) || 0,
      cost: Number(formData.cost) || 0,
      promoStart: formData.promoStart || "",
      promoEnd: formData.promoEnd || "",
      promoLabel: formData.promoLabel || "",
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0,
      weight: Number(formData.weight) || 0,
      warehouse: formData.warehouse || "Gudang Utama",
      supplier: formData.supplier || "",
      barcode: formData.barcode || "",
      status: formData.status || "draft",
      visibility: formData.visibility || "public",
      image: formData.image || seed.products[0].image,
      gallery: formData.gallery || "",
      altText: formData.altText || formData.name,
      specs: formData.specs || "",
      compatibility: formData.compatibility || "",
      featured: formData.featured === "true",
      backorder: formData.backorder === "true",
      updated: new Date().toISOString().slice(0, 10),
    };
  }

  function userPayload(form, formData, object) {
    return {
      ...(object || {}),
      id: object?.id || `USR-${Date.now().toString().slice(-5)}`,
      name: formData.name,
      email: formData.email,
      phone: formData.phone || "",
      role: formData.role || "editor",
      status: formData.status || "invited",
      notes: formData.notes || "",
      permissions: checkboxValues(form, "permissions"),
      inviteExpiry: formData.inviteExpiry || "72",
      inviteLanguage: formData.inviteLanguage || "id",
      forcePassword: formData.forcePassword === "true",
      require2fa: formData.require2fa === "true",
      revokeSessions: formData.revokeSessions === "true",
      orders: object?.orders || 0,
      spent: object?.spent || 0,
      last: object?.last || "Belum aktif",
      joined: object?.joined || new Date().toISOString().slice(0, 10),
    };
  }

  function transactionPayload(formData, object) {
    return {
      ...object,
      status: formData.status || object.status,
      courier: formData.courier || "-",
      resi: formData.resi || "-",
      eta: formData.eta || "",
      fulfillmentLocation: formData.fulfillmentLocation || "Gudang Utama",
      internalNote: formData.internalNote || "",
      cancellationReason: formData.cancellationReason || "",
      refundReason: formData.refundReason || "",
      updated: new Date().toISOString(),
    };
  }

  function saveForm(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const formData = Object.fromEntries(new FormData(form));
    const object = currentItem();

    if (page === "products") {
      if (!validateUnique(formData.id, object)) {
        form.elements.id?.setCustomValidity("SKU sudah digunakan oleh produk lain.");
        form.elements.id?.reportValidity();
        return;
      }
      form.elements.id?.setCustomValidity("");
      const next = productPayload(formData, object);
      object ? data.splice(data.indexOf(object), 1, next) : data.unshift(next);
    } else if (page === "users") {
      const emailExists = data.some((entry) => entry !== object && entry.email.toLowerCase() === String(formData.email).toLowerCase());
      if (emailExists) {
        form.elements.email?.setCustomValidity("Email sudah terdaftar.");
        form.elements.email?.reportValidity();
        return;
      }
      form.elements.email?.setCustomValidity("");
      const next = userPayload(form, formData, object);
      object ? data.splice(data.indexOf(object), 1, next) : data.unshift(next);
    } else if (page === "transactions" && object) {
      const next = transactionPayload(formData, object);
      data.splice(data.indexOf(object), 1, next);
    }

    save();
    closeDrawer();
    render();
    toast(page === "users" && !object ? "Undangan staf berhasil dibuat." : "Perubahan berhasil disimpan.");
  }

  function askDelete(ids, trigger = document.activeElement) {
    const modal = $("#suite-delete-modal");
    if (!modal) return;
    deleteIds = ids;
    deleteReturnFocus = trigger instanceof HTMLElement ? trigger : menuReturnFocus;
    modal.hidden = false;
    $("#suite-delete-message").textContent = `${ids.length} data akan dihapus dari daftar.`;
    setDialogState(modal, true);
    focusDialog(modal);
  }

  function closeDelete({ restore = true } = {}) {
    const modal = $("#suite-delete-modal");
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    deleteIds = [];
    setDialogState(modal, false);
    const drawer = $("#suite-drawer");
    activeDialog = drawer?.classList.contains("is-open") ? drawer : null;
    syncBodyLock();
    if (restore) restoreFocus(deleteReturnFocus);
    deleteReturnFocus = null;
  }
  function action(name) {
    const object = currentItem();
    if (!object) return;
    if (name === "view" || name === "edit") openDrawer("edit", menuReturnFocus || document.activeElement);
    if (name === "duplicate" && page === "products") {
      data.unshift({ ...object, id: `${object.id}-COPY`, name: `${object.name} Copy`, status: "draft", updated: new Date().toISOString().slice(0, 10) });
      save();
      render();
      toast("Produk diduplikasi sebagai draft.");
    }
    if (name === "archive") {
      object.status = "archived";
      save();
      render();
      toast("Data dipindahkan ke arsip.");
    }
    if (name === "block" && page === "users") {
      object.status = "blocked";
      save();
      render();
      toast("Akun pengguna diblokir.");
    }
    if (name === "advance" && page === "transactions") {
      const flow = ["waiting", "paid", "processing", "shipping", "completed"];
      object.status = flow[Math.min(Math.max(flow.indexOf(object.status), 0) + 1, flow.length - 1)];
      save();
      render();
      toast("Status transaksi diperbarui.");
    }
    if (name === "delete") askDelete([object.id], menuReturnFocus || document.activeElement);
  }

  function setupCrud() {
    render();
    ["#suite-search", "#suite-filter-1", "#suite-filter-2", "#suite-sort"].forEach((selector) => {
      const control = $(selector);
      control?.addEventListener(control.tagName === "INPUT" ? "input" : "change", render);
    });

    $("#suite-reset")?.addEventListener("click", () => {
      $("#suite-search").value = "";
      $("#suite-filter-1").value = "all";
      $("#suite-filter-2").value = "all";
      render();
    });

    $$('[data-view]').forEach((button) => button.addEventListener("click", () => {
      document.body.dataset.view = button.dataset.view;
      $$('[data-view]').forEach((item) => item.classList.toggle("is-active", item === button));
      render();
    }));

    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-menu]");
      if (button) {
        const host = button.closest("[data-id]");
        closeMenu();
        openMenu(button, host.dataset.id);
        return;
      }
      if (!event.target.closest("#suite-menu")) closeMenu();
    });

    document.addEventListener("change", (event) => {
      if (!event.target.matches(".suite-check")) return;
      const id = event.target.closest("[data-id]").dataset.id;
      event.target.checked ? selected.add(id) : selected.delete(id);
      updateBulk();
    });

    $("#suite-select-all")?.addEventListener("change", (event) => {
      filtered().forEach((entry) => event.target.checked ? selected.add(entry.id) : selected.delete(entry.id));
      render();
    });

    $("#suite-menu")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-action]");
      if (!button) return;
      const name = button.dataset.action;
      closeMenu();
      action(name);
    });

    $("#suite-add")?.addEventListener("click", (event) => {
      activeId = null;
      openDrawer("new", event.currentTarget);
    });

    $$('[data-close-drawer]').forEach((button) => button.addEventListener("click", closeDrawer));
    $("#suite-form")?.addEventListener("submit", saveForm);

    $("#suite-bulk-close")?.addEventListener("click", () => {
      selected.clear();
      render();
    });

    $("#suite-bulk")?.addEventListener("click", (event) => {
      const button = event.target.closest("[data-bulk]");
      if (!button) return;
      const ids = [...selected];
      if (button.dataset.bulk === "delete") return askDelete(ids, button);
      data.forEach((entry) => {
        if (!selected.has(entry.id)) return;
        if (button.dataset.bulk === "activate") entry.status = "active";
        if (button.dataset.bulk === "archive") entry.status = "archived";
        if (button.dataset.bulk === "process") entry.status = "processing";
      });
      selected.clear();
      save();
      render();
      toast(`${ids.length} data diperbarui.`);
    });

    $("#suite-delete-modal")?.addEventListener("click", (event) => {
      if (event.target === event.currentTarget) closeDelete();
    });

    $("#suite-delete-cancel")?.addEventListener("click", () => closeDelete());
    $("#suite-delete-confirm")?.addEventListener("click", () => {
      data = data.filter((entry) => !deleteIds.includes(entry.id));
      selected.clear();
      save();
      closeDelete();
      render();
      toast("Data berhasil dihapus.");
    });
  }

  const menuToggle = $(".admin-menu-toggle");
  menuToggle?.addEventListener("click", () => {
    const open = !document.body.classList.contains("admin-menu-open");
    document.body.classList.toggle("admin-menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  document.addEventListener("keydown", (event) => {
    if (activeDialog && event.key === "Tab") {
      trapDialogFocus(event);
      return;
    }

    if (event.key !== "Escape") return;
    if ($("#suite-delete-modal") && !$("#suite-delete-modal").hidden) {
      event.preventDefault();
      closeDelete();
      return;
    }
    if ($("#suite-drawer")?.classList.contains("is-open")) {
      event.preventDefault();
      closeDrawer();
      return;
    }
    closeMenu();
    document.body.classList.remove("admin-menu-open");
  });

  prepareDialogAccessibility();
  if (page !== "dashboard") setupCrud();
})();
