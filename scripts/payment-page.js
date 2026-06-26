(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const KEYS = {
    pending: "nexgear_pending_order",
    orders: "nexgear_orders",
    cart: "nexgear_cart",
    promo: "nexgear_cart_promo",
  };
  const methods = {
    "bca-va": {
      label: "Virtual Account BCA",
      short: "BCA",
      subtitle:
        "Transfer melalui nomor virtual account dan verifikasi otomatis.",
    },
    qris: {
      label: "GoPay / QRIS",
      short: "QR",
      subtitle:
        "Pindai QR menggunakan aplikasi pembayaran yang mendukung QRIS.",
    },
    card: {
      label: "Kartu Kredit / Debit",
      short: "CARD",
      subtitle: "Otorisasi pembayaran kartu secara aman dalam simulasi UI.",
    },
  };
  const images = {
    "Vortex VX Pro Mechanical":
      "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=420",
    "Astro A50 Wireless Gen 4":
      "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6349/6349970cv18d.jpg",
    "Zephyrus G14 RTX 4060":
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=420&q=82",
    "HyperX Pulsefire Haste":
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c?auto=format&fit=crop&w=420&q=82",
    "Arctis Nova Pro Wireless":
      "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=420&q=82",
    "Artisan Zero FX XL":
      "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=420&q=82",
    "NVIDIA RTX 4080 Super":
      "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=420&q=82",
  };
  let order = loadOrder(),
    timer = null,
    verifying = false;
  function parse(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }
  function loadOrder() {
    const id = new URLSearchParams(location.search).get("order"),
      pending = parse(KEYS.pending, null),
      orders = parse(KEYS.orders, []);
    return (
      orders.find((x) => x.id === id) ||
      ((!id || pending?.id === id) && pending) ||
      null
    );
  }
  function money(v) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(v) || 0);
  }
  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function nameOf(v) {
    return String(v || "")
      .split(" - ")[0]
      .trim();
  }
  function hash(v) {
    let h = 2166136261;
    for (const c of String(v)) {
      h ^= c.charCodeAt(0);
      h = Math.imul(h, 16777619);
    }
    return Math.abs(h >>> 0);
  }
  function persist() {
    localStorage.setItem(KEYS.pending, JSON.stringify(order));
    const orders = parse(KEYS.orders, []),
      i = orders.findIndex((x) => x.id === order.id);
    if (i >= 0) orders[i] = order;
    else orders.unshift(order);
    localStorage.setItem(KEYS.orders, JSON.stringify(orders));
  }
  function ensureDeadline() {
    if (
      !order.paymentDeadline ||
      new Date(order.paymentDeadline) <= new Date(order.createdAt || 0)
    ) {
      order.paymentDeadline = new Date(Date.now() + 864e5).toISOString();
      persist();
    }
  }
  function deadlineLabel() {
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(new Date(order.paymentDeadline));
  }
  function va() {
    const n = String(hash(order.id)).padStart(12, "0").slice(0, 12);
    return `8808 ${n.slice(0, 4)} ${n.slice(4, 8)} ${n.slice(8, 12)}`;
  }
  function qr() {
    const size = 21,
      seed = hash(order.id + order.total);
    let cells = "";
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const finder =
          (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13);
        const border =
          finder && (x % 7 === 0 || y % 7 === 0 || x % 7 === 6 || y % 7 === 6);
        const inner =
          finder && x % 7 >= 2 && x % 7 <= 4 && y % 7 >= 2 && y % 7 <= 4;
        const bit = ((seed + x * 31 + y * 17 + x * y * 7) >> (x + y) % 16) & 1;
        if (border || inner || (!finder && bit))
          cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      }
    return `<svg viewBox="0 0 21 21" aria-label="QR pembayaran simulasi"><rect width="21" height="21" fill="#fff"/><g fill="#071018">${cells}</g></svg>`;
  }
  function renderSummary() {
    $("#payment-order-id").textContent = order.id;
    $("#payment-subtotal").textContent = money(order.subtotal);
    $("#payment-shipping").textContent = order.shippingFee
      ? money(order.shippingFee)
      : "Gratis";
    $("#payment-shipping-label").textContent =
      order.shipping?.label || "Reguler";
    $("#payment-total").textContent = money(order.total);
    $("#payment-mobile-total").textContent = money(order.total);
    $("#payment-insurance-row").hidden = !order.insuranceFee;
    $("#payment-insurance").textContent = money(order.insuranceFee);
    $("#payment-discount-row").hidden = !order.discount;
    $("#payment-discount").textContent = `−${money(order.discount)}`;
    $("#payment-customer-name").textContent =
      order.customer?.name || "Pelanggan NEXGEAR";
    $("#payment-address").textContent = [
      order.address?.line,
      order.address?.district,
      order.address?.city,
      order.address?.province,
      order.address?.postalCode,
    ]
      .filter(Boolean)
      .join(", ");
    $("#payment-courier").textContent = order.shipping?.label || "Reguler";
    const items = order.items || [];
    $("#payment-summary-items").innerHTML =
      items
        .slice(0, 3)
        .map((item) => {
          const n = nameOf(item.name),
            q = Math.max(1, Number(item.qty) || 1),
            img = esc(
              item.image ||
                images[n] ||
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=420&q=82",
            );
          return `<article class="payment-summary-item"><img src="${img}" alt="${esc(n)}"><div><h3>${esc(n)}</h3><p>${q} × ${money(item.price)}</p></div><strong>${money((Number(item.price) || 0) * q)}</strong></article>`;
        })
        .join("") +
      (items.length > 3
        ? `<p class="payment-summary-overflow">+${items.length - 3} produk lainnya</p>`
        : "");
  }
  function status(type, title, desc) {
    const pill = $("#payment-status-pill");
    pill.className = `payment-status-pill is-${type}`;
    const label = {
      waiting: "Menunggu Pembayaran",
      verifying: "Memverifikasi Pembayaran",
      success: "Pembayaran Berhasil",
      expired: "Pembayaran Kedaluwarsa",
    }[type];
    pill.innerHTML = `<i></i>${label}`;
    $("#payment-workspace-title").textContent = title;
    $("#payment-status-description").textContent = desc;
  }
  function guide(list) {
    $("#payment-instructions").innerHTML = list
      .map(
        (x, i) =>
          `<div class="payment-instruction"><span>${String(i + 1).padStart(2, "0")}</span><div><strong>${esc(x[0])}</strong><small>${esc(x[1])}</small></div></div>`,
      )
      .join("");
  }
  function commonBanner(code) {
    const m = methods[code];
    return `<div class="payment-channel-banner"><span class="payment-channel-logo ${code === "qris" ? "is-qris" : code === "card" ? "is-card" : ""}">${m.short}</span><div><strong>${m.label}</strong><small>${m.subtitle}</small></div></div>`;
  }
  function renderVA() {
    const number = va();
    $("#payment-method-content").innerHTML =
      `<div class="payment-va-layout">${commonBanner("bca-va")}<div class="payment-copy-box"><div><span>NOMOR VIRTUAL ACCOUNT</span><strong>${number}</strong><small>Gunakan seluruh angka tanpa mengubah nominal.</small></div><button type="button" data-copy="${number.replaceAll(" ", "")}">Salin Nomor</button></div><div class="payment-amount-focus"><div><span>TOTAL PEMBAYARAN</span><strong>${money(order.total)}</strong></div><small>Transfer dengan nominal tepat agar verifikasi berjalan otomatis.</small></div><div class="payment-action-row"><button class="payment-primary-action" type="button" data-confirm>Saya Sudah Membayar</button><button class="payment-secondary-action" type="button" data-open-modal>Ganti Metode</button></div></div>`;
    guide([
      [
        "Buka aplikasi BCA",
        "Gunakan BCA mobile, myBCA, KlikBCA, atau ATM BCA.",
      ],
      ["Pilih Virtual Account", "Masukkan nomor virtual account yang tertera."],
      ["Periksa nominal", "Pastikan jumlah sama dengan total pesanan."],
      [
        "Konfirmasi transaksi",
        "Selesaikan transfer lalu kembali untuk verifikasi.",
      ],
    ]);
  }
  function renderQR() {
    $("#payment-method-content").innerHTML =
      `<div class="payment-qris-layout"><div class="payment-qr-shell"><div>${qr()}<p class="payment-qr-caption">QRIS · ${esc(order.id)}</p></div></div><div class="payment-qris-copy">${commonBanner("qris")}<h3>Pindai untuk membayar</h3><p>Gunakan GoPay, mobile banking, atau aplikasi lain yang mendukung QRIS.</p><div class="payment-amount-focus"><div><span>TOTAL PEMBAYARAN</span><strong>${money(order.total)}</strong></div><small>QR berlaku sampai batas pembayaran berakhir.</small></div><div class="payment-action-row"><button class="payment-primary-action" type="button" data-confirm>Saya Sudah Membayar</button><button class="payment-secondary-action" type="button" data-open-modal>Ganti Metode</button></div></div></div>`;
    guide([
      ["Buka aplikasi pembayaran", "Gunakan aplikasi yang mendukung QRIS."],
      ["Pindai QR", "Arahkan kamera ke kode pada layar."],
      ["Periksa nominal", "Pastikan nominal sesuai total pesanan."],
      ["Selesaikan pembayaran", "Masukkan PIN lalu kembali untuk verifikasi."],
    ]);
  }
  function renderCard() {
    $("#payment-method-content").innerHTML =
      `<div class="payment-card-layout"><div class="payment-card-preview"><div class="payment-card-preview__top"><span class="payment-card-chip"></span><span>NEXGEAR SECURE CARD</span></div><div class="payment-card-number">•••• •••• •••• 4242</div><div class="payment-card-preview__bottom"><div><small>CARD HOLDER</small><strong>${esc((order.customer?.name || "NEXGEAR USER").toUpperCase())}</strong></div><div><small>AUTH MODE</small><strong>SIMULATION</strong></div></div></div><div class="payment-va-layout">${commonBanner("card")}<div class="payment-amount-focus"><div><span>TOTAL PEMBAYARAN</span><strong>${money(order.total)}</strong></div><small>Detail kartu tidak disimpan. Otorisasi ini hanya simulasi antarmuka.</small></div><div class="payment-action-row"><button class="payment-primary-action" type="button" data-confirm>Otorisasi Pembayaran</button><button class="payment-secondary-action" type="button" data-open-modal>Ganti Metode</button></div></div></div>`;
    guide([
      [
        "Periksa total pembayaran",
        "Pastikan nominal sesuai ringkasan pesanan.",
      ],
      ["Mulai otorisasi", "Tekan tombol Otorisasi Pembayaran."],
      ["Tunggu verifikasi", "Sistem mensimulasikan validasi transaksi."],
      [
        "Lanjutkan pesanan",
        "Setelah berhasil, pesanan masuk proses pemenuhan.",
      ],
    ]);
  }
  function renderMethod() {
    const code = methods[order.payment?.code] ? order.payment.code : "bca-va";
    order.payment = { code, label: methods[code].label };
    $("#payment-method-title").textContent = methods[code].label;
    $("#payment-method-subtitle").textContent = methods[code].subtitle;
    $$("[data-payment-method]").forEach((b) =>
      b.classList.toggle("is-active", b.dataset.paymentMethod === code),
    );
    if (code === "qris") renderQR();
    else if (code === "card") renderCard();
    else renderVA();
    $("#payment-mobile-action").textContent =
      code === "card" ? "Otorisasi →" : "Saya Sudah Bayar →";
  }
  function updateMethod(code) {
    if (!methods[code]) return;
    order.payment = { code, label: methods[code].label };
    order.paymentStatus = "waiting";
    order.status = "waiting";
    order.paymentDeadline = new Date(Date.now() + 864e5).toISOString();
    persist();
    closeModal();
    status(
      "waiting",
      "Selesaikan transaksi kamu",
      "Gunakan instruksi berikut sesuai metode yang dipilih saat checkout.",
    );
    renderMethod();
    startCountdown();
  }
  function copyText(value, button) {
    const done = () => {
      const old = button.textContent;
      button.textContent = "Tersalin ✓";
      setTimeout(() => (button.textContent = old), 1100);
    };
    navigator.clipboard?.writeText(value).then(done).catch(done);
  }
  function verify() {
    if (verifying || order.paymentStatus === "paid") return;
    verifying = true;
    status(
      "verifying",
      "Memverifikasi pembayaran",
      "Mohon tunggu sampai proses validasi selesai.",
    );
    $("#payment-method-content").innerHTML =
      `<div class="payment-verifying"><div><div class="payment-verifying__orb"></div><h3>Memverifikasi pembayaran</h3><p>Sistem sedang mencocokkan nominal dan identitas transaksi. Menekan tombol berkali-kali tidak membuat bank bekerja lebih cepat.</p></div></div>`;
    $("#payment-mobile-action").disabled = true;
    $("#payment-change-method").disabled = true;
    setTimeout(() => {
      order.paymentStatus = "paid";
      order.status = "processing";
      order.paidAt = new Date().toISOString();
      persist();
      localStorage.setItem(KEYS.cart, "[]");
      localStorage.removeItem(KEYS.promo);
      window.NexCart?.updateBadge?.();
      status(
        "success",
        "Pembayaran berhasil",
        "Pesanan telah dikonfirmasi dan segera diproses.",
      );
      setTimeout(
        () =>
          (location.href = `success.html?order=${encodeURIComponent(order.id)}`),
        1500,
      );
    }, 1500);
  }
  function expire() {
    clearInterval(timer);
    order.paymentStatus = "expired";
    persist();
    status(
      "expired",
      "Batas pembayaran berakhir",
      "Pilih metode pembayaran baru untuk melanjutkan.",
    );
    $("#payment-method-content").innerHTML =
      `<div class="payment-verifying"><div><h3>Pembayaran kedaluwarsa</h3><p>Pesanan tetap tersimpan. Pilih metode baru untuk membuat instruksi dan batas waktu baru.</p><button class="payment-primary-action" type="button" data-open-modal>Ganti Metode Pembayaran</button></div></div>`;
    $("#payment-mobile-action").disabled = true;
  }
  function startCountdown() {
    clearInterval(timer);
    $("#payment-deadline-label").textContent = deadlineLabel();
    const tick = () => {
      const diff = new Date(order.paymentDeadline) - Date.now();
      if (diff <= 0) {
        $("#payment-countdown").textContent = "00:00:00";
        expire();
        return;
      }
      const h = Math.floor(diff / 36e5),
        m = Math.floor((diff % 36e5) / 6e4),
        s = Math.floor((diff % 6e4) / 1e3);
      $("#payment-countdown").textContent = [h, m, s]
        .map((v) => String(v).padStart(2, "0"))
        .join(":");
    };
    tick();
    timer = setInterval(tick, 1000);
  }
  function openModal() {
    $("#payment-method-modal").hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    $("#payment-method-modal").hidden = true;
    document.body.style.overflow = "";
  }
  document.addEventListener("click", (e) => {
    const c = e.target.closest("[data-copy]");
    if (c) copyText(c.dataset.copy, c);
    if (e.target.closest("[data-confirm]")) verify();
    if (e.target.closest("[data-open-modal]")) openModal();
    if (e.target.closest("[data-close-payment-modal]")) closeModal();
    const m = e.target.closest("[data-payment-method]");
    if (m) updateMethod(m.dataset.paymentMethod);
  });
  $("#payment-change-method").addEventListener("click", openModal);
  $("#payment-mobile-action").addEventListener("click", verify);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
  if (!order) {
    $("#payment-layout").hidden = true;
    $("#payment-empty").hidden = false;
    $("#payment-mobile-action").disabled = true;
    return;
  }
  $("#payment-empty").hidden = true;
  $("#payment-layout").hidden = false;
  ensureDeadline();
  renderSummary();
  renderMethod();
  if (order.paymentStatus === "paid") {
    status("success", "Pembayaran berhasil", "Pesanan telah dikonfirmasi.");
    $("#payment-mobile-action").textContent = "Lihat Pesanan →";
  } else startCountdown();
})();
