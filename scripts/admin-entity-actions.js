(() => {
  "use strict";

  if (window.NexAdminEntityActions) return;

  const body = document.body;
  const page = body?.dataset.adminPage || (body?.classList.contains("page-admin-articles") ? "articles" : "");
  const supported = new Set(["articles", "products", "users", "transactions"]);
  if (!body?.classList.contains("page-admin") || !supported.has(page)) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const entityLabels = {
    articles: { singular: "artikel", plural: "artikel", code: "AR" },
    products: { singular: "produk", plural: "produk", code: "PR" },
    users: { singular: "pengguna", plural: "pengguna", code: "US" },
    transactions: { singular: "transaksi", plural: "transaksi", code: "TR" },
  };
  const storageKeys = {
    articles: "nexgear-admin-articles-v1",
    products: "nexgear-admin-products-v1",
    users: "nexgear-admin-users-v1",
    transactions: "nexgear-admin-transactions-v1",
  };
  const fieldLabels = {
    title: "Judul",
    slug: "Slug",
    content: "Isi artikel",
    excerpt: "Excerpt",
    category: "Kategori",
    status: "Status",
    image: "Gambar",
    name: "Nama",
    id: "ID / SKU",
    brand: "Brand",
    price: "Harga",
    salePrice: "Harga promo",
    cost: "Harga modal",
    stock: "Stok",
    minStock: "Batas stok",
    role: "Role",
    email: "Email",
    phone: "Nomor telepon",
    courier: "Kurir",
    resi: "Nomor resi",
    eta: "Estimasi tiba",
    internalNote: "Catatan internal",
  };

  let lastContext = null;
  let activePolicy = null;
  let drawerSnapshots = new WeakMap();
  let observerRegistry = new WeakSet();

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const storage = {
    read(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    write(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    },
  };

  const ensureStyles = () => {
    if ($('link[data-entity-actions-css]')) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "styles/admin-entity-actions.css?v=1";
    link.dataset.entityActionsCss = "true";
    document.head.append(link);
  };

  const announce = (message) => {
    if (window.NexA11y?.announce) {
      window.NexA11y.announce(message);
      return;
    }
    let region = $("#entity-actions-live-region");
    if (!region) {
      region = document.createElement("div");
      region.id = "entity-actions-live-region";
      region.className = "visually-hidden";
      region.setAttribute("role", "status");
      region.setAttribute("aria-live", "polite");
      document.body.append(region);
    }
    region.textContent = "";
    requestAnimationFrame(() => { region.textContent = message; });
  };

  const showToast = (message) => {
    const toast = $(page === "articles" ? "#admin-toast" : "#suite-toast");
    if (!toast) {
      announce(message);
      return;
    }
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => { toast.hidden = true; }, 3200);
    announce(message);
  };

  const consumeFlash = () => {
    try {
      const message = sessionStorage.getItem("nexgear-admin-action-flash");
      if (!message) return;
      sessionStorage.removeItem("nexgear-admin-action-flash");
      window.setTimeout(() => showToast(message), 180);
    } catch {
      // Tidak kritis untuk fungsi utama.
    }
  };

  const setFlash = (message) => {
    try {
      sessionStorage.setItem("nexgear-admin-action-flash", message);
    } catch {
      // Reload tetap dilakukan walau session storage diblokir.
    }
  };

  const serializeArticleRows = () => $$("#article-list .article-row").map((row, index) => {
    const title = $("h2", row)?.textContent.trim() || `Artikel ${index + 1}`;
    const meta = $(".article-title-cell p", row)?.textContent || "/artikel · 6 menit baca";
    const reading = Number(meta.match(/(\d+)\s+menit/)?.[1] || 6);
    return {
      id: row.dataset.id || `seed-${index + 1}`,
      title,
      slug: meta.split("·")[0].trim(),
      reading,
      category: row.dataset.category || "Hardware",
      status: row.dataset.status || "draft",
      author: row.dataset.author || "Admin NEXGEAR",
      views: Number(row.dataset.views || 0),
      updated: row.dataset.updated || new Date().toISOString().slice(0, 10),
      excerpt: row.dataset.excerpt || "",
      image: row.dataset.image || $("img", row)?.src || "",
    };
  });

  const readRecords = () => {
    const saved = storage.read(storageKeys[page]);
    if (Array.isArray(saved)) return clone(saved);
    if (page === "articles") return serializeArticleRows();
    const seed = window.NEXGEAR_ADMIN_DATA?.[page];
    return Array.isArray(seed) ? clone(seed) : [];
  };

  const writeRecords = (records) => storage.write(storageKeys[page], records);

  const recordName = (record) => record?.title || record?.name || record?.customer || record?.email || record?.id || entityLabels[page].singular;

  const appendAudit = (record, action, reason = "") => {
    const audit = Array.isArray(record.auditLog) ? record.auditLog : [];
    audit.unshift({
      action,
      reason,
      actor: "Admin NEXGEAR",
      at: new Date().toISOString(),
    });
    record.auditLog = audit.slice(0, 20);
    record.updated = new Date().toISOString();
  };

  const contextFromTrigger = (trigger) => {
    if (page === "articles") {
      const row = trigger.closest(".article-row")
        || (() => {
          const card = trigger.closest(".article-grid-card");
          return card ? $(`#article-list .article-row[data-id="${CSS.escape(card.dataset.rowId || "")}"]`) : null;
        })();
      if (!row) return null;
      return {
        id: row.dataset.id,
        title: $("h2", row)?.textContent.trim() || "Artikel",
        status: row.dataset.status || "draft",
      };
    }

    const host = trigger.closest("[data-id]");
    if (!host) return null;
    const records = readRecords();
    const record = records.find((item) => String(item.id) === String(host.dataset.id));
    return {
      id: host.dataset.id,
      title: recordName(record),
      status: record?.status || "",
    };
  };

  const selectedIds = () => {
    if (page === "articles") {
      return $$("#article-list .article-row").filter((row) => $(".article-check", row)?.checked).map((row) => row.dataset.id);
    }
    return $$("[data-id]").filter((host) => $(".suite-check", host)?.checked).map((host) => host.dataset.id).filter((id, index, array) => array.indexOf(id) === index);
  };

  const resolveTargets = (bulk) => {
    const ids = bulk ? selectedIds() : [lastContext?.id].filter(Boolean);
    const records = readRecords();
    return {
      ids,
      records,
      targets: ids.map((id) => records.find((record) => String(record.id) === String(id))).filter(Boolean),
    };
  };

  const buildPolicy = (bulk = false) => {
    const { ids, records, targets } = resolveTargets(bulk);
    const count = targets.length;
    const label = count === 1 ? `“${recordName(targets[0])}”` : `${count} ${entityLabels[page].plural}`;

    if (!count) {
      return {
        kind: "protect",
        tone: "archive",
        ids,
        records,
        targets,
        title: "Tidak ada data yang dipilih",
        description: "Pilih data terlebih dahulu sebelum menjalankan aksi ini.",
        primary: "Tutup",
        impacts: ["Tidak ada perubahan yang dilakukan."],
      };
    }

    if (page === "articles") {
      const deletable = targets.every((record) => record.status === "draft");
      if (deletable) {
        return {
          kind: "delete",
          tone: "delete",
          ids,
          records,
          targets,
          label,
          title: count === 1 ? "Hapus draft artikel?" : `Hapus ${count} draft artikel?`,
          description: "Draft belum dipublikasikan dapat dihapus permanen dari prototype editorial.",
          primary: count === 1 ? "Hapus Draft" : `Hapus ${count} Draft`,
          confirmToken: count === 1 ? recordName(targets[0]) : `HAPUS ${count} DRAFT`,
          impacts: ["Draft hilang dari tabel dan penyimpanan lokal.", "Artikel yang sudah terbit tidak ikut dihapus.", "Tindakan dicatat pada alur UI sebelum data dilepas."],
        };
      }
      return {
        kind: "archive",
        tone: "archive",
        ids,
        records,
        targets,
        label,
        title: count === 1 ? "Arsipkan artikel?" : `Arsipkan ${count} artikel?`,
        description: "Artikel yang pernah terbit atau dijadwalkan tidak dihapus agar URL dan histori editorial tetap aman.",
        primary: count === 1 ? "Arsipkan Artikel" : `Arsipkan ${count} Artikel`,
        impacts: ["Status artikel berubah menjadi Arsip.", "Data, metadata, dan histori tetap tersimpan.", "Artikel dapat dipulihkan melalui perubahan status."],
      };
    }

    if (page === "products") {
      const deletable = targets.every((record) => record.status === "draft");
      if (deletable) {
        return {
          kind: "delete",
          tone: "delete",
          ids,
          records,
          targets,
          label,
          title: count === 1 ? "Hapus produk draft?" : `Hapus ${count} produk draft?`,
          description: "Hanya produk draft yang boleh dihapus permanen. Produk katalog aktif tetap dilindungi.",
          primary: count === 1 ? "Hapus Produk Draft" : `Hapus ${count} Draft`,
          confirmToken: count === 1 ? recordName(targets[0]) : `HAPUS ${count} PRODUK`,
          impacts: ["Produk draft hilang dari inventori lokal.", "Produk aktif dan histori katalog tidak terpengaruh.", "SKU draft tersebut dapat digunakan kembali."],
        };
      }
      return {
        kind: "archive",
        tone: "archive",
        ids,
        records,
        targets,
        label,
        title: count === 1 ? "Arsipkan produk?" : `Arsipkan ${count} produk?`,
        description: "Produk aktif tidak dihapus agar referensi katalog dan transaksi tetap konsisten.",
        primary: count === 1 ? "Arsipkan Produk" : `Arsipkan ${count} Produk`,
        impacts: ["Produk tidak lagi tampil sebagai item aktif.", "SKU, harga, dan histori produk tetap tersimpan.", "Produk dapat diaktifkan kembali dari workspace edit."],
      };
    }

    if (page === "users") {
      const deletableInvite = targets.every((record) => record.status === "invited" && Number(record.orders || 0) === 0);
      if (deletableInvite) {
        return {
          kind: "delete",
          tone: "delete",
          ids,
          records,
          targets,
          label,
          title: count === 1 ? "Batalkan undangan pengguna?" : `Batalkan ${count} undangan?`,
          description: "Akun yang belum aktif dan belum memiliki transaksi dapat dilepas dari daftar undangan.",
          primary: count === 1 ? "Batalkan Undangan" : `Batalkan ${count} Undangan`,
          confirmToken: count === 1 ? recordName(targets[0]) : `BATALKAN ${count} UNDANGAN`,
          impacts: ["Tautan undangan tidak lagi berlaku.", "Tidak ada transaksi atau histori pelanggan yang dihapus.", "Email dapat diundang kembali di kemudian hari."],
        };
      }
      return {
        kind: "deactivate",
        tone: "deactivate",
        ids,
        records,
        targets,
        label,
        title: count === 1 ? "Nonaktifkan akun?" : `Nonaktifkan ${count} akun?`,
        description: "Akun yang memiliki aktivitas tidak dihapus. Akses dihentikan tanpa merusak transaksi dan audit log.",
        primary: count === 1 ? "Nonaktifkan Akun" : `Nonaktifkan ${count} Akun`,
        reasonRequired: true,
        impacts: ["Pengguna tidak dapat masuk setelah status diperbarui.", "Riwayat transaksi dan identitas audit tetap tersimpan.", "Akun dapat diaktifkan kembali oleh admin."],
      };
    }

    const finalOnly = targets.every((record) => ["cancelled", "refund"].includes(record.status));
    if (finalOnly) {
      return {
        kind: "protect",
        tone: "archive",
        ids,
        records,
        targets,
        label,
        title: "Transaksi sudah berstatus final",
        description: "Transaksi batal atau refund dipertahankan sebagai bukti audit dan tidak dapat dihapus dari panel.",
        primary: "Tutup",
        impacts: ["Data finansial tetap utuh.", "Status final tidak diubah.", "Riwayat tetap tersedia untuk laporan dan investigasi."],
      };
    }

    const needsRefund = targets.some((record) => ["shipping", "completed"].includes(record.status));
    return {
      kind: needsRefund ? "refund" : "cancel",
      tone: needsRefund ? "refund" : "cancel",
      ids,
      records,
      targets,
      label,
      title: needsRefund ? (count === 1 ? "Ajukan refund transaksi?" : `Refund ${count} transaksi?`) : (count === 1 ? "Batalkan transaksi?" : `Batalkan ${count} transaksi?`),
      description: needsRefund
        ? "Pesanan yang sudah dikirim atau selesai tidak dihapus. Status dipindahkan ke refund dengan alasan yang tercatat."
        : "Pesanan aktif tidak dihapus. Status dipindahkan ke dibatalkan agar alur pembayaran dan audit tetap konsisten.",
      primary: needsRefund ? (count === 1 ? "Proses Refund" : `Refund ${count} Transaksi`) : (count === 1 ? "Batalkan Transaksi" : `Batalkan ${count} Transaksi`),
      reasonRequired: true,
      impacts: needsRefund
        ? ["Status transaksi dan pembayaran menjadi Refund.", "Alasan refund dicatat pada data transaksi.", "Nomor pesanan dan snapshot nilai tetap dipertahankan."]
        : ["Status transaksi menjadi Dibatalkan.", "Alasan pembatalan dicatat untuk audit.", "Nomor pesanan dan nilai transaksi tidak dihapus."],
    };
  };

  const createDialog = () => {
    if ($("#entity-action-dialog")) return;
    const dialog = document.createElement("div");
    dialog.id = "entity-action-dialog";
    dialog.className = "entity-action-dialog";
    dialog.hidden = true;
    dialog.dataset.tone = "delete";
    dialog.innerHTML = `
      <button class="entity-action-dialog__backdrop" type="button" data-safe-close aria-label="Tutup dialog"></button>
      <section class="entity-action-dialog__card" role="dialog" aria-modal="true" aria-labelledby="entity-action-title" aria-describedby="entity-action-description">
        <div class="entity-action-dialog__topline"></div>
        <header class="entity-action-dialog__header">
          <span class="entity-action-dialog__icon" data-safe-icon aria-hidden="true">!</span>
          <div class="entity-action-dialog__heading">
            <span class="entity-action-dialog__kicker" data-safe-kicker>Aksi sensitif</span>
            <h2 id="entity-action-title" data-safe-title>Konfirmasi tindakan</h2>
            <p id="entity-action-description" data-safe-description></p>
          </div>
          <button class="entity-action-dialog__close" type="button" data-safe-close aria-label="Tutup dialog">×</button>
        </header>
        <div class="entity-action-dialog__body">
          <div class="entity-protected-note" data-safe-protected hidden></div>
          <ul class="entity-action-impact" data-safe-impact></ul>
          <label class="entity-action-field" data-safe-reason-field hidden>
            <span>Alasan tindakan *</span>
            <textarea data-safe-reason rows="3" maxlength="280" placeholder="Tuliskan alasan yang jelas untuk audit internal"></textarea>
            <small>Alasan disimpan bersama perubahan status.</small>
          </label>
          <label class="entity-action-field" data-safe-confirm-field hidden>
            <span>Ketik teks konfirmasi</span>
            <input data-safe-confirm type="text" autocomplete="off" spellcheck="false">
            <small>Ketik <strong data-safe-token></strong> untuk membuka aksi permanen.</small>
          </label>
        </div>
        <footer class="entity-action-dialog__footer">
          <button class="btn btn-outline" type="button" data-safe-close>Batal</button>
          <button class="btn btn-danger entity-action-dialog__primary" type="button" data-safe-apply>Konfirmasi</button>
        </footer>
      </section>`;
    document.body.append(dialog);

    dialog.addEventListener("click", (event) => {
      if (event.target.closest("[data-safe-close]")) closeDialog();
      if (event.target.closest("[data-safe-apply]")) applyPolicy();
    });
    $("[data-safe-confirm]", dialog).addEventListener("input", syncDialogValidity);
    $("[data-safe-reason]", dialog).addEventListener("input", syncDialogValidity);
    dialog.addEventListener("keydown", trapDialogFocus);
  };

  const openDialog = (policy) => {
    activePolicy = policy;
    const dialog = $("#entity-action-dialog");
    if (!dialog) return;
    dialog.dataset.tone = policy.tone;
    $("[data-safe-title]", dialog).textContent = policy.title;
    $("[data-safe-description]", dialog).textContent = policy.description;
    $("[data-safe-kicker]", dialog).textContent = policy.kind === "delete" ? "PENGHAPUSAN PERMANEN" : policy.kind === "protect" ? "DATA DILINDUNGI" : "PERUBAHAN STATUS";
    $("[data-safe-icon]", dialog).textContent = policy.kind === "delete" ? "!" : policy.kind === "protect" ? "✓" : "↻";
    $("[data-safe-impact]", dialog).innerHTML = policy.impacts.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

    const protectedNote = $("[data-safe-protected]", dialog);
    protectedNote.hidden = policy.kind !== "protect";
    protectedNote.textContent = policy.kind === "protect" ? "Data ini sengaja dipertahankan karena merupakan bagian dari jejak operasional dan audit." : "";

    const confirmField = $("[data-safe-confirm-field]", dialog);
    const confirmInput = $("[data-safe-confirm]", dialog);
    confirmField.hidden = !policy.confirmToken;
    confirmInput.value = "";
    confirmInput.placeholder = policy.confirmToken || "";
    $("[data-safe-token]", dialog).textContent = policy.confirmToken || "";

    const reasonField = $("[data-safe-reason-field]", dialog);
    const reasonInput = $("[data-safe-reason]", dialog);
    reasonField.hidden = !policy.reasonRequired;
    reasonInput.value = "";

    const apply = $("[data-safe-apply]", dialog);
    apply.textContent = policy.primary;
    apply.dataset.tone = policy.tone;
    apply.classList.toggle("btn-danger", policy.tone === "delete");
    apply.hidden = false;

    dialog.hidden = false;
    body.style.overflow = "hidden";
    syncDialogValidity();
    window.setTimeout(() => {
      const first = policy.confirmToken ? confirmInput : policy.reasonRequired ? reasonInput : apply;
      first?.focus();
    }, 20);
    announce(policy.title);
  };

  function closeDialog() {
    const dialog = $("#entity-action-dialog");
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    body.style.overflow = "";
    activePolicy = null;
    lastContext?.trigger?.focus?.();
  }

  function syncDialogValidity() {
    const dialog = $("#entity-action-dialog");
    const apply = $("[data-safe-apply]", dialog);
    if (!activePolicy || !apply) return;
    const confirmed = !activePolicy.confirmToken || $("[data-safe-confirm]", dialog).value.trim() === activePolicy.confirmToken;
    const reasonReady = !activePolicy.reasonRequired || $("[data-safe-reason]", dialog).value.trim().length >= 8;
    apply.disabled = !(confirmed && reasonReady);
  }

  function trapDialogFocus(event) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeDialog();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = $$('button:not([hidden]):not(:disabled), input:not([hidden]):not(:disabled), textarea:not([hidden]):not(:disabled)', event.currentTarget);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function applyPolicy() {
    if (!activePolicy) return;
    if (activePolicy.kind === "protect") {
      closeDialog();
      return;
    }

    const reason = $("[data-safe-reason]", $("#entity-action-dialog"))?.value.trim() || "";
    let records = activePolicy.records;
    const ids = new Set(activePolicy.ids.map(String));
    const count = ids.size;

    if (activePolicy.kind === "delete") {
      records = records.filter((record) => !ids.has(String(record.id)));
    } else {
      records.forEach((record) => {
        if (!ids.has(String(record.id))) return;
        if (activePolicy.kind === "archive") record.status = "archived";
        if (activePolicy.kind === "deactivate") record.status = "inactive";
        if (activePolicy.kind === "cancel") {
          record.status = "cancelled";
          record.cancellationReason = reason;
        }
        if (activePolicy.kind === "refund") {
          record.status = "refund";
          record.paymentStatus = "refund";
          record.refundReason = reason;
        }
        appendAudit(record, activePolicy.kind, reason);
      });
    }

    if (!writeRecords(records)) {
      showToast("Perubahan tidak dapat disimpan karena penyimpanan browser diblokir.");
      return;
    }

    const messages = {
      delete: `${count} data berhasil dihapus permanen.`,
      archive: `${count} data berhasil dipindahkan ke arsip.`,
      deactivate: `${count} akun berhasil dinonaktifkan.`,
      cancel: `${count} transaksi berhasil dibatalkan.`,
      refund: `${count} transaksi dipindahkan ke proses refund.`,
    };
    setFlash(messages[activePolicy.kind]);
    closeDialog();
    window.location.reload();
  }

  const decorateActionLabels = () => {
    const menuDelete = page === "articles" ? $("#article-row-menu [data-menu-action='delete']") : $("#suite-menu [data-action='delete']");
    const bulkDelete = page === "articles" ? $("#bulk-action [data-bulk-action='delete']") : $("#suite-bulk [data-bulk='delete']");
    if (menuDelete) {
      menuDelete.dataset.safeAction = "true";
      menuDelete.textContent = page === "transactions" ? "Batalkan / Refund" : page === "users" ? "Nonaktifkan / Hapus Undangan" : "Arsipkan / Hapus Draft";
    }
    if (bulkDelete) {
      bulkDelete.dataset.safeAction = "true";
      bulkDelete.textContent = page === "transactions" ? "Batalkan / Refund" : page === "users" ? "Nonaktifkan" : "Arsipkan / Hapus Draft";
    }
  };

  const controlValue = (control) => control.type === "checkbox" ? String(control.checked) : control.value;

  const captureFormSnapshot = (form) => {
    const values = new Map();
    $$('input, select, textarea', form).forEach((control) => {
      if (!control.name || control.disabled) return;
      const key = control.type === "checkbox" ? `${control.name}:${control.value}` : control.name;
      values.set(key, controlValue(control));
    });
    drawerSnapshots.set(form, values);
  };

  const changedFields = (form) => {
    const snapshot = drawerSnapshots.get(form) || new Map();
    const changes = [];
    $$('input, select, textarea', form).forEach((control) => {
      if (!control.name || control.disabled) return;
      const key = control.type === "checkbox" ? `${control.name}:${control.value}` : control.name;
      if (snapshot.get(key) === controlValue(control)) return;
      const label = fieldLabels[control.name] || control.closest("label")?.querySelector(".form-field__label span, .form-field__label, span")?.textContent.trim().replace(/\s+/g, " ") || control.name;
      if (!changes.includes(label)) changes.push(label);
    });
    return changes;
  };

  const updateDrawerChanges = (drawer) => {
    const form = $("form", drawer);
    if (!form) return;
    const changes = changedFields(form);
    const chip = $(".entity-change-chip", drawer);
    const diff = $(".entity-diff-card", drawer);
    if (chip) {
      chip.dataset.state = changes.length ? "dirty" : "saved";
      chip.textContent = changes.length ? `${changes.length} perubahan` : "Semua tersimpan";
    }
    if (diff) {
      diff.hidden = changes.length === 0;
      $(".entity-diff-card__header span", diff).textContent = `${changes.length} field`;
      $(".entity-diff-list", diff).innerHTML = changes.slice(0, 6).map((label) => `<li><span>${escapeHtml(label)}</span></li>`).join("");
    }
  };

  const activateSectionObserver = (drawer) => {
    const form = $("form", drawer);
    const root = $(".form-workspace__main", drawer);
    const sections = $$(".form-section", drawer);
    if (!form || !root || !sections.length || observerRegistry.has(root)) return;
    observerRegistry.add(root);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      sections.forEach((section) => { section.dataset.sectionActive = String(section === visible.target); });
    }, { root, threshold: [0.22, 0.5, 0.72], rootMargin: "-8% 0px -58% 0px" });
    sections.forEach((section) => observer.observe(section));
  };

  const enhanceDrawer = (drawer) => {
    const form = $("form", drawer);
    const header = $(".suite-drawer-header, .editor-drawer__panel > header", drawer);
    if (!form || !header) return;
    const mode = page === "articles"
      ? ($("#editor-title")?.textContent.includes("Baru") ? "create" : "edit")
      : (drawer.dataset.formMode === "new" ? "create" : "edit");
    drawer.dataset.entityMode = mode;

    let modebar = $(".entity-modebar", drawer);
    if (!modebar) {
      modebar = document.createElement("div");
      modebar.className = "entity-modebar";
      header.insertAdjacentElement("afterend", modebar);
    }
    modebar.innerHTML = `
      <div class="entity-modebar__identity">
        <span class="entity-modebar__glyph" aria-hidden="true">${entityLabels[page].code}</span>
        <span class="entity-modebar__copy"><strong>${mode === "create" ? "Create workspace" : "Update workspace"}</strong><small>${mode === "create" ? "Data baru belum dipublikasikan" : "Perubahan tercatat pada state lokal"}</small></span>
      </div>
      <div class="entity-modebar__state"><span class="entity-change-chip" data-state="saved">Semua tersimpan</span><span class="entity-modebar__shortcuts"><kbd>⌘S</kbd><span>Simpan</span><kbd>ESC</kbd><span>Tutup</span></span></div>`;

    const aside = $(".form-workspace__aside", drawer);
    if (aside && !$(".entity-diff-card", aside)) {
      const diff = document.createElement("article");
      diff.className = "entity-diff-card";
      diff.hidden = true;
      diff.innerHTML = '<div class="entity-diff-card__header"><strong>Ringkasan perubahan</strong><span>0 field</span></div><ul class="entity-diff-list"></ul>';
      aside.prepend(diff);
    }

    if (!form.dataset.entityChangeReady) {
      form.dataset.entityChangeReady = "true";
      form.addEventListener("input", () => updateDrawerChanges(drawer));
      form.addEventListener("change", () => updateDrawerChanges(drawer));
      form.addEventListener("submit", () => window.setTimeout(() => captureFormSnapshot(form), 0));
    }
    window.setTimeout(() => {
      captureFormSnapshot(form);
      updateDrawerChanges(drawer);
      activateSectionObserver(drawer);
    }, 80);
  };

  const observeDrawers = () => {
    $$("#suite-drawer, #editor-drawer").forEach((drawer) => {
      const observer = new MutationObserver(() => {
        const open = drawer.classList.contains("is-open") || drawer.getAttribute("aria-hidden") === "false";
        if (open) enhanceDrawer(drawer);
      });
      observer.observe(drawer, { attributes: true, childList: true, subtree: true, attributeFilter: ["class", "aria-hidden"] });
    });
  };

  const interceptActions = () => {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-row-menu], [data-grid-menu], [data-menu]");
      if (trigger) {
        const context = contextFromTrigger(trigger);
        if (context) lastContext = { ...context, trigger };
      }

      const singleDelete = event.target.closest("[data-menu-action='delete'], [data-action='delete']");
      const bulkDelete = event.target.closest("[data-bulk-action='delete'], [data-bulk='delete']");
      if (!singleDelete && !bulkDelete) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openDialog(buildPolicy(Boolean(bulkDelete)));
    }, true);
  };

  const init = () => {
    ensureStyles();
    createDialog();
    decorateActionLabels();
    observeDrawers();
    interceptActions();
    consumeFlash();
    body.classList.add("admin-entity-actions");

    const mutationTarget = page === "articles" ? $("#article-list") : $("#suite-body");
    if (mutationTarget) new MutationObserver(decorateActionLabels).observe(mutationTarget, { childList: true, subtree: true });
  };

  window.NexAdminEntityActions = Object.freeze({
    open: (bulk = false) => openDialog(buildPolicy(bulk)),
    refreshLabels: decorateActionLabels,
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
