window.NEXGEAR_ADMIN_RENDER = (() => {
  "use strict";

  const statusStyles = {
    active: "pill-green",
    draft: "pill-gray",
    low: "pill-yellow",
    out: "pill-red",
    archived: "pill-purple",
    invited: "pill-cyan",
    verified: "pill-cyan",
    inactive: "pill-gray",
    blocked: "pill-red",
    customer: "pill-cyan",
    admin: "pill-purple",
    editor: "pill-yellow",
    support: "pill-green",
    waiting: "pill-yellow",
    paid: "pill-cyan",
    processing: "pill-purple",
    shipping: "pill-cyan",
    completed: "pill-green",
    cancelled: "pill-red",
    refund: "pill-orange",
  };

  const labels = {
    active: "Aktif",
    draft: "Draft",
    low: "Stok Menipis",
    out: "Habis",
    archived: "Arsip",
    invited: "Diundang",
    verified: "Verifikasi",
    inactive: "Tidak Aktif",
    blocked: "Diblokir",
    customer: "Customer",
    admin: "Admin",
    editor: "Editor",
    support: "Support",
    waiting: "Menunggu",
    paid: "Dibayar",
    processing: "Diproses",
    shipping: "Dikirim",
    completed: "Selesai",
    cancelled: "Dibatalkan",
    refund: "Refund",
  };

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const money = (value) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

  const date = (value) => new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));

  const initials = (name) => String(name || "NX")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const pill = (key, text) => `<span class="suite-pill ${statusStyles[key] || "pill-gray"}"><i></i>${escapeHtml(text || labels[key] || key)}</span>`;

  function row(page, item) {
    if (page === "products") {
      return `<tr class="suite-row" data-id="${escapeHtml(item.id)}"><td data-label="Pilih" data-card-select><input class="suite-check" type="checkbox" aria-label="Pilih ${escapeHtml(item.name)}"></td><td data-label="Produk" data-card-primary><div class="entity-cell"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.altText || item.name)}"><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.id)}</small></div></div></td><td data-label="Kategori">${escapeHtml(item.category)}</td><td data-label="Brand">${escapeHtml(item.brand)}</td><td data-label="Harga">${money(item.salePrice > 0 ? item.salePrice : item.price)}</td><td data-label="Stok">${escapeHtml(item.stock)}</td><td data-label="Status" data-card-status>${pill(item.status)}</td><td data-label="Update">${date(item.updated)}</td><td data-label="Aksi" data-card-actions><button class="suite-action" type="button" data-menu aria-label="Buka aksi untuk ${escapeHtml(item.name)}">•••</button></td></tr>`;
    }

    if (page === "users") {
      return `<tr class="suite-row" data-id="${escapeHtml(item.id)}"><td data-label="Pilih" data-card-select><input class="suite-check" type="checkbox" aria-label="Pilih ${escapeHtml(item.name)}"></td><td data-label="Pengguna" data-card-primary><div class="entity-cell"><span class="entity-avatar">${initials(item.name)}</span><div><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.email)} · ${escapeHtml(item.id)}</small></div></div></td><td data-label="Role">${pill(item.role)}</td><td data-label="Status" data-card-status>${pill(item.status)}</td><td data-label="Pesanan">${escapeHtml(item.orders)}</td><td data-label="Total Belanja">${money(item.spent)}</td><td data-label="Terakhir Aktif">${escapeHtml(item.last)}</td><td data-label="Bergabung">${date(item.joined)}</td><td data-label="Aksi" data-card-actions><button class="suite-action" type="button" data-menu aria-label="Buka aksi untuk ${escapeHtml(item.name)}">•••</button></td></tr>`;
    }

    return `<tr class="suite-row" data-id="${escapeHtml(item.id)}"><td data-label="Pilih" data-card-select><input class="suite-check" type="checkbox" aria-label="Pilih ${escapeHtml(item.id)}"></td><td data-label="Nomor Pesanan" data-card-primary><strong>${escapeHtml(item.id)}</strong></td><td data-label="Pelanggan"><div class="entity-cell" style="min-width:220px"><span class="entity-avatar">${initials(item.customer)}</span><div><strong>${escapeHtml(item.customer)}</strong><small>${escapeHtml(item.email)}</small></div></div></td><td data-label="Tanggal">${date(item.date)}</td><td data-label="Produk">${escapeHtml(item.items)} produk</td><td data-label="Pembayaran"><small>${escapeHtml(item.payment)}</small><br>${pill(item.paymentStatus)}</td><td data-label="Total">${money(item.total)}</td><td data-label="Status" data-card-status>${pill(item.status)}</td><td data-label="Aksi" data-card-actions><button class="suite-action" type="button" data-menu aria-label="Buka aksi untuk ${escapeHtml(item.id)}">•••</button></td></tr>`;
  }

  function card(page, item) {
    if (page === "products") {
      return `<article class="suite-card" data-id="${escapeHtml(item.id)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.altText || item.name)}"><div class="suite-card-body"><div class="suite-card-meta">${pill(item.status)}<span>${escapeHtml(item.stock)} stok</span></div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.id)} · ${escapeHtml(item.category)} · ${escapeHtml(item.brand)}</p><div class="suite-card-footer"><strong>${money(item.salePrice > 0 ? item.salePrice : item.price)}</strong><button class="suite-action" type="button" data-menu aria-label="Aksi ${escapeHtml(item.name)}">•••</button></div></div></article>`;
    }

    if (page === "users") {
      return `<article class="suite-card" data-id="${escapeHtml(item.id)}"><div class="suite-card-body"><div class="suite-card-meta"><span class="entity-avatar">${initials(item.name)}</span>${pill(item.status)}</div><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.email)}</p><div class="suite-card-footer"><span>${escapeHtml(item.orders)} pesanan · ${money(item.spent)}</span><button class="suite-action" type="button" data-menu aria-label="Aksi ${escapeHtml(item.name)}">•••</button></div></div></article>`;
    }

    return `<article class="suite-card" data-id="${escapeHtml(item.id)}"><div class="suite-card-body"><div class="suite-card-meta">${pill(item.status)}<span>${date(item.date)}</span></div><h3>${escapeHtml(item.id)}</h3><p>${escapeHtml(item.customer)} · ${escapeHtml(item.items)} produk · ${escapeHtml(item.payment)}</p><div class="suite-card-footer"><strong>${money(item.total)}</strong><button class="suite-action" type="button" data-menu aria-label="Aksi ${escapeHtml(item.id)}">•••</button></div></div></article>`;
  }

  function fallbackForm(page, object) {
    if (page === "products") {
      return `<div class="suite-form-grid"><label>Nama Produk<input name="name" value="${escapeHtml(object?.name || "")}" required></label><label>SKU<input name="id" value="${escapeHtml(object?.id || `NX-${Date.now().toString().slice(-6)}`)}" required></label><label>Kategori<select name="category"><option>Control</option><option>Sound</option><option>Machines</option><option>Build</option></select></label><label>Brand<input name="brand" value="${escapeHtml(object?.brand || "NEXGEAR")}"></label><label>Harga<input name="price" type="number" min="0" value="${escapeHtml(object?.price || 0)}"></label><label>Stok<input name="stock" type="number" min="0" value="${escapeHtml(object?.stock || 0)}"></label></div><label>Status<select name="status">${["active", "draft", "low", "out", "archived"].map((key) => `<option value="${key}" ${object?.status === key ? "selected" : ""}>${labels[key]}</option>`).join("")}</select></label><label>URL Gambar<input name="image" value="${escapeHtml(object?.image || window.NEXGEAR_ADMIN_DATA.products[0].image)}"></label>`;
    }
    if (page === "users") {
      return `<div class="suite-form-grid"><label>Nama<input name="name" value="${escapeHtml(object?.name || "")}" required></label><label>Email<input name="email" type="email" value="${escapeHtml(object?.email || "")}" required></label><label>Role<select name="role">${["customer", "admin", "editor", "support"].map((key) => `<option value="${key}" ${object?.role === key ? "selected" : ""}>${labels[key]}</option>`).join("")}</select></label><label>Status<select name="status">${["invited", "active", "verified", "inactive", "blocked"].map((key) => `<option value="${key}" ${object?.status === key ? "selected" : ""}>${labels[key]}</option>`).join("")}</select></label></div>`;
    }
    return `<label>Status Pesanan<select name="status">${["waiting", "paid", "processing", "shipping", "completed", "cancelled", "refund"].map((key) => `<option value="${key}" ${object?.status === key ? "selected" : ""}>${labels[key]}</option>`).join("")}</select></label>`;
  }

  return { labels, money, date, pill, row, card, form: fallbackForm };
})();
