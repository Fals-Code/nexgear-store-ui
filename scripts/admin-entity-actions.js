(() => {
  "use strict";
  if (window.NexAdminEntityActions) return;

  const body = document.body;
  const page = body?.dataset.adminPage || (body?.classList.contains("page-admin-articles") ? "articles" : "");
  if (!body?.classList.contains("page-admin") || !["articles", "products", "users", "transactions"].includes(page)) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const storageKey = `nexgear-admin-${page}-v1`;
  let activeContext = null;
  let activePolicy = null;

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const clone = (value) => JSON.parse(JSON.stringify(value));

  const readRecords = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (Array.isArray(saved)) return clone(saved);
    } catch {}

    if (page !== "articles") return clone(window.NEXGEAR_ADMIN_DATA?.[page] || []);

    return $$("#article-list .article-row").map((row, index) => {
      const meta = $(".article-title-cell p", row)?.textContent || "/artikel · 6 menit baca";
      return {
        id: row.dataset.id || `seed-${index + 1}`,
        title: $("h2", row)?.textContent.trim() || `Artikel ${index + 1}`,
        slug: meta.split("·")[0].trim(),
        reading: Number(meta.match(/(\d+)\s+menit/)?.[1] || 6),
        category: row.dataset.category || "Hardware",
        status: row.dataset.status || "draft",
        author: row.dataset.author || "Admin NEXGEAR",
        views: Number(row.dataset.views || 0),
        updated: row.dataset.updated || new Date().toISOString().slice(0, 10),
        excerpt: row.dataset.excerpt || "",
        image: row.dataset.image || $("img", row)?.src || "",
      };
    });
  };

  const writeRecords = (records) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(records));
      return true;
    } catch {
      return false;
    }
  };

  const recordName = (record) => record?.title || record?.name || record?.customer || record?.email || record?.id || "data";

  const selectedIds = () => page === "articles"
    ? $$("#article-list .article-row").filter((row) => $(".article-check", row)?.checked).map((row) => row.dataset.id)
    : $$("[data-id]").filter((host) => $(".suite-check", host)?.checked).map((host) => host.dataset.id).filter((id, index, ids) => ids.indexOf(id) === index);

  const resolveBundle = (bulk) => {
    const records = readRecords();
    const ids = bulk ? selectedIds() : [activeContext?.id].filter(Boolean);
    return {
      records,
      ids,
      targets: ids.map((id) => records.find((record) => String(record.id) === String(id))).filter(Boolean),
    };
  };

  const policy = (kind, bundle, options) => ({ kind, tone: kind, ...bundle, ...options });

  const buildPolicy = (bulk) => {
    const bundle = resolveBundle(bulk);
    const count = bundle.targets.length;
    if (!count) return policy("protect", bundle, {
      tone: "archive",
      title: "Tidak ada data yang dipilih",
      description: "Pilih data terlebih dahulu sebelum menjalankan aksi ini.",
      primary: "Tutup",
      impacts: ["Tidak ada perubahan yang dilakukan."],
    });

    if (page === "articles") {
      if (bundle.targets.every((record) => record.status === "draft")) return policy("delete", bundle, {
        title: count === 1 ? "Hapus draft artikel?" : `Hapus ${count} draft artikel?`,
        description: "Draft yang belum dipublikasikan dapat dihapus permanen.",
        primary: count === 1 ? "Hapus Draft" : `Hapus ${count} Draft`,
        token: count === 1 ? recordName(bundle.targets[0]) : `HAPUS ${count} DRAFT`,
        impacts: ["Draft hilang dari penyimpanan lokal.", "Artikel terbit tidak ikut dihapus.", "URL publik tetap aman."],
      });
      return policy("archive", bundle, {
        title: count === 1 ? "Arsipkan artikel?" : `Arsipkan ${count} artikel?`,
        description: "Artikel terbit atau terjadwal dipindahkan ke arsip agar histori editorial tetap aman.",
        primary: count === 1 ? "Arsipkan Artikel" : `Arsipkan ${count} Artikel`,
        impacts: ["Status berubah menjadi Arsip.", "Metadata dan histori tetap tersimpan.", "Artikel dapat dipulihkan kembali."],
      });
    }

    if (page === "products") {
      if (bundle.targets.every((record) => record.status === "draft")) return policy("delete", bundle, {
        title: count === 1 ? "Hapus produk draft?" : `Hapus ${count} produk draft?`,
        description: "Hanya produk draft yang boleh dihapus permanen.",
        primary: count === 1 ? "Hapus Produk Draft" : `Hapus ${count} Draft`,
        token: count === 1 ? recordName(bundle.targets[0]) : `HAPUS ${count} PRODUK`,
        impacts: ["Produk draft hilang dari inventori lokal.", "Produk aktif tidak terpengaruh.", "SKU draft dapat digunakan kembali."],
      });
      return policy("archive", bundle, {
        title: count === 1 ? "Arsipkan produk?" : `Arsipkan ${count} produk?`,
        description: "Produk aktif tidak dihapus agar referensi katalog dan transaksi tetap konsisten.",
        primary: count === 1 ? "Arsipkan Produk" : `Arsipkan ${count} Produk`,
        impacts: ["Produk tidak lagi aktif.", "SKU dan histori tetap tersimpan.", "Produk dapat diaktifkan kembali."],
      });
    }

    if (page === "users") {
      if (bundle.targets.every((record) => record.status === "invited" && Number(record.orders || 0) === 0)) return policy("delete", bundle, {
        title: count === 1 ? "Batalkan undangan pengguna?" : `Batalkan ${count} undangan?`,
        description: "Undangan yang belum aktif dan belum memiliki transaksi dapat dilepas.",
        primary: count === 1 ? "Batalkan Undangan" : `Batalkan ${count} Undangan`,
        token: count === 1 ? recordName(bundle.targets[0]) : `BATALKAN ${count} UNDANGAN`,
        impacts: ["Tautan undangan tidak berlaku.", "Tidak ada transaksi yang dihapus.", "Email dapat diundang kembali."],
      });
      return policy("deactivate", bundle, {
        title: count === 1 ? "Nonaktifkan akun?" : `Nonaktifkan ${count} akun?`,
        description: "Akses dihentikan tanpa menghapus transaksi dan audit log.",
        primary: count === 1 ? "Nonaktifkan Akun" : `Nonaktifkan ${count} Akun`,
        reason: true,
        impacts: ["Pengguna tidak dapat masuk.", "Riwayat transaksi tetap tersimpan.", "Akun dapat diaktifkan kembali."],
      });
    }

    const groups = new Set(bundle.targets.map((record) => {
      if (["cancelled", "refund"].includes(record.status)) return "final";
      if (["shipping", "completed"].includes(record.status)) return "refund";
      return "cancel";
    }));

    if (groups.size > 1) return policy("protect", bundle, {
      tone: "archive",
      title: "Pisahkan transaksi berdasarkan status",
      description: "Pilihan berisi tahap transaksi berbeda. Proses pembatalan dan refund secara terpisah.",
      primary: "Tutup",
      impacts: ["Tidak ada transaksi yang diubah.", "Pilih transaksi dengan status sejenis.", "Snapshot nilai tetap aman."],
    });

    const group = [...groups][0];
    if (group === "final") return policy("protect", bundle, {
      tone: "archive",
      title: "Transaksi sudah berstatus final",
      description: "Transaksi batal atau refund dipertahankan sebagai bukti audit.",
      primary: "Tutup",
      impacts: ["Data finansial tetap utuh.", "Status final tidak berubah.", "Riwayat tetap tersedia."],
    });

    if (group === "refund") return policy("refund", bundle, {
      title: count === 1 ? "Ajukan refund transaksi?" : `Refund ${count} transaksi?`,
      description: "Pesanan yang sudah dikirim atau selesai dipindahkan ke refund, bukan dihapus.",
      primary: count === 1 ? "Proses Refund" : `Refund ${count} Transaksi`,
      reason: true,
      impacts: ["Status transaksi dan pembayaran menjadi Refund.", "Alasan dicatat untuk audit.", "Nomor pesanan tetap dipertahankan."],
    });

    return policy("cancel", bundle, {
      title: count === 1 ? "Batalkan transaksi?" : `Batalkan ${count} transaksi?`,
      description: "Pesanan aktif dipindahkan ke dibatalkan agar alur pembayaran tetap konsisten.",
      primary: count === 1 ? "Batalkan Transaksi" : `Batalkan ${count} Transaksi`,
      reason: true,
      impacts: ["Status menjadi Dibatalkan.", "Alasan dicatat untuk audit.", "Nilai transaksi tidak dihapus."],
    });
  };

  const createDialog = () => {
    if ($("#entity-action-dialog")) return;
    const dialog = document.createElement("div");
    dialog.id = "entity-action-dialog";
    dialog.className = "entity-action-dialog";
    dialog.hidden = true;
    dialog.innerHTML = `<button class="entity-action-dialog__backdrop" type="button" data-safe-close aria-label="Tutup dialog"></button><section class="entity-action-dialog__card" role="dialog" aria-modal="true" aria-labelledby="entity-action-title"><div class="entity-action-dialog__topline"></div><header class="entity-action-dialog__header"><span class="entity-action-dialog__icon" data-safe-icon aria-hidden="true">!</span><div class="entity-action-dialog__heading"><span class="entity-action-dialog__kicker" data-safe-kicker></span><h2 id="entity-action-title" data-safe-title></h2><p data-safe-description></p></div><button class="entity-action-dialog__close" type="button" data-safe-close aria-label="Tutup dialog">×</button></header><div class="entity-action-dialog__body"><div class="entity-protected-note" data-safe-protected hidden></div><ul class="entity-action-impact" data-safe-impact></ul><label class="entity-action-field" data-safe-reason-field hidden><span>Alasan tindakan *</span><textarea data-safe-reason rows="3" maxlength="280" placeholder="Tuliskan alasan minimal 8 karakter"></textarea><small>Alasan disimpan bersama perubahan status.</small></label><label class="entity-action-field" data-safe-token-field hidden><span>Ketik teks konfirmasi</span><input data-safe-token type="text" autocomplete="off"><small>Ketik <strong data-safe-token-label></strong> untuk membuka aksi permanen.</small></label></div><footer class="entity-action-dialog__footer"><button class="btn btn-outline" type="button" data-safe-close>Batal</button><button class="btn btn-danger entity-action-dialog__primary" type="button" data-safe-apply>Konfirmasi</button></footer></section>`;
    document.body.append(dialog);
    dialog.addEventListener("click", (event) => {
      if (event.target.closest("[data-safe-close]")) closeDialog();
      if (event.target.closest("[data-safe-apply]")) applyPolicy();
    });
    $("[data-safe-token]", dialog).addEventListener("input", validateDialog);
    $("[data-safe-reason]", dialog).addEventListener("input", validateDialog);
    dialog.addEventListener("keydown", (event) => { if (event.key === "Escape") closeDialog(); });
  };

  const closeMenus = () => {
    if ($("#article-row-menu")) $("#article-row-menu").hidden = true;
    if ($("#suite-menu")) $("#suite-menu").hidden = true;
    $$("[data-row-menu], [data-grid-menu], [data-menu]").forEach((button) => button.setAttribute("aria-expanded", "false"));
  };

  const openDialog = (nextPolicy) => {
    activePolicy = nextPolicy;
    closeMenus();
    const dialog = $("#entity-action-dialog");
    dialog.dataset.tone = activePolicy.tone;
    $("[data-safe-title]", dialog).textContent = activePolicy.title;
    $("[data-safe-description]", dialog).textContent = activePolicy.description;
    $("[data-safe-kicker]", dialog).textContent = activePolicy.kind === "delete" ? "PENGHAPUSAN PERMANEN" : activePolicy.kind === "protect" ? "DATA DILINDUNGI" : "PERUBAHAN STATUS";
    $("[data-safe-icon]", dialog).textContent = activePolicy.kind === "delete" ? "!" : activePolicy.kind === "protect" ? "✓" : "↻";
    $("[data-safe-impact]", dialog).innerHTML = activePolicy.impacts.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    $("[data-safe-protected]", dialog).hidden = activePolicy.kind !== "protect";
    $("[data-safe-protected]", dialog).textContent = activePolicy.kind === "protect" ? "Data dipertahankan karena merupakan bagian dari jejak operasional dan audit." : "";
    $("[data-safe-reason-field]", dialog).hidden = !activePolicy.reason;
    $("[data-safe-reason]", dialog).value = "";
    $("[data-safe-token-field]", dialog).hidden = !activePolicy.token;
    $("[data-safe-token]", dialog).value = "";
    $("[data-safe-token]", dialog).placeholder = activePolicy.token || "";
    $("[data-safe-token-label]", dialog).textContent = activePolicy.token || "";
    const apply = $("[data-safe-apply]", dialog);
    apply.textContent = activePolicy.primary;
    apply.dataset.tone = activePolicy.tone;
    dialog.hidden = false;
    body.style.overflow = "hidden";
    validateDialog();
    window.setTimeout(() => (activePolicy.token ? $("[data-safe-token]", dialog) : activePolicy.reason ? $("[data-safe-reason]", dialog) : apply).focus(), 20);
  };

  function closeDialog() {
    const dialog = $("#entity-action-dialog");
    if (!dialog || dialog.hidden) return;
    dialog.hidden = true;
    body.style.overflow = "";
    activePolicy = null;
    activeContext?.trigger?.focus?.();
  }

  function validateDialog() {
    const dialog = $("#entity-action-dialog");
    if (!activePolicy || !dialog) return;
    const tokenReady = !activePolicy.token || $("[data-safe-token]", dialog).value.trim() === activePolicy.token;
    const reasonReady = !activePolicy.reason || $("[data-safe-reason]", dialog).value.trim().length >= 8;
    $("[data-safe-apply]", dialog).disabled = !(tokenReady && reasonReady);
  }

  function applyPolicy() {
    if (!activePolicy) return;
    if (activePolicy.kind === "protect") return closeDialog();
    const ids = new Set(activePolicy.ids.map(String));
    const reason = $("[data-safe-reason]", $("#entity-action-dialog"))?.value.trim() || "";
    let records = activePolicy.records;

    if (activePolicy.kind === "delete") records = records.filter((record) => !ids.has(String(record.id)));
    else records.forEach((record) => {
      if (!ids.has(String(record.id))) return;
      if (activePolicy.kind === "archive") record.status = "archived";
      if (activePolicy.kind === "deactivate") record.status = "inactive";
      if (activePolicy.kind === "cancel") { record.status = "cancelled"; record.cancellationReason = reason; }
      if (activePolicy.kind === "refund") { record.status = "refund"; record.paymentStatus = "refund"; record.refundReason = reason; }
      record.auditLog = Array.isArray(record.auditLog) ? record.auditLog : [];
      record.auditLog.unshift({ action: activePolicy.kind, reason, actor: "Admin NEXGEAR", at: new Date().toISOString() });
      record.updated = new Date().toISOString();
    });

    if (!writeRecords(records)) return;
    const messages = {
      delete: `${ids.size} data berhasil dihapus.`,
      archive: `${ids.size} data berhasil diarsipkan.`,
      deactivate: `${ids.size} akun berhasil dinonaktifkan.`,
      cancel: `${ids.size} transaksi berhasil dibatalkan.`,
      refund: `${ids.size} transaksi dipindahkan ke refund.`,
    };
    try { sessionStorage.setItem("nexgear-admin-action-flash", messages[activePolicy.kind]); } catch {}
    window.location.reload();
  }

  const decorateLabels = () => {
    const menu = page === "articles" ? $("#article-row-menu [data-menu-action='delete']") : $("#suite-menu [data-action='delete']");
    const bulk = page === "articles" ? $("#bulk-action [data-bulk-action='delete']") : $("#suite-bulk [data-bulk='delete']");
    const menuText = page === "transactions" ? "Batalkan / Refund" : page === "users" ? "Nonaktifkan / Hapus Undangan" : "Arsipkan / Hapus Draft";
    const bulkText = page === "transactions" ? "Batalkan / Refund" : page === "users" ? "Nonaktifkan" : "Arsipkan / Hapus Draft";
    if (menu) menu.textContent = menuText;
    if (bulk) bulk.textContent = bulkText;
  };

  const trackContext = (trigger) => {
    if (page === "articles") {
      const card = trigger.closest(".article-grid-card");
      const row = trigger.closest(".article-row") || (card ? $(`#article-list .article-row[data-id="${CSS.escape(card.dataset.rowId || "")}"]`) : null);
      if (row) activeContext = { id: row.dataset.id, trigger };
      return;
    }
    const host = trigger.closest("[data-id]");
    if (host) activeContext = { id: host.dataset.id, trigger };
  };

  const ensureCss = () => {
    if ($("link[data-entity-actions-css]")) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "styles/admin-entity-actions.css?v=1";
    link.dataset.entityActionsCss = "true";
    document.head.append(link);
  };

  const consumeFlash = () => {
    try {
      const message = sessionStorage.getItem("nexgear-admin-action-flash");
      if (!message) return;
      sessionStorage.removeItem("nexgear-admin-action-flash");
      window.setTimeout(() => {
        const toast = $(page === "articles" ? "#admin-toast" : "#suite-toast");
        if (!toast) return;
        toast.textContent = message;
        toast.hidden = false;
        window.setTimeout(() => { toast.hidden = true; }, 3000);
      }, 180);
    } catch {}
  };

  const init = () => {
    ensureCss();
    createDialog();
    decorateLabels();
    consumeFlash();
    body.classList.add("admin-entity-actions");

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-row-menu], [data-grid-menu], [data-menu]");
      if (trigger) trackContext(trigger);

      const single = event.target.closest("[data-menu-action='delete'], [data-action='delete']");
      const bulk = event.target.closest("[data-bulk-action='delete'], [data-bulk='delete']");
      if (!single && !bulk) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openDialog(buildPolicy(Boolean(bulk)));
    }, true);
  };

  window.NexAdminEntityActions = Object.freeze({ open: (bulk = false) => openDialog(buildPolicy(bulk)) });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
