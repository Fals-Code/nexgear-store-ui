(function () {
  "use strict";
  const ensureQualityLayer = () => {
    if (!document.querySelector('link[data-quality-hardening]')) {
      const qualityCss = document.createElement("link");
      qualityCss.rel = "stylesheet";
      qualityCss.href = "styles/quality-hardening.css?v=1";
      qualityCss.dataset.qualityHardening = "true";
      document.head.appendChild(qualityCss);
    }

    if (!window.NexA11y && !document.querySelector('script[data-quality-hardening]')) {
      const qualityScript = document.createElement("script");
      qualityScript.src = "scripts/quality-hardening.js?v=1";
      qualityScript.dataset.qualityHardening = "true";
      document.head.appendChild(qualityScript);
    }
  };
  ensureQualityLayer();
  const modalCss = document.createElement("link");
  modalCss.rel = "stylesheet";
  modalCss.href = "styles/admin-suite-modal.css?v=1";
  document.head.appendChild(modalCss);
  const page = document.body.dataset.adminPage || "";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const R = window.NEXGEAR_ADMIN_RENDER;
  const seed = window.NEXGEAR_ADMIN_DATA;
  const key = `nexgear-admin-${page}-v1`;
  let data = page === "dashboard" ? [] : load();
  let selected = new Set(),
    activeId = null,
    deleteIds = [];
  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(key));
      if (Array.isArray(saved) && saved.length) return saved;
    } catch (e) {}
    return JSON.parse(JSON.stringify(seed[page] || []));
  }
  function save() {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {}
  }
  function item() {
    return data.find((x) => x.id === activeId);
  }
  function toast(msg) {
    const t = $("#suite-toast");
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => (t.hidden = true), 2400);
  }
  function searchable(x) {
    return Object.values(x).join(" ").toLowerCase();
  }
  function filtered() {
    const q = ($("#suite-search")?.value || "").toLowerCase(),
      f1 = $("#suite-filter-1")?.value || "all",
      f2 = $("#suite-filter-2")?.value || "all",
      sort = $("#suite-sort")?.value || "newest";
    let list = data.filter((x) => searchable(x).includes(q));
    if (f1 !== "all") list = list.filter((x) => (x.status || x.role) === f1);
    if (f2 !== "all")
      list = list.filter(
        (x) => (x.category || x.paymentStatus || x.role) === f2,
      );
    list.sort((a, b) =>
      sort === "name"
        ? (a.name || a.customer || a.id).localeCompare(
            b.name || b.customer || b.id,
            "id",
          )
        : sort === "value"
          ? (b.price || b.spent || b.total) - (a.price || a.spent || a.total)
          : new Date(b.updated || b.joined || b.date) -
            new Date(a.updated || a.joined || a.date),
    );
    return list;
  }
  function render() {
    if (page === "dashboard") return;
    const list = filtered();
    $("#suite-body").innerHTML = list.map((x) => R.row(page, x)).join("");
    $("#suite-grid").innerHTML = list.map((x) => R.card(page, x)).join("");
    $("#suite-count").textContent = String(list.length);
    $("#suite-empty").hidden = list.length > 0;
    $("#suite-table-wrap").hidden =
      list.length === 0 || document.body.dataset.view === "grid";
    $("#suite-grid").hidden =
      list.length === 0 || document.body.dataset.view !== "grid";
    $$("[data-id]").forEach((el) => {
      const check = $(".suite-check", el);
      if (check) check.checked = selected.has(el.dataset.id);
    });
    updateBulk();
  }
  function updateBulk() {
    const bar = $("#suite-bulk");
    if (!bar) return;
    $("#suite-bulk-count").textContent = String(selected.size);
    bar.hidden = !selected.size;
    const all = $("#suite-select-all");
    if (all) {
      const visible = filtered();
      all.checked =
        visible.length > 0 && visible.every((x) => selected.has(x.id));
      all.indeterminate =
        visible.some((x) => selected.has(x.id)) && !all.checked;
    }
  }
  function closeMenu() {
    const menu = $("#suite-menu");
    if (!menu) return;
    menu.hidden = true;
    $$("[data-menu]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }
  function openMenu(btn, id) {
    activeId = id;
    const menu = $("#suite-menu"),
      r = btn.getBoundingClientRect();
    menu.hidden = false;
    menu.style.top = `${Math.min(r.bottom + 6, innerHeight - menu.offsetHeight - 12)}px`;
    menu.style.left = `${Math.max(12, Math.min(r.right - menu.offsetWidth, innerWidth - menu.offsetWidth - 12))}px`;
    btn.setAttribute("aria-expanded", "true");
  }
  function openDrawer(mode) {
    const d = $("#suite-drawer"),
      obj = mode === "new" ? null : item();
    $("#suite-drawer-title").textContent =
      mode === "new"
        ? document.body.dataset.newLabel || "Tambah Data"
        : document.body.dataset.editLabel || "Detail Data";
    $("#suite-form-fields").innerHTML = R.form(page, obj);
    d.classList.add("is-open");
    d.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    const d = $("#suite-drawer");
    if (!d) return;
    d.classList.remove("is-open");
    d.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  function saveForm(e) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget)),
      obj = item();
    if (page === "products") {
      const next = {
        ...(obj || {}),
        id: fd.id,
        name: fd.name,
        category: fd.category,
        brand: fd.brand,
        price: +fd.price,
        stock: +fd.stock,
        status: fd.status,
        image: fd.image,
        updated: new Date().toISOString().slice(0, 10),
      };
      obj ? (data[data.indexOf(obj)] = next) : data.unshift(next);
    } else if (page === "users") {
      const next = {
        ...(obj || {}),
        id: obj?.id || `USR-${Date.now().toString().slice(-4)}`,
        name: fd.name,
        email: fd.email,
        role: fd.role,
        status: fd.status,
        orders: obj?.orders || 0,
        spent: obj?.spent || 0,
        last: obj?.last || "Belum aktif",
        joined: obj?.joined || new Date().toISOString().slice(0, 10),
      };
      obj ? (data[data.indexOf(obj)] = next) : data.unshift(next);
    } else if (obj) obj.status = fd.status;
    save();
    closeDrawer();
    render();
    toast("Perubahan berhasil disimpan.");
  }
  function askDelete(ids) {
    deleteIds = ids;
    $("#suite-delete-modal").hidden = false;
    $("#suite-delete-message").textContent =
      `${ids.length} data akan dihapus dari daftar.`;
  }
  function closeDelete() {
    $("#suite-delete-modal").hidden = true;
    deleteIds = [];
  }
  function action(name) {
    const obj = item();
    if (!obj) return;
    if (name === "view" || name === "edit") openDrawer("edit");
    if (name === "duplicate" && page === "products") {
      data.unshift({
        ...obj,
        id: `${obj.id}-COPY`,
        name: `${obj.name} Copy`,
        status: "draft",
      });
      save();
      render();
      toast("Produk diduplikasi sebagai draft.");
    }
    if (name === "archive") {
      obj.status = "archived";
      save();
      render();
      toast("Data dipindahkan ke arsip.");
    }
    if (name === "block" && page === "users") {
      obj.status = "blocked";
      save();
      render();
      toast("Akun pengguna diblokir.");
    }
    if (name === "advance" && page === "transactions") {
      const flow = ["waiting", "paid", "processing", "shipping", "completed"];
      obj.status =
        flow[
          Math.min(Math.max(flow.indexOf(obj.status), 0) + 1, flow.length - 1)
        ];
      save();
      render();
      toast("Status transaksi diperbarui.");
    }
    if (name === "delete") askDelete([obj.id]);
  }
  function setupCrud() {
    render();
    [
      "#suite-search",
      "#suite-filter-1",
      "#suite-filter-2",
      "#suite-sort",
    ].forEach((s) => {
      const c = $(s);
      if (c)
        c.addEventListener(c.tagName === "INPUT" ? "input" : "change", render);
    });
    $("#suite-reset")?.addEventListener("click", () => {
      $("#suite-search").value = "";
      $("#suite-filter-1").value = "all";
      $("#suite-filter-2").value = "all";
      render();
    });
    $$("[data-view]").forEach((b) =>
      b.addEventListener("click", () => {
        document.body.dataset.view = b.dataset.view;
        $$("[data-view]").forEach((x) =>
          x.classList.toggle("is-active", x === b),
        );
        render();
      }),
    );
    document.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-menu]");
      if (btn) {
        const host = btn.closest("[data-id]");
        closeMenu();
        openMenu(btn, host.dataset.id);
        return;
      }
      if (!e.target.closest("#suite-menu")) closeMenu();
    });
    document.addEventListener("change", (e) => {
      if (e.target.matches(".suite-check")) {
        const id = e.target.closest("[data-id]").dataset.id;
        e.target.checked ? selected.add(id) : selected.delete(id);
        updateBulk();
      }
    });
    $("#suite-select-all")?.addEventListener("change", (e) => {
      filtered().forEach((x) =>
        e.target.checked ? selected.add(x.id) : selected.delete(x.id),
      );
      render();
    });
    $("#suite-menu")?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-action]");
      if (!b) return;
      const n = b.dataset.action;
      closeMenu();
      action(n);
    });
    $("#suite-add")?.addEventListener("click", () => {
      activeId = null;
      openDrawer("new");
    });
    $$("[data-close-drawer]").forEach((x) =>
      x.addEventListener("click", closeDrawer),
    );
    $("#suite-form")?.addEventListener("submit", saveForm);
    $("#suite-bulk-close")?.addEventListener("click", () => {
      selected.clear();
      render();
    });
    $("#suite-bulk")?.addEventListener("click", (e) => {
      const b = e.target.closest("[data-bulk]");
      if (!b) return;
      const ids = [...selected];
      if (b.dataset.bulk === "delete") return askDelete(ids);
      data.forEach((x) => {
        if (selected.has(x.id)) {
          if (b.dataset.bulk === "activate") x.status = "active";
          if (b.dataset.bulk === "archive") x.status = "archived";
          if (b.dataset.bulk === "process") x.status = "processing";
        }
      });
      selected.clear();
      save();
      render();
      toast(`${ids.length} data diperbarui.`);
    });
    $("#suite-delete-cancel")?.addEventListener("click", closeDelete);
    $("#suite-delete-confirm")?.addEventListener("click", () => {
      data = data.filter((x) => !deleteIds.includes(x.id));
      selected.clear();
      save();
      closeDelete();
      render();
      toast("Data berhasil dihapus.");
    });
  }
  const toggle = $(".admin-menu-toggle");
  toggle?.addEventListener("click", () => {
    const open = !document.body.classList.contains("admin-menu-open");
    document.body.classList.toggle("admin-menu-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeMenu();
    closeDrawer();
    if ($("#suite-delete-modal") && !$("#suite-delete-modal").hidden)
      closeDelete();
    document.body.classList.remove("admin-menu-open");
  });
  if (page !== "dashboard") setupCrud();
})();
