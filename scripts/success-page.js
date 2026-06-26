(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const KEYS = { pending: "nexgear_pending_order", orders: "nexgear_orders" };
  const images = {
    "Vortex VX Pro Mechanical":
      "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=420",
    "Logitech G Pro X Superlight":
      "https://www.cravingtech.com/blog/wp-content/uploads/2021/05/Logitech-G-PRO-X-SUPERLIGHT-Review-5.jpg",
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
  const layout = $("#success-layout"),
    empty = $("#success-empty");
  let order = loadOrder();
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
      orders.find((item) => item.id === id) ||
      ((!id || pending?.id === id) && pending) ||
      null
    );
  }
  function money(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }
  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function baseName(value) {
    return String(value || "")
      .split(" - ")[0]
      .trim();
  }
  function date(value, withTime = false) {
    if (!value) return "-";
    const options = withTime
      ? {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      : { day: "2-digit", month: "short", year: "numeric" };
    return new Intl.DateTimeFormat("id-ID", options).format(new Date(value));
  }
  function addDays(value, days) {
    const result = new Date(value);
    result.setDate(result.getDate() + days);
    return result;
  }
  function shippingDays() {
    const code = order.shipping?.code;
    return code === "same-day" ? 0 : code === "next-day" ? 1 : 3;
  }
  function renderItems() {
    const items = Array.isArray(order.items) ? order.items : [],
      visible = items.slice(0, 4);
    $("#success-items").innerHTML =
      visible
        .map((item) => {
          const name = baseName(item.name),
            qty = Math.max(1, Number(item.qty) || 1),
            image = esc(
              item.image ||
                images[name] ||
                "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=420&q=82",
            );
          return `<article class="success-item"><img src="${image}" alt="${esc(name)}"><div><h3>${esc(name)}</h3><p>${qty} × ${money(item.price)}</p></div><strong>${money((Number(item.price) || 0) * qty)}</strong></article>`;
        })
        .join("") +
      (items.length > 4
        ? `<p class="success-items__more">+${items.length - 4} produk lainnya</p>`
        : "");
  }
  function renderSummary() {
    const paidAt = order.paidAt || order.updatedAt || order.createdAt,
      days = shippingDays(),
      arrival = addDays(paidAt || Date.now(), days),
      pickup = addDays(paidAt || Date.now(), days === 0 ? 0 : 1);
    $("#success-order-id").textContent = order.id;
    $("#success-order-date").textContent = date(order.createdAt);
    $("#success-payment-method").textContent = order.payment?.label || "PAID";
    $("#success-subtotal").textContent = money(order.subtotal);
    $("#success-shipping").textContent = order.shippingFee
      ? money(order.shippingFee)
      : "Gratis";
    $("#success-shipping-label").textContent =
      order.shipping?.label || "Reguler";
    $("#success-insurance-row").hidden = !order.insuranceFee;
    $("#success-insurance").textContent = money(order.insuranceFee);
    $("#success-discount-row").hidden = !order.discount;
    $("#success-discount").textContent = `−${money(order.discount)}`;
    $("#success-total").textContent = money(order.total);
    $("#success-customer-name").textContent =
      order.customer?.name || "Pelanggan NEXGEAR";
    $("#success-address-text").textContent =
      [
        order.address?.line,
        order.address?.district,
        order.address?.city,
        order.address?.province,
        order.address?.postalCode,
      ]
        .filter(Boolean)
        .join(", ") || "Alamat pengiriman belum tersedia";
    $("#success-courier-label").textContent =
      order.shipping?.label || "Reguler";
    $("#success-email").textContent =
      order.customer?.email || "email pelanggan";
    $("#success-paid-time").textContent = date(paidAt, true);
    $("#success-shipping-window").textContent = `Diperkirakan ${date(pickup)}`;
    $("#success-arrival-date").textContent =
      days === 0 ? "Diperkirakan hari ini" : `Diperkirakan ${date(arrival)}`;
    $("#success-estimate-badge").textContent =
      days === 0
        ? "Estimasi hari ini"
        : days === 1
          ? "Estimasi 1 hari"
          : "Estimasi 2–3 hari";
    $("#success-confirmation-message").textContent =
      `Pembayaran ${money(order.total)} melalui ${order.payment?.label || "metode terpilih"} telah diterima. Pesanan sedang diteruskan ke tim pemenuhan.`;
    $("#success-track-link").href =
      `track-order.html?order=${encodeURIComponent(order.id)}`;
    renderItems();
  }
  function copyOrder() {
    const button = $("#success-copy-order"),
      value = order.id,
      done = () => {
        const original = button.innerHTML;
        button.textContent = "Tersalin ✓";
        setTimeout(() => (button.innerHTML = original), 1200);
      };
    if (navigator.clipboard?.writeText)
      navigator.clipboard.writeText(value).then(done).catch(done);
    else done();
  }
  function persistProcessing() {
    if (order.paymentStatus !== "paid") return;
    let changed = false;
    if (order.status === "waiting") {
      order.status = "processing";
      changed = true;
    }
    if (!order.updatedAt) {
      order.updatedAt = new Date().toISOString();
      changed = true;
    }
    if (!changed) return;
    localStorage.setItem(KEYS.pending, JSON.stringify(order));
    const orders = parse(KEYS.orders, []),
      index = orders.findIndex((item) => item.id === order.id);
    if (index >= 0) {
      orders[index] = order;
      localStorage.setItem(KEYS.orders, JSON.stringify(orders));
    }
  }
  function init() {
    if (!order) {
      layout.hidden = true;
      empty.hidden = false;
      return;
    }
    if (
      order.paymentStatus !== "paid" &&
      order.status !== "processing" &&
      order.status !== "shipped" &&
      order.status !== "completed"
    ) {
      location.replace(`payment.html?order=${encodeURIComponent(order.id)}`);
      return;
    }
    empty.hidden = true;
    layout.hidden = false;
    persistProcessing();
    renderSummary();
    $("#success-copy-order").addEventListener("click", copyOrder);
    $("#success-print-order").addEventListener("click", () => window.print());
  }
  init();
})();
