(() => {
  "use strict";

  if (window.NexAdminFormWorkspaces) return;

  const body = document.body;
  const page = body?.dataset.adminPage || (body?.classList.contains("page-admin-articles") ? "articles" : "");
  if (!body?.classList.contains("page-admin") || !["articles", "products", "users", "transactions"].includes(page)) return;

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const money = (value) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  let activeForm = null;
  let activeDrawer = null;
  let initialSnapshot = "";
  let bypassCloseGuard = false;
  let pendingCloseTrigger = null;
  let sectionObserver = null;

  const announce = (message) => window.NexA11y?.announce?.(message);

  const sectionHeader = (eyebrow, title, description, badge = "") => `
    <header class="form-section__header">
      <div><span class="form-section__eyebrow">${eyebrow}</span><h3>${title}</h3><p>${description}</p></div>
      ${badge ? `<span class="form-section__badge">${badge}</span>` : ""}
    </header>`;

  const field = ({ label, name, value = "", type = "text", hint = "", required = false, readonly = false, min = "", max = "", step = "", placeholder = "", full = false }) => `
    <label class="form-field${full ? " form-field--full" : ""}">
      <span class="form-field__label"><span>${label}${required ? " *" : ""}</span>${readonly ? "<small>Read-only</small>" : ""}</span>
      <input name="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? "required" : ""} ${readonly ? "readonly" : ""} ${min !== "" ? `min="${min}"` : ""} ${max !== "" ? `max="${max}"` : ""} ${step !== "" ? `step="${step}"` : ""} placeholder="${escapeHtml(placeholder)}">
      ${hint ? `<small class="form-field__hint">${hint}</small>` : ""}
    </label>`;

  const selectField = ({ label, name, value = "", options = [], hint = "", full = false, disabled = false }) => `
    <label class="form-field${full ? " form-field--full" : ""}">
      <span class="form-field__label"><span>${label}</span>${disabled ? "<small>Read-only</small>" : ""}</span>
      <select name="${name}" ${disabled ? "disabled" : ""}>${options.map(([key, text]) => `<option value="${escapeHtml(key)}" ${String(value) === String(key) ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select>
      ${hint ? `<small class="form-field__hint">${hint}</small>` : ""}
    </label>`;

  const textareaField = ({ label, name, value = "", hint = "", placeholder = "", full = true, rows = 5 }) => `
    <label class="form-field${full ? " form-field--full" : ""}">
      <span class="form-field__label"><span>${label}</span><small data-counter-for="${name}"></small></span>
      <textarea name="${name}" rows="${rows}" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea>
      ${hint ? `<small class="form-field__hint">${hint}</small>` : ""}
    </label>`;

  const toggle = ({ title, description, name, checked = false }) => `
    <label class="form-toggle"><span><strong>${title}</strong><small>${description}</small></span><input name="${name}" type="checkbox" value="true" ${checked ? "checked" : ""}></label>`;

  const nav = (sections) => `
    <nav class="form-workspace__nav" aria-label="Bagian form">
      <span class="form-workspace__nav-label">Navigasi form</span>
      ${sections.map((item, index) => `<button class="form-workspace__step" type="button" data-form-target="${item.id}" data-state="${index === 0 ? "active" : "idle"}"><span class="form-workspace__step-index">${String(index + 1).padStart(2, "0")}</span><span class="form-workspace__step-copy"><strong>${item.title}</strong><small>${item.subtitle}</small></span></button>`).join("")}
      <div class="form-workspace__progress"><div><span>Kelengkapan</span><strong data-form-progress-label>0%</strong></div><div class="form-workspace__progress-track"><i data-form-progress-bar></i></div></div>
    </nav>`;

  const stickyActions = ({ primary = "Simpan Perubahan", secondary = "Batal", draft = "", preview = false }) => `
    <footer class="form-sticky-actions">
      <div class="form-sticky-actions__meta"><strong data-form-save-state>Belum ada perubahan</strong><span>Ctrl/⌘ + S untuk menyimpan</span></div>
      <div class="form-sticky-actions__buttons">
        <button class="btn btn-outline" type="button" data-workspace-close>${secondary}</button>
        ${preview ? '<button class="btn btn-outline" type="button" data-workspace-preview>Preview</button>' : ""}
        ${draft ? `<button class="btn btn-outline" type="button" data-workspace-draft>${draft}</button>` : ""}
        <button class="btn btn-primary" type="submit">${primary}</button>
      </div>
    </footer>`;

  const renderProduct = (obj) => {
    const mode = obj ? "edit" : "create";
    const publication = ["draft", "archived"].includes(obj?.status) ? obj.status : "active";
    const sections = [
      { id: "product-basic", title: "Informasi", subtitle: "Identitas produk" },
      { id: "product-pricing", title: "Harga", subtitle: "Harga dan margin" },
      { id: "product-stock", title: "Inventori", subtitle: "Stok dan gudang" },
      { id: "product-media", title: "Media", subtitle: "Gambar dan alt text" },
      { id: "product-specs", title: "Spesifikasi", subtitle: "Detail teknis" },
      { id: "product-publish", title: "Publikasi", subtitle: "Status katalog" },
    ];
    const image = obj?.image || window.NEXGEAR_ADMIN_DATA.products[0].image;
    return `<div class="form-workspace" data-form-mode="${mode}">
      ${nav(sections)}
      <div class="form-workspace__main">
        <section class="form-section" id="product-basic" data-required-section>${sectionHeader("01 / Product identity", "Informasi dasar", "Data utama yang tampil pada katalog dan pencarian produk.", mode === "create" ? "Produk baru" : escapeHtml(obj.id))}<div class="form-grid">
          ${field({ label: "Nama produk", name: "name", value: obj?.name, required: true, placeholder: "Contoh: Vortex VX Pro Mechanical" })}
          ${field({ label: "SKU", name: "id", value: obj?.id || `NX-${Date.now().toString().slice(-6)}`, required: true, hint: "SKU harus unik dan tidak berubah setelah transaksi dibuat." })}
          ${selectField({ label: "Kategori", name: "category", value: obj?.category || "Control", options: [["Control", "Control"], ["Sound", "Sound"], ["Machines", "Machines"], ["Build", "Build"]] })}
          ${field({ label: "Brand", name: "brand", value: obj?.brand || "NEXGEAR", required: true })}
          ${textareaField({ label: "Deskripsi singkat", name: "shortDescription", value: obj?.shortDescription || "", rows: 3, hint: "Maksimal 160 karakter untuk card katalog." })}
          ${textareaField({ label: "Deskripsi lengkap", name: "description", value: obj?.description || "", rows: 7, hint: "Jelaskan manfaat, kompatibilitas, dan konteks penggunaan produk." })}
        </div></section>
        <section class="form-section" id="product-pricing" data-required-section>${sectionHeader("02 / Commercial", "Harga dan penawaran", "Harga promo, modal, serta margin dihitung langsung agar admin tidak menebak-nebak.")}<div class="form-grid form-grid--3">
          ${field({ label: "Harga normal", name: "price", value: obj?.price || 0, type: "number", min: 0, required: true })}
          ${field({ label: "Harga promo", name: "salePrice", value: obj?.salePrice || 0, type: "number", min: 0, hint: "Isi 0 jika tidak ada promo." })}
          ${field({ label: "Harga modal", name: "cost", value: obj?.cost || 0, type: "number", min: 0, hint: "Hanya tampil untuk admin." })}
          ${field({ label: "Mulai promo", name: "promoStart", value: obj?.promoStart || "", type: "datetime-local" })}
          ${field({ label: "Akhir promo", name: "promoEnd", value: obj?.promoEnd || "", type: "datetime-local" })}
          ${field({ label: "Label promo", name: "promoLabel", value: obj?.promoLabel || "", placeholder: "Contoh: Mid Year Sale" })}
        </div></section>
        <section class="form-section" id="product-stock" data-required-section>${sectionHeader("03 / Inventory", "Stok dan inventori", "Status stok dihitung otomatis dari stok tersedia dan batas minimum.")}<div class="form-grid form-grid--3">
          ${field({ label: "Stok tersedia", name: "stock", value: obj?.stock || 0, type: "number", min: 0, required: true })}
          ${field({ label: "Batas stok minimum", name: "minStock", value: obj?.minStock ?? 5, type: "number", min: 0 })}
          ${field({ label: "Berat (gram)", name: "weight", value: obj?.weight || 0, type: "number", min: 0 })}
          ${field({ label: "Lokasi gudang", name: "warehouse", value: obj?.warehouse || "Gudang Utama", placeholder: "Rak A-12" })}
          ${field({ label: "Supplier", name: "supplier", value: obj?.supplier || "", placeholder: "Nama supplier" })}
          ${field({ label: "Barcode", name: "barcode", value: obj?.barcode || "", placeholder: "EAN / UPC" })}
        </div><input type="hidden" name="status" value="${escapeHtml(obj?.status || "draft")}" data-product-status></section>
        <section class="form-section" id="product-media">${sectionHeader("04 / Media", "Media produk", "Gunakan gambar tajam, rasio konsisten, dan alt text yang menjelaskan isi gambar.")}<div class="form-grid">
          ${field({ label: "URL gambar utama", name: "image", value: image, type: "url", required: true, full: true })}
          ${textareaField({ label: "Galeri gambar", name: "gallery", value: obj?.gallery || "", rows: 4, hint: "Satu URL per baris.", full: true })}
          ${field({ label: "Alt text", name: "altText", value: obj?.altText || obj?.name || "", full: true, hint: "Deskripsi singkat untuk pembaca layar dan saat gambar gagal dimuat." })}
        </div></section>
        <section class="form-section" id="product-specs">${sectionHeader("05 / Technical", "Spesifikasi teknis", "Tuliskan satu spesifikasi per baris dengan format Nama: Nilai.")}<div class="form-grid">
          ${textareaField({ label: "Daftar spesifikasi", name: "specs", value: obj?.specs || "Switch: Mechanical\nConnectivity: Wireless\nWarranty: 2 tahun", rows: 8, full: true })}
          ${textareaField({ label: "Kompatibilitas", name: "compatibility", value: obj?.compatibility || "", rows: 4, full: true })}
        </div></section>
        <section class="form-section" id="product-publish">${sectionHeader("06 / Lifecycle", "Publikasi katalog", "Atur apakah produk siap tampil, masih draft, atau diarsipkan.")}<div class="form-grid">
          ${selectField({ label: "Status publikasi", name: "publicationStatus", value: publication, options: [["draft", "Draft"], ["active", "Aktif"], ["archived", "Arsip"]], hint: "Status stok menipis dan habis dihitung otomatis." })}
          ${selectField({ label: "Visibilitas", name: "visibility", value: obj?.visibility || "public", options: [["public", "Publik"], ["unlisted", "Tidak terdaftar"], ["internal", "Internal"]] })}
          ${toggle({ title: "Produk unggulan", description: "Tampilkan pada area rekomendasi utama.", name: "featured", checked: Boolean(obj?.featured) })}
          ${toggle({ title: "Izinkan backorder", description: "Pesanan tetap dapat dibuat saat stok habis.", name: "backorder", checked: Boolean(obj?.backorder) })}
        </div></section>
      </div>
      <aside class="form-workspace__aside">
        <div class="form-card"><div class="form-card__header"><strong>Preview katalog</strong><span>Live</span></div><div class="form-media-preview"><img data-product-preview src="${escapeHtml(image)}" alt="Preview produk"><span class="form-media-preview__fallback">Preview tidak tersedia</span></div></div>
        <div class="form-card"><div class="form-card__header"><strong>Ringkasan harga</strong><span data-price-state>Normal</span></div><div class="form-price-preview"><div class="form-price-preview__main"><div><del data-price-normal>${money(obj?.price || 0)}</del><strong data-price-active>${money(obj?.price || 0)}</strong></div><span class="form-price-preview__discount" data-price-discount>0%</span></div><div class="form-summary-list"><div><span>Margin</span><strong data-price-margin>${money((obj?.price || 0) - (obj?.cost || 0))}</strong></div><div><span>Status stok</span><strong data-stock-label>Aktif</strong></div></div></div></div>
        ${mode === "edit" ? `<div class="form-card"><div class="form-card__header"><strong>Riwayat</strong><span>Audit</span></div><ul class="audit-list"><li><i></i><div><strong>Produk diperbarui</strong><small>${escapeHtml(obj.updated || "Hari ini")} · Admin NEXGEAR</small></div></li><li><i></i><div><strong>Harga saat ini</strong><small>${money(obj.price)}</small></div></li></ul></div>` : ""}
      </aside>
      ${stickyActions({ primary: mode === "create" ? "Buat Produk" : "Simpan Produk", draft: "Simpan Draft" })}
    </div>`;
  };

  const permissionMatrix = (obj) => {
    const defaults = obj?.permissions || (obj?.role === "admin" ? ["articles:view", "articles:write", "products:view", "products:write", "users:view", "transactions:view", "transactions:write"] : []);
    const modules = [["articles", "Artikel"], ["products", "Produk"], ["users", "Pengguna"], ["transactions", "Transaksi"]];
    const actions = [["view", "Lihat"], ["write", "Kelola"], ["delete", "Hapus"]];
    return `<div class="permission-matrix"><table><thead><tr><th>Modul</th>${actions.map(([, label]) => `<th>${label}</th>`).join("")}</tr></thead><tbody>${modules.map(([module, label]) => `<tr><td>${label}</td>${actions.map(([action]) => { const key = `${module}:${action}`; return `<td><input type="checkbox" name="permissions" value="${key}" ${defaults.includes(key) ? "checked" : ""} aria-label="${label} ${action}"></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
  };

  const renderUser = (obj) => {
    const mode = obj ? "edit" : "create";
    const sections = mode === "create"
      ? [{ id: "user-profile", title: "Identitas", subtitle: "Data staf" }, { id: "user-access", title: "Akses", subtitle: "Role dan permission" }, { id: "user-invite", title: "Undangan", subtitle: "Keamanan awal" }]
      : [{ id: "user-profile", title: "Profil", subtitle: "Identitas akun" }, { id: "user-access", title: "Akses", subtitle: "Role dan permission" }, { id: "user-activity", title: "Aktivitas", subtitle: "Riwayat akun" }, { id: "user-security", title: "Keamanan", subtitle: "Session dan status" }];
    return `<div class="form-workspace form-workspace--compact" data-form-mode="${mode}">
      ${nav(sections)}
      <div class="form-workspace__main">
        <section class="form-section" id="user-profile" data-required-section>${sectionHeader("01 / Identity", mode === "create" ? "Undang staf baru" : "Profil pengguna", mode === "create" ? "Akun staf dibuat melalui undangan agar password tidak pernah ditentukan admin." : "Perbarui data identitas tanpa mengubah histori dan ID pengguna.", mode === "create" ? "Invite flow" : escapeHtml(obj.id))}<div class="form-grid">
          ${field({ label: "Nama lengkap", name: "name", value: obj?.name, required: true })}
          ${field({ label: "Email", name: "email", value: obj?.email, type: "email", required: true })}
          ${field({ label: "Nomor telepon", name: "phone", value: obj?.phone || "", type: "tel", placeholder: "+62 812 ..." })}
          ${field({ label: "User ID", name: "userIdDisplay", value: obj?.id || "Dibuat otomatis", readonly: true })}
          ${textareaField({ label: "Catatan internal", name: "notes", value: obj?.notes || "", rows: 4, full: true })}
        </div></section>
        <section class="form-section" id="user-access" data-required-section>${sectionHeader("02 / Authorization", "Role dan permission", "Role memberi preset awal. Permission tetap dapat disesuaikan per modul.")}<div class="form-grid">
          ${selectField({ label: "Role", name: "role", value: obj?.role || "editor", options: [["admin", "Admin"], ["editor", "Editor"], ["support", "Support"], ["customer", "Customer"]] })}
          ${selectField({ label: "Status akun", name: "status", value: obj?.status || "invited", options: [["invited", "Diundang"], ["active", "Aktif"], ["verified", "Terverifikasi"], ["inactive", "Tidak Aktif"], ["blocked", "Diblokir"]] })}
        </div><div style="height:14px"></div>${permissionMatrix(obj)}</section>
        ${mode === "create" ? `<section class="form-section" id="user-invite">${sectionHeader("03 / Invitation", "Pengaturan undangan", "Undangan memiliki batas waktu dan kebijakan keamanan yang jelas.")}<div class="form-grid">
          ${selectField({ label: "Masa berlaku", name: "inviteExpiry", value: obj?.inviteExpiry || "72", options: [["24", "24 jam"], ["72", "3 hari"], ["168", "7 hari"]] })}
          ${selectField({ label: "Bahasa email", name: "inviteLanguage", value: obj?.inviteLanguage || "id", options: [["id", "Bahasa Indonesia"], ["en", "English"]] })}
          ${toggle({ title: "Wajib ganti password", description: "Pengguna harus membuat password baru saat aktivasi.", name: "forcePassword", checked: true })}
          ${toggle({ title: "Wajibkan 2FA", description: "Aktivasi belum selesai sebelum 2FA terpasang.", name: "require2fa", checked: Boolean(obj?.require2fa) })}
        </div></section>` : `<section class="form-section" id="user-activity">${sectionHeader("03 / Audit", "Aktivitas akun", "Data ini bersifat read-only dan membantu investigasi akses.")}<div class="form-grid form-grid--3">
          ${field({ label: "Total pesanan", name: "ordersDisplay", value: obj.orders || 0, readonly: true })}
          ${field({ label: "Total belanja", name: "spentDisplay", value: money(obj.spent || 0), readonly: true })}
          ${field({ label: "Terakhir aktif", name: "lastDisplay", value: obj.last || "Belum aktif", readonly: true })}
        </div><ul class="audit-list"><li><i></i><div><strong>Login terakhir</strong><small>${escapeHtml(obj.last || "Belum aktif")}</small></div></li><li><i></i><div><strong>Akun dibuat</strong><small>${escapeHtml(obj.joined || "-")}</small></div></li></ul></section>
        <section class="form-section" id="user-security">${sectionHeader("04 / Security", "Keamanan akun", "Tindakan keamanan tidak menghapus histori transaksi atau audit log.")}<div class="form-grid">${toggle({ title: "Wajibkan 2FA", description: "Pengguna harus mengaktifkan autentikasi dua faktor.", name: "require2fa", checked: Boolean(obj.require2fa) })}${toggle({ title: "Cabut session saat disimpan", description: "Semua perangkat akan diminta login ulang.", name: "revokeSessions", checked: false })}</div><div style="height:14px"></div><div class="form-danger-zone"><h4>Zona sensitif</h4><p>Nonaktifkan atau blokir akun tanpa menghapus identitas, transaksi, dan audit log.</p><button type="button" data-user-security-action="block">Blokir akun</button></div></section>`}
      </div>
      ${stickyActions({ primary: mode === "create" ? "Kirim Undangan" : "Simpan Perubahan" })}
    </div>`;
  };

  const transactionSteps = (status) => {
    const flow = ["waiting", "paid", "processing", "shipping", "completed"];
    const labels = { waiting: "Menunggu", paid: "Dibayar", processing: "Diproses", shipping: "Dikirim", completed: "Selesai" };
    const current = flow.indexOf(status);
    return `<div class="transaction-state">${flow.map((key, index) => `<div class="transaction-state__step" data-state="${index < current ? "done" : index === current ? "active" : "idle"}"><i></i><strong>${labels[key]}</strong><small>${index < current ? "Selesai" : index === current ? "Saat ini" : "Berikutnya"}</small></div>`).join("")}</div>`;
  };

  const renderTransaction = (obj) => {
    const sections = [{ id: "transaction-overview", title: "Ringkasan", subtitle: "Status dan nilai" }, { id: "transaction-fulfillment", title: "Fulfillment", subtitle: "Kurir dan resi" }, { id: "transaction-notes", title: "Catatan", subtitle: "Internal dan alasan" }, { id: "transaction-audit", title: "Audit", subtitle: "Riwayat perubahan" }];
    const labels = window.NEXGEAR_ADMIN_RENDER.labels;
    return `<div class="form-workspace" data-form-mode="edit" data-current-status="${escapeHtml(obj?.status || "waiting")}">
      ${nav(sections)}
      <div class="form-workspace__main">
        <section class="form-section" id="transaction-overview" data-required-section>${sectionHeader("01 / Order state", `Transaksi ${escapeHtml(obj?.id || "-")}`, "Status bergerak melalui alur yang terkontrol. Data finansial dan snapshot produk tidak dapat diubah.", labels[obj?.status] || obj?.status)}${transactionSteps(obj?.status || "waiting")}<div style="height:18px"></div><div class="form-grid form-grid--3">
          ${field({ label: "Nomor pesanan", name: "orderIdDisplay", value: obj?.id, readonly: true })}
          ${field({ label: "Pelanggan", name: "customerDisplay", value: obj?.customer, readonly: true })}
          ${field({ label: "Email", name: "emailDisplay", value: obj?.email, readonly: true })}
          ${field({ label: "Tanggal", name: "dateDisplay", value: obj?.date, readonly: true })}
          ${field({ label: "Pembayaran", name: "paymentDisplay", value: `${obj?.payment || "-"} · ${labels[obj?.paymentStatus] || obj?.paymentStatus || "-"}`, readonly: true })}
          ${field({ label: "Total", name: "totalDisplay", value: money(obj?.total || 0), readonly: true })}
        </div><div style="height:14px"></div>${selectField({ label: "Status transaksi", name: "status", value: obj?.status || "waiting", options: [["waiting", "Menunggu"], ["paid", "Dibayar"], ["processing", "Diproses"], ["shipping", "Dikirim"], ["completed", "Selesai"], ["cancelled", "Dibatalkan"], ["refund", "Refund"]], hint: "Perpindahan status dibatasi untuk menjaga audit dan konsistensi laporan.", full: true })}</section>
        <section class="form-section" id="transaction-fulfillment">${sectionHeader("02 / Fulfillment", "Pengiriman dan pemenuhan", "Nomor resi diwajibkan sebelum transaksi ditandai dikirim.")}<div class="form-grid">
          ${field({ label: "Kurir", name: "courier", value: obj?.courier === "-" ? "" : obj?.courier, placeholder: "Contoh: JNE Reguler" })}
          ${field({ label: "Nomor resi", name: "resi", value: obj?.resi === "-" ? "" : obj?.resi, placeholder: "Masukkan resi pengiriman" })}
          ${field({ label: "Estimasi tiba", name: "eta", value: obj?.eta || "", type: "date" })}
          ${field({ label: "Lokasi fulfillment", name: "fulfillmentLocation", value: obj?.fulfillmentLocation || "Gudang Utama" })}
        </div><div style="height:14px"></div><button class="btn btn-outline" type="button" data-advance-transaction>Proses ke status berikutnya</button></section>
        <section class="form-section" id="transaction-notes">${sectionHeader("03 / Notes", "Catatan operasional", "Catatan internal tidak terlihat oleh customer.")}<div class="form-grid">
          ${textareaField({ label: "Catatan internal", name: "internalNote", value: obj?.internalNote || "", rows: 5, full: true })}
          ${textareaField({ label: "Alasan pembatalan", name: "cancellationReason", value: obj?.cancellationReason || "", rows: 3 })}
          ${textareaField({ label: "Alasan refund", name: "refundReason", value: obj?.refundReason || "", rows: 3 })}
        </div></section>
        <section class="form-section" id="transaction-audit">${sectionHeader("04 / Audit trail", "Riwayat transaksi", "Setiap perubahan status tercatat sebagai aktivitas operasional.")}<ul class="audit-list"><li><i></i><div><strong>Transaksi dibuat</strong><small>${escapeHtml(obj?.date || "-")} · Checkout Store</small></div></li><li><i></i><div><strong>Status saat ini: ${escapeHtml(labels[obj?.status] || obj?.status)}</strong><small>Terakhir diperbarui oleh sistem/admin</small></div></li><li><i></i><div><strong>Pembayaran: ${escapeHtml(labels[obj?.paymentStatus] || obj?.paymentStatus)}</strong><small>${escapeHtml(obj?.payment || "-")}</small></div></li></ul></section>
      </div>
      <aside class="form-workspace__aside"><div class="form-card"><div class="form-card__header"><strong>Ringkasan order</strong><span>Read-only</span></div><div class="form-summary-list"><div><span>Produk</span><strong>${escapeHtml(obj?.items || 0)} item</strong></div><div><span>Total</span><strong>${money(obj?.total || 0)}</strong></div><div><span>Pembayaran</span><strong>${escapeHtml(obj?.payment || "-")}</strong></div><div><span>Kurir</span><strong data-transaction-courier>${escapeHtml(obj?.courier || "-")}</strong></div></div></div><div class="form-danger-zone"><h4>Perubahan sensitif</h4><p>Pembatalan dan refund membutuhkan alasan agar audit log tetap dapat dipertanggungjawabkan.</p></div></aside>
      ${stickyActions({ primary: "Simpan Status", secondary: "Tutup" })}
    </div>`;
  };

  const patchSuiteRenderer = () => {
    const renderer = window.NEXGEAR_ADMIN_RENDER;
    if (!renderer || renderer.__workspacePatched) return;
    const original = renderer.form;
    renderer.form = (module, obj) => {
      if (module === "products") return renderProduct(obj);
      if (module === "users") return renderUser(obj);
      if (module === "transactions") return renderTransaction(obj);
      return original(module, obj);
    };
    renderer.__workspacePatched = true;
  };

  const articleField = (input, label, hint = "", full = false) => {
    const wrapper = document.createElement("label");
    wrapper.className = `form-field${full ? " form-field--full" : ""}`;
    wrapper.innerHTML = `<span class="form-field__label"><span>${label}</span><small data-counter-for="${input.id}"></small></span>`;
    wrapper.append(input);
    if (hint) wrapper.insertAdjacentHTML("beforeend", `<small class="form-field__hint">${hint}</small>`);
    return wrapper;
  };

  const buildArticleWorkspace = () => {
    const drawer = $("#editor-drawer");
    const form = $("#editor-drawer form");
    if (!drawer || !form || $(".form-workspace", form)) return;

    const fields = {
      title: $("#editor-title-input"), slug: $("#editor-slug-input"), category: $("#editor-category-input"), status: $("#editor-status-input"), excerpt: $("#editor-excerpt-input"), image: $("#editor-image-input"),
    };
    if (Object.values(fields).some((item) => !item)) return;

    fields.title.name = "title";
    fields.slug.name = "slug";
    fields.category.name = "category";
    fields.status.name = "status";
    fields.excerpt.name = "excerpt";
    fields.image.name = "image";

    const sections = [{ id: "article-content", title: "Konten", subtitle: "Judul dan naskah" }, { id: "article-media", title: "Media", subtitle: "Gambar dan aksesibilitas" }, { id: "article-classify", title: "Klasifikasi", subtitle: "Kategori dan tag" }, { id: "article-publish", title: "Publikasi", subtitle: "Status dan jadwal" }, { id: "article-seo", title: "SEO", subtitle: "Metadata pencarian" }, { id: "article-history", title: "Riwayat", subtitle: "Audit edit" }];
    const workspace = document.createElement("div");
    workspace.className = "form-workspace";
    workspace.dataset.formMode = "create";
    workspace.innerHTML = `${nav(sections)}<div class="form-workspace__main"></div><aside class="form-workspace__aside"></aside>${stickyActions({ primary: "Simpan Artikel", draft: "Simpan Draft", preview: true })}`;
    const main = $(".form-workspace__main", workspace);
    const aside = $(".form-workspace__aside", workspace);

    const contentSection = document.createElement("section");
    contentSection.className = "form-section";
    contentSection.id = "article-content";
    contentSection.dataset.requiredSection = "true";
    contentSection.innerHTML = sectionHeader("01 / Writing", "Konten utama", "Judul, slug, excerpt, dan naskah artikel disusun dalam satu alur editorial.");
    const contentGrid = document.createElement("div");
    contentGrid.className = "form-grid";
    contentGrid.append(articleField(fields.title, "Judul artikel *", "Judul yang jelas lebih berguna daripada judul yang cuma terdengar canggih.", true));
    contentGrid.append(articleField(fields.slug, "Slug", "Dibuat otomatis dari judul, tetapi masih dapat disesuaikan.", true));
    contentGrid.append(articleField(fields.excerpt, "Excerpt", "Ringkasan singkat untuk card dan metadata sosial.", true));
    const contentInput = document.createElement("textarea");
    contentInput.name = "content";
    contentInput.rows = 14;
    contentInput.placeholder = "Tulis isi artikel di sini...";
    contentGrid.insertAdjacentHTML("beforeend", textareaField({ label: "Isi artikel", name: "content", value: "", rows: 14, full: true, hint: "Perkiraan waktu baca dihitung otomatis dari jumlah kata." }));
    contentSection.append(contentGrid);

    const mediaSection = document.createElement("section");
    mediaSection.className = "form-section";
    mediaSection.id = "article-media";
    mediaSection.innerHTML = sectionHeader("02 / Media", "Featured image", "Sediakan alt text yang menjelaskan isi gambar, bukan nama file yang kebetulan panjang.");
    const mediaGrid = document.createElement("div");
    mediaGrid.className = "form-grid";
    mediaGrid.append(articleField(fields.image, "URL featured image", "Gunakan gambar horizontal berkualitas tinggi.", true));
    mediaGrid.insertAdjacentHTML("beforeend", field({ label: "Alt text", name: "imageAlt", value: "", full: true }));
    mediaSection.append(mediaGrid);

    const classifySection = document.createElement("section");
    classifySection.className = "form-section";
    classifySection.id = "article-classify";
    classifySection.innerHTML = sectionHeader("03 / Classification", "Kategori dan penulis", "Klasifikasi membantu pencarian internal dan navigasi pembaca.");
    const classifyGrid = document.createElement("div");
    classifyGrid.className = "form-grid";
    classifyGrid.append(articleField(fields.category, "Kategori"));
    classifyGrid.insertAdjacentHTML("beforeend", field({ label: "Tags", name: "tags", value: "", placeholder: "keyboard, gaming, guide" }));
    classifyGrid.insertAdjacentHTML("beforeend", field({ label: "Penulis", name: "author", value: "Admin NEXGEAR" }));
    classifyGrid.insertAdjacentHTML("beforeend", field({ label: "Estimasi baca", name: "readingDisplay", value: "0 menit", readonly: true }));
    classifySection.append(classifyGrid);

    const publishSection = document.createElement("section");
    publishSection.className = "form-section";
    publishSection.id = "article-publish";
    publishSection.dataset.requiredSection = "true";
    publishSection.innerHTML = sectionHeader("04 / Lifecycle", "Publikasi", "Draft, review, jadwal, dan publikasi harus memiliki status yang jelas.");
    const publishGrid = document.createElement("div");
    publishGrid.className = "form-grid";
    publishGrid.append(articleField(fields.status, "Status"));
    publishGrid.insertAdjacentHTML("beforeend", field({ label: "Jadwal publikasi", name: "scheduledAt", value: "", type: "datetime-local" }));
    publishGrid.insertAdjacentHTML("beforeend", selectField({ label: "Visibilitas", name: "visibility", value: "public", options: [["public", "Publik"], ["unlisted", "Tidak terdaftar"], ["internal", "Internal"]] }));
    publishGrid.insertAdjacentHTML("beforeend", toggle({ title: "Featured article", description: "Tampilkan pada area unggulan Journal.", name: "featured", checked: false }));
    publishSection.append(publishGrid);

    const seoSection = document.createElement("section");
    seoSection.className = "form-section";
    seoSection.id = "article-seo";
    seoSection.innerHTML = sectionHeader("05 / Discoverability", "SEO dan metadata", "Preview membantu menjaga judul dan deskripsi tetap masuk akal di hasil pencarian.");
    seoSection.innerHTML += `<div class="form-grid">${field({ label: "SEO title", name: "seoTitle", value: "", full: true })}${textareaField({ label: "Meta description", name: "metaDescription", value: "", rows: 3, full: true })}${field({ label: "Canonical URL", name: "canonical", value: "", type: "url", full: true })}</div>`;

    const historySection = document.createElement("section");
    historySection.className = "form-section";
    historySection.id = "article-history";
    historySection.innerHTML = `${sectionHeader("06 / Audit", "Riwayat perubahan", "Riwayat tersedia pada artikel yang sudah pernah disimpan.")}<ul class="audit-list"><li><i></i><div><strong>Versi saat ini</strong><small data-article-audit>Artikel baru · Belum disimpan</small></div></li><li><i></i><div><strong>Performa</strong><small data-article-views>0 views</small></div></li></ul>`;

    [contentSection, mediaSection, classifySection, publishSection, seoSection, historySection].forEach((section) => main.append(section));
    aside.innerHTML = `<div class="form-card"><div class="form-card__header"><strong>Preview artikel</strong><span>Live</span></div><div class="form-media-preview"><img data-article-preview alt="Preview featured image"><span class="form-media-preview__fallback">Preview belum tersedia</span></div></div><div class="form-card"><div class="form-card__header"><strong>Kualitas editorial</strong><span data-article-quality>0%</span></div><div class="form-summary-list"><div><span>Jumlah kata</span><strong data-word-count>0</strong></div><div><span>Waktu baca</span><strong data-reading-time>0 menit</strong></div><div><span>Status</span><strong data-article-status>Draft</strong></div></div></div>`;
    form.append(workspace);
  };

  const createUnsavedDialog = () => {
    if ($("#admin-unsaved-dialog")) return;
    const dialog = document.createElement("div");
    dialog.className = "unsaved-dialog";
    dialog.id = "admin-unsaved-dialog";
    dialog.hidden = true;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "admin-unsaved-title");
    dialog.innerHTML = `<div class="unsaved-dialog__card"><span class="unsaved-dialog__icon">!</span><h2 id="admin-unsaved-title">Perubahan belum disimpan</h2><p>Menutup form sekarang akan membuang perubahan pada data ini.</p><div class="unsaved-dialog__actions"><button class="btn btn-outline" type="button" data-unsaved-continue>Kembali Mengedit</button><button class="btn btn-danger" type="button" data-unsaved-discard>Buang Perubahan</button></div></div>`;
    document.body.append(dialog);
    $("[data-unsaved-continue]", dialog).addEventListener("click", () => {
      dialog.hidden = true;
      activeForm?.querySelector("input, select, textarea")?.focus();
    });
    $("[data-unsaved-discard]", dialog).addEventListener("click", () => {
      dialog.hidden = true;
      bypassCloseGuard = true;
      activeDrawer?.setAttribute("data-dirty", "false");
      const trigger = pendingCloseTrigger;
      pendingCloseTrigger = null;
      trigger?.click();
      window.setTimeout(() => { bypassCloseGuard = false; }, 0);
    });
  };

  const serializeForm = (form) => {
    const values = [];
    $$('input, select, textarea', form).forEach((control) => {
      if (!control.name || control.disabled || control.matches('[readonly][data-ignore-dirty]')) return;
      values.push([control.name, control.type === "checkbox" ? control.checked : control.value]);
    });
    return JSON.stringify(values);
  };

  const updateDirtyState = () => {
    if (!activeForm || !activeDrawer) return;
    const dirty = serializeForm(activeForm) !== initialSnapshot;
    activeDrawer.dataset.dirty = String(dirty);
    const state = $("[data-form-save-state]", activeForm);
    if (state) state.textContent = dirty ? "Perubahan belum disimpan" : "Semua perubahan tersimpan";
  };

  const updateCounters = (form) => {
    $$('textarea, input[type="text"]', form).forEach((control) => {
      const target = $(`[data-counter-for="${control.name || control.id}"]`, form) || $(`[data-counter-for="${control.id}"]`, form);
      if (target) target.textContent = `${control.value.length} karakter`;
    });
  };

  const updateCompletion = (form) => {
    const sections = $$(".form-section", form);
    let complete = 0;
    sections.forEach((section) => {
      const required = $$('[required]', section);
      const valid = required.length === 0 || required.every((control) => control.checkValidity());
      const step = $(`[data-form-target="${section.id}"]`, form);
      if (step) step.dataset.complete = String(valid);
      if (valid) complete += 1;
    });
    const percentage = sections.length ? Math.round((complete / sections.length) * 100) : 0;
    const bar = $("[data-form-progress-bar]", form);
    const label = $("[data-form-progress-label]", form);
    if (bar) bar.style.setProperty("--progress", `${percentage}%`);
    if (label) label.textContent = `${percentage}%`;
  };

  const syncProduct = (form) => {
    if (page !== "products") return;
    const price = Number(form.elements.price?.value || 0);
    const sale = Number(form.elements.salePrice?.value || 0);
    const cost = Number(form.elements.cost?.value || 0);
    const stock = Number(form.elements.stock?.value || 0);
    const minStock = Number(form.elements.minStock?.value || 0);
    const publication = form.elements.publicationStatus?.value || "draft";
    const actual = publication === "draft" || publication === "archived" ? publication : stock <= 0 ? "out" : stock <= minStock ? "low" : "active";
    if (form.elements.status) form.elements.status.value = actual;
    const active = sale > 0 && sale < price ? sale : price;
    const discount = price > 0 && active < price ? Math.round(((price - active) / price) * 100) : 0;
    const margin = active - cost;
    $("[data-price-normal]", form)?.replaceChildren(document.createTextNode(money(price)));
    $("[data-price-active]", form)?.replaceChildren(document.createTextNode(money(active)));
    $("[data-price-discount]", form)?.replaceChildren(document.createTextNode(`${discount}%`));
    $("[data-price-margin]", form)?.replaceChildren(document.createTextNode(money(margin)));
    $("[data-price-state]", form)?.replaceChildren(document.createTextNode(discount ? "Promo aktif" : "Harga normal"));
    $("[data-stock-label]", form)?.replaceChildren(document.createTextNode(actual === "out" ? "Habis" : actual === "low" ? "Menipis" : actual === "draft" ? "Draft" : actual === "archived" ? "Arsip" : "Tersedia"));
    const preview = $("[data-product-preview]", form);
    if (preview && form.elements.image) preview.src = form.elements.image.value;
  };

  const syncArticle = (form) => {
    if (page !== "articles") return;
    const content = form.elements.content?.value || "";
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const reading = Math.max(1, Math.ceil(words / 200));
    if (form.elements.readingDisplay) form.elements.readingDisplay.value = `${reading} menit`;
    $("[data-word-count]", form)?.replaceChildren(document.createTextNode(String(words)));
    $("[data-reading-time]", form)?.replaceChildren(document.createTextNode(`${reading} menit`));
    $("[data-article-status]", form)?.replaceChildren(document.createTextNode(form.elements.status?.value || "Draft"));
    const qualityFields = [form.elements.title, form.elements.excerpt, form.elements.image, form.elements.imageAlt, form.elements.content, form.elements.seoTitle, form.elements.metaDescription];
    const score = Math.round((qualityFields.filter((control) => control?.value.trim()).length / qualityFields.length) * 100);
    $("[data-article-quality]", form)?.replaceChildren(document.createTextNode(`${score}%`));
    const preview = $("[data-article-preview]", form);
    if (preview && form.elements.image) preview.src = form.elements.image.value;
  };

  const syncTransaction = (form) => {
    if (page !== "transactions") return;
    const select = form.elements.status;
    const current = $(".form-workspace", form)?.dataset.currentStatus || "waiting";
    const allowed = {
      waiting: ["waiting", "paid", "cancelled"],
      paid: ["paid", "processing", "cancelled", "refund"],
      processing: ["processing", "shipping", "cancelled", "refund"],
      shipping: ["shipping", "completed", "refund"],
      completed: ["completed", "refund"],
      cancelled: ["cancelled"],
      refund: ["refund"],
    }[current] || [current];
    Array.from(select?.options || []).forEach((option) => { option.disabled = !allowed.includes(option.value); });
    const courier = form.elements.courier?.value || "-";
    $("[data-transaction-courier]", form)?.replaceChildren(document.createTextNode(courier));
    if (select?.value === "shipping" && !form.elements.resi?.value.trim()) select.setCustomValidity("Nomor resi wajib diisi sebelum transaksi dikirim.");
    else select?.setCustomValidity("");
    if (["cancelled"].includes(select?.value) && !form.elements.cancellationReason?.value.trim()) form.elements.cancellationReason?.setCustomValidity("Alasan pembatalan wajib diisi.");
    else form.elements.cancellationReason?.setCustomValidity("");
    if (select?.value === "refund" && !form.elements.refundReason?.value.trim()) form.elements.refundReason?.setCustomValidity("Alasan refund wajib diisi.");
    else form.elements.refundReason?.setCustomValidity("");
  };

  const applyRolePreset = (form) => {
    if (page !== "users") return;
    const role = form.elements.role?.value;
    const presets = {
      admin: ["articles:view", "articles:write", "products:view", "products:write", "users:view", "users:write", "transactions:view", "transactions:write"],
      editor: ["articles:view", "articles:write", "products:view"],
      support: ["users:view", "transactions:view", "transactions:write"],
      customer: [],
    };
    const selected = presets[role] || [];
    $$('input[name="permissions"]', form).forEach((input) => { input.checked = selected.includes(input.value); });
  };

  const initializeNavigation = (form) => {
    sectionObserver?.disconnect();
    $$('[data-form-target]', form).forEach((button) => {
      button.addEventListener("click", () => {
        const section = $(`#${CSS.escape(button.dataset.formTarget)}`, form);
        section?.scrollIntoView({ behavior: "smooth", block: "start" });
        $$('[data-form-target]', form).forEach((item) => item.dataset.state = item === button ? "active" : "idle");
      });
    });
    const main = $(".form-workspace__main", form);
    if (main && "IntersectionObserver" in window) {
      sectionObserver = new IntersectionObserver((entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        $$('[data-form-target]', form).forEach((item) => item.dataset.state = item.dataset.formTarget === visible.target.id ? "active" : "idle");
      }, { root: main, threshold: [0.25, 0.55], rootMargin: "-8% 0px -62%" });
      $$(".form-section", form).forEach((section) => sectionObserver.observe(section));
    }
  };

  const hydrateArticleFields = (form, drawer) => {
    if (page !== "articles") return;
    const editing = $("#editor-title")?.textContent.includes("Edit");
    const row = editing ? document.querySelector(".article-row[data-id]") : null;
    const workspace = $(".form-workspace", form);
    workspace.dataset.formMode = editing ? "edit" : "create";
    const modeBadge = $(".form-mode-badge", drawer);
    if (modeBadge) modeBadge.textContent = editing ? "Edit mode" : "Create mode";
    const title = form.elements.title?.value || "";
    const matched = $$(".article-row").find((item) => item.querySelector("h2")?.textContent === title);
    const source = matched || row;
    ["content", "imageAlt", "tags", "author", "scheduledAt", "visibility", "seoTitle", "metaDescription", "canonical"].forEach((name) => {
      if (!form.elements[name]) return;
      const key = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
      form.elements[name].value = source?.dataset[key] || (name === "author" ? source?.dataset.author || "Admin NEXGEAR" : name === "visibility" ? "public" : "");
    });
    $("[data-article-audit]", form)?.replaceChildren(document.createTextNode(editing ? `${source?.dataset.updated || "Hari ini"} · Admin NEXGEAR` : "Artikel baru · Belum disimpan"));
    $("[data-article-views]", form)?.replaceChildren(document.createTextNode(`${source?.dataset.views || 0} views`));
  };

  const initializeForm = (drawer) => {
    const form = $("form", drawer);
    if (!form) return;
    const workspace = $(".form-workspace", form);
    if (!workspace) return;

    activeDrawer = drawer;
    activeForm = form;
    drawer.dataset.dirty = "false";
    const header = $(".suite-drawer-header > div, .editor-drawer__panel > header > div", drawer);
    if (header && !$(".form-mode-badge", header)) header.insertAdjacentHTML("beforeend", `<span class="form-mode-badge">${workspace.dataset.formMode === "create" ? "Create mode" : "Edit mode"}</span>`);

    hydrateArticleFields(form, drawer);
    initializeNavigation(form);
    updateCounters(form);
    updateCompletion(form);
    syncProduct(form);
    syncArticle(form);
    syncTransaction(form);

    $$('input, select, textarea', form).forEach((control) => {
      if (control.dataset.workspaceBound === "true") return;
      control.dataset.workspaceBound = "true";
      const sync = () => {
        updateCounters(form);
        updateCompletion(form);
        updateDirtyState();
        syncProduct(form);
        syncArticle(form);
        syncTransaction(form);
      };
      control.addEventListener("input", sync);
      control.addEventListener("change", sync);
    });

    form.elements.role?.addEventListener("change", () => { applyRolePreset(form); updateDirtyState(); });
    $("[data-advance-transaction]", form)?.addEventListener("click", () => {
      const flow = ["waiting", "paid", "processing", "shipping", "completed"];
      const select = form.elements.status;
      const index = flow.indexOf(select.value);
      if (index >= 0 && index < flow.length - 1) {
        select.value = flow[index + 1];
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
    $("[data-user-security-action='block']", form)?.addEventListener("click", () => {
      form.elements.status.value = "blocked";
      form.elements.status.dispatchEvent(new Event("change", { bubbles: true }));
    });
    $("[data-workspace-close]", form)?.addEventListener("click", () => {
      const original = $(page === "articles" ? "[data-close-editor]" : "[data-close-drawer]", drawer);
      original?.click();
    });
    $("[data-workspace-draft]", form)?.addEventListener("click", () => {
      if (page === "articles") {
        const original = $("[data-save-draft]", drawer);
        original?.click();
      } else if (page === "products") {
        form.elements.publicationStatus.value = "draft";
        syncProduct(form);
        form.requestSubmit();
      }
    });
    $("[data-workspace-preview]", form)?.addEventListener("click", () => {
      announce("Preview artikel diperbarui pada panel kanan.");
      $(".form-workspace__aside", form)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    window.setTimeout(() => {
      initialSnapshot = serializeForm(form);
      updateDirtyState();
      form.querySelector("input:not([readonly]), textarea, select")?.focus({ preventScroll: true });
    }, 90);
  };

  const observeDrawers = () => {
    const drawer = $(page === "articles" ? "#editor-drawer" : "#suite-drawer");
    if (!drawer) return;
    new MutationObserver(() => {
      if (!drawer.classList.contains("is-open")) return;
      window.setTimeout(() => initializeForm(drawer), 30);
    }).observe(drawer, { attributes: true, attributeFilter: ["class", "aria-hidden"] });
    if (page !== "articles") {
      const fields = $("#suite-form-fields", drawer);
      if (fields) new MutationObserver(() => window.setTimeout(() => initializeForm(drawer), 0)).observe(fields, { childList: true });
    }
  };

  const guardUnsavedClose = () => {
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-close-drawer], [data-close-editor], .suite-drawer-overlay, .editor-drawer__overlay");
      if (!trigger || bypassCloseGuard || !activeDrawer?.classList.contains("is-open") || activeDrawer.dataset.dirty !== "true") return;
      event.preventDefault();
      event.stopImmediatePropagation();
      pendingCloseTrigger = trigger;
      $("#admin-unsaved-dialog").hidden = false;
      $("[data-unsaved-continue]")?.focus();
    }, true);

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s" && activeDrawer?.classList.contains("is-open")) {
        event.preventDefault();
        activeForm?.requestSubmit();
        return;
      }
      if (event.key === "Escape" && activeDrawer?.classList.contains("is-open") && activeDrawer.dataset.dirty === "true" && !bypassCloseGuard) {
        event.preventDefault();
        event.stopImmediatePropagation();
        pendingCloseTrigger = $(page === "articles" ? "[data-close-editor]" : "[data-close-drawer]", activeDrawer);
        $("#admin-unsaved-dialog").hidden = false;
      }
    }, true);
  };

  const clearDirtyOnSubmit = () => {
    document.addEventListener("submit", (event) => {
      if (!event.target.closest("#suite-drawer, #editor-drawer")) return;
      event.target.closest("#suite-drawer, #editor-drawer").dataset.dirty = "false";
      initialSnapshot = serializeForm(event.target);
    }, true);
  };

  const init = () => {
    patchSuiteRenderer();
    if (page === "articles") buildArticleWorkspace();
    createUnsavedDialog();
    observeDrawers();
    guardUnsavedClose();
    clearDirtyOnSubmit();
  };

  window.NexAdminFormWorkspaces = Object.freeze({ initializeForm, renderProduct, renderUser, renderTransaction });
  init();
})();