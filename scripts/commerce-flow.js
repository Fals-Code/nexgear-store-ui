(function () {
  "use strict";

  const CART_KEY = "nexgear_cart";
  const CART_INIT_KEY = "nexgear_cart_initialized";
  const ORDERS_KEY = "nexgear_orders";
  const LAST_ORDER_KEY = "nexgear_last_order_id";

  const DEFAULT_CART = [
    {
      id: "vortex-vx-pro-mechanical",
      name: "Vortex VX Pro Mechanical",
      category: "Control",
      variant: "Linear Red Switch",
      price: 1850000,
      qty: 1,
      image:
        "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=640",
    },
    {
      id: "logitech-g-pro-x-superlight",
      name: "Logitech G Pro X Superlight",
      category: "Control",
      variant: "Hitam",
      price: 2150000,
      qty: 1,
      image:
        "https://www.cravingtech.com/blog/wp-content/uploads/2021/05/Logitech-G-PRO-X-SUPERLIGHT-Review-5.jpg",
    },
  ];

  const PRODUCT_FALLBACKS = [
    {
      match: "vortex",
      id: "vortex-vx-pro-mechanical",
      category: "Control",
      image:
        "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=640",
    },
    {
      match: "logitech",
      id: "logitech-g-pro-x-superlight",
      category: "Control",
      image:
        "https://www.cravingtech.com/blog/wp-content/uploads/2021/05/Logitech-G-PRO-X-SUPERLIGHT-Review-5.jpg",
    },
    {
      match: "arctis",
      id: "arctis-nova-pro-wireless",
      category: "Sound",
      image:
        "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=640&q=85",
    },
    {
      match: "pulsefire",
      id: "hyperx-pulsefire-haste",
      category: "Control",
      image:
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c?auto=format&fit=crop&w=640&q=85",
    },
    {
      match: "artisan",
      id: "artisan-zero-fx-xl",
      category: "Control",
      image:
        "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=640&q=85",
    },
  ];

  function safeParse(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getFallback(name) {
    const normalized = String(name || "").toLowerCase();
    return (
      PRODUCT_FALLBACKS.find((product) => normalized.includes(product.match)) || {
        id: normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product",
        category: "Gaming Gear",
        image:
          "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=640&q=85",
      }
    );
  }

  function normalizeCartItem(item) {
    const fallback = getFallback(item?.name);
    return {
      id: item?.id || fallback.id,
      name: item?.name || "NEXGEAR Product",
      category: item?.category || fallback.category,
      variant: item?.variant || "Standard",
      price: Math.max(0, Number(item?.price) || 0),
      qty: Math.min(10, Math.max(1, Number(item?.qty) || 1)),
      image: item?.image || fallback.image,
    };
  }

  function getCart() {
    const stored = safeParse(localStorage.getItem(CART_KEY), []);
    return Array.isArray(stored) ? stored.map(normalizeCartItem) : [];
  }

  function saveCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items.map(normalizeCartItem)));
    localStorage.setItem(CART_INIT_KEY, "true");
    window.NexCart?.updateBadge?.();
    window.dispatchEvent(new CustomEvent("nexgear:cart-updated", { detail: { items } }));
  }

  function seedCartForDemo() {
    const initialized = localStorage.getItem(CART_INIT_KEY) === "true";
    const cart = getCart();
    if (!initialized && cart.length === 0) {
      saveCart(DEFAULT_CART);
      return DEFAULT_CART.map(normalizeCartItem);
    }
    return cart;
  }

  function getOrders() {
    const orders = safeParse(localStorage.getItem(ORDERS_KEY), []);
    return Array.isArray(orders) ? orders : [];
  }

  function saveOrders(orders) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function createOrderId() {
    const stamp = Date.now().toString(36).toUpperCase().slice(-7);
    const random = Math.random().toString(36).toUpperCase().slice(2, 5);
    return `NEX-${stamp}${random}`;
  }

  function calculateSummary(items, shippingCost) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const insurance = items.length ? 15000 : 0;
    return {
      subtotal,
      shipping: Number(shippingCost) || 0,
      insurance,
      total: subtotal + (Number(shippingCost) || 0) + insurance,
    };
  }

  function initCartPage() {
    const list = document.getElementById("cart-items");
    if (!list) return;

    const subtotalEl = document.getElementById("cart-subtotal");
    const shippingEl = document.getElementById("cart-shipping");
    const totalEl = document.getElementById("cart-total");
    const countEl = document.getElementById("cart-count");
    const checkoutLink = document.getElementById("cart-checkout-link");
    let items = seedCartForDemo();

    function render() {
      items = getCart();
      if (!items.length) {
        list.innerHTML = `
          <div class="cart-empty-state" role="status">
            <span aria-hidden="true">⌁</span>
            <h3>Keranjang masih kosong</h3>
            <p>Pilih gear dari katalog sebelum checkout. Ternyata halaman pembayaran memang membutuhkan barang, mengejutkan sekali.</p>
            <a class="btn btn-primary" href="catalog.html">Jelajahi Katalog</a>
          </div>`;
      } else {
        list.innerHTML = items
          .map(
            (item) => `
            <article class="cart-item" data-cart-id="${escapeHtml(item.id)}">
              <div class="cart-item-image">
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">
              </div>
              <div class="cart-item-info">
                <span class="product-cat">${escapeHtml(item.category)}</span>
                <a href="product-detail.html"><h3>${escapeHtml(item.name)}</h3></a>
                <p>${escapeHtml(item.variant)}</p>
                <div class="cart-item-actions">
                  <div class="quantity-selector" aria-label="Jumlah ${escapeHtml(item.name)}">
                    <button class="qty-btn" type="button" data-cart-action="minus" aria-label="Kurangi jumlah">−</button>
                    <input class="qty-input" type="number" min="1" max="10" value="${item.qty}" aria-label="Jumlah produk">
                    <button class="qty-btn" type="button" data-cart-action="plus" aria-label="Tambah jumlah">+</button>
                  </div>
                  <button class="btn-remove" type="button" data-cart-action="remove">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    Hapus
                  </button>
                </div>
              </div>
              <div class="cart-item-price">${formatRupiah(item.price * item.qty)}</div>
            </article>`,
          )
          .join("");
      }

      const summary = calculateSummary(items, items.length ? 20000 : 0);
      if (countEl) countEl.textContent = String(items.reduce((sum, item) => sum + item.qty, 0));
      if (subtotalEl) subtotalEl.textContent = formatRupiah(summary.subtotal);
      if (shippingEl) shippingEl.textContent = items.length ? formatRupiah(summary.shipping) : "Rp0";
      if (totalEl) totalEl.textContent = formatRupiah(summary.subtotal + summary.shipping);
      if (checkoutLink) {
        checkoutLink.classList.toggle("is-disabled", items.length === 0);
        checkoutLink.setAttribute("aria-disabled", String(items.length === 0));
        checkoutLink.tabIndex = items.length ? 0 : -1;
      }
    }

    list.addEventListener("click", (event) => {
      const button = event.target.closest("[data-cart-action]");
      if (!button) return;
      const card = button.closest("[data-cart-id]");
      const item = items.find((entry) => entry.id === card?.dataset.cartId);
      if (!item) return;

      const action = button.dataset.cartAction;
      if (action === "plus") item.qty = Math.min(10, item.qty + 1);
      if (action === "minus") item.qty = Math.max(1, item.qty - 1);
      if (action === "remove") items = items.filter((entry) => entry.id !== item.id);
      saveCart(items);
      render();
    });

    list.addEventListener("change", (event) => {
      if (!event.target.matches(".qty-input")) return;
      const card = event.target.closest("[data-cart-id]");
      const item = items.find((entry) => entry.id === card?.dataset.cartId);
      if (!item) return;
      item.qty = Math.min(10, Math.max(1, Number(event.target.value) || 1));
      saveCart(items);
      render();
    });

    checkoutLink?.addEventListener("click", (event) => {
      if (!items.length) event.preventDefault();
    });

    render();
  }

  function initCheckoutPage() {
    const form = document.getElementById("checkout-form");
    const summaryItems = document.getElementById("checkout-summary-items");
    if (!form || !summaryItems) return;

    const submitButton = document.getElementById("checkout-submit");
    const subtotalEl = document.getElementById("checkout-subtotal");
    const shippingEl = document.getElementById("checkout-shipping");
    const insuranceEl = document.getElementById("checkout-insurance");
    const totalEl = document.getElementById("checkout-total");
    const emptyState = document.getElementById("checkout-empty");
    const items = getCart();

    function getShippingCost() {
      return Number(form.querySelector('input[name="shipping"]:checked')?.dataset.cost) || 0;
    }

    function renderSummary() {
      const summary = calculateSummary(items, getShippingCost());
      summaryItems.innerHTML = items
        .map(
          (item) => `
          <div class="s-item">
            <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">
            <div class="s-item-info">
              <h4>${escapeHtml(item.name)}</h4>
              <span>${item.qty} × ${formatRupiah(item.price)}</span>
            </div>
          </div>`,
        )
        .join("");
      subtotalEl.textContent = formatRupiah(summary.subtotal);
      shippingEl.textContent = formatRupiah(summary.shipping);
      insuranceEl.textContent = formatRupiah(summary.insurance);
      totalEl.textContent = formatRupiah(summary.total);
      emptyState.hidden = items.length > 0;
      submitButton.disabled = items.length === 0;
      submitButton.setAttribute("aria-disabled", String(items.length === 0));
    }

    form.addEventListener("change", (event) => {
      if (event.target.name === "shipping") renderSummary();
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!items.length) return;
      if (!form.reportValidity()) return;

      const formData = new FormData(form);
      const shippingCost = getShippingCost();
      const summary = calculateSummary(items, shippingCost);
      const paymentMethod = String(formData.get("payment") || "Virtual Account BCA");
      const paidImmediately = paymentMethod.includes("Kartu") || paymentMethod.includes("QRIS");
      const now = new Date();
      const order = {
        id: createOrderId(),
        customer: {
          name: String(formData.get("name") || "Customer NEXGEAR"),
          phone: String(formData.get("phone") || ""),
          email: String(formData.get("email") || ""),
          address: String(formData.get("address") || ""),
          province: String(formData.get("province") || ""),
          city: String(formData.get("city") || ""),
          district: String(formData.get("district") || ""),
          postalCode: String(formData.get("postalCode") || ""),
        },
        date: now.toISOString(),
        items,
        shippingMethod: String(formData.get("shippingLabel") || form.querySelector('input[name="shipping"]:checked')?.dataset.label || "Reguler"),
        shippingCost,
        paymentMethod,
        paymentStatus: paidImmediately ? "paid" : "waiting",
        status: paidImmediately ? "processing" : "waiting",
        subtotal: summary.subtotal,
        insurance: summary.insurance,
        total: summary.total,
      };

      const orders = getOrders();
      orders.unshift(order);
      saveOrders(orders);
      localStorage.setItem(LAST_ORDER_KEY, order.id);
      saveCart([]);
      window.location.href = `success.html?order=${encodeURIComponent(order.id)}`;
    });

    renderSummary();
  }

  function findOrderFromPage() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("order") || localStorage.getItem(LAST_ORDER_KEY);
    return getOrders().find((order) => order.id === id) || null;
  }

  function initSuccessPage() {
    const card = document.getElementById("success-order-card");
    if (!card) return;
    const order = findOrderFromPage();
    const missing = document.getElementById("success-missing-order");

    if (!order) {
      card.hidden = true;
      missing.hidden = false;
      return;
    }

    const dateText = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(order.date));

    document.getElementById("success-order-id").textContent = order.id;
    document.getElementById("success-order-date").textContent = dateText;
    document.getElementById("success-payment-status").textContent =
      order.paymentStatus === "paid"
        ? `Lunas (${order.paymentMethod})`
        : `Menunggu Pembayaran (${order.paymentMethod})`;
    document.getElementById("success-payment-status").className =
      order.paymentStatus === "paid" ? "status-badge paid" : "status-badge waiting";
    document.getElementById("success-items").innerHTML = order.items
      .map(
        (item) => `
        <div class="s-item">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" loading="lazy">
          <div class="s-item-info">
            <h4>${escapeHtml(item.name)}</h4>
            <span>${item.qty} × ${formatRupiah(item.price)}</span>
          </div>
        </div>`,
      )
      .join("");
    document.getElementById("success-order-total").textContent = formatRupiah(order.total);
  }

  function historyStatus(order) {
    const values = {
      waiting: ["waiting", "Menunggu Pembayaran"],
      processing: ["processing", "Sedang Diproses"],
      shipping: ["shipping", "Dalam Pengiriman"],
      completed: ["completed", "Selesai"],
      cancelled: ["cancelled", "Dibatalkan"],
    };
    return values[order.status] || values.processing;
  }

  function initHistoryPage() {
    const list = document.getElementById("history-list");
    if (!list) return;
    const orders = getOrders();
    if (!orders.length) return;

    orders
      .slice()
      .reverse()
      .forEach((order) => {
        if (list.querySelector(`[data-order-id="${CSS.escape(order.id)}"]`)) return;
        const [statusKey, statusLabel] = historyStatus(order);
        const firstItem = order.items[0];
        const otherCount = Math.max(0, order.items.length - 1);
        const dateValue = new Date(order.date).toISOString().slice(0, 10);
        const dateText = new Intl.DateTimeFormat("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(order.date));
        const detailId = `detail-${order.id.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const searchText = `${order.id} ${order.items.map((item) => item.name).join(" ")}`.toLowerCase();
        const card = document.createElement("article");
        card.className = "transaction-card reveal active";
        card.dataset.orderId = order.id;
        card.dataset.status = statusKey;
        card.dataset.date = dateValue;
        card.dataset.total = String(order.total);
        card.dataset.search = searchText;
        card.innerHTML = `
          <header class="transaction-card__header">
            <div><span class="transaction-label">Nomor Pesanan</span><h2>${escapeHtml(order.id)}</h2><time datetime="${escapeHtml(order.date)}">${escapeHtml(dateText)}</time></div>
            <span class="transaction-status status-${statusKey}"><i aria-hidden="true"></i>${statusLabel}</span>
          </header>
          <div class="transaction-card__body">
            <div class="transaction-product">
              <img src="${escapeHtml(firstItem?.image)}" alt="${escapeHtml(firstItem?.name)}">
              <div><h3>${escapeHtml(firstItem?.name || "Pesanan NEXGEAR")}</h3><p>${escapeHtml(firstItem?.category || "Gaming Gear")}${otherCount ? ` · +${otherCount} produk lainnya` : ""}</p><span>${order.items.reduce((sum, item) => sum + item.qty, 0)} produk dalam pesanan</span></div>
            </div>
            <dl class="transaction-payment"><div><dt>Pembayaran</dt><dd>${escapeHtml(order.paymentMethod)}</dd></div><div><dt>Total Pesanan</dt><dd>${formatRupiah(order.total)}</dd></div></dl>
          </div>
          <footer class="transaction-card__footer">
            <button type="button" class="btn btn-outline btn-sm transaction-detail-toggle" aria-expanded="false" aria-controls="${detailId}">Lihat Detail</button>
            ${statusKey === "waiting" ? '<a href="checkout.html" class="btn btn-primary btn-sm">Bayar Sekarang</a>' : '<a href="track-order.html" class="btn btn-primary btn-sm">Lacak Pesanan</a>'}
          </footer>
          <div class="transaction-detail" id="${detailId}" hidden>
            <div class="transaction-detail__grid"><div><span>Alamat Pengiriman</span><strong>${escapeHtml(order.customer.name)}</strong><p>${escapeHtml(`${order.customer.address}, ${order.customer.city} ${order.customer.postalCode}`)}</p></div><div><span>Metode Pengiriman</span><strong>${escapeHtml(order.shippingMethod)}</strong><p>${statusLabel} · ${escapeHtml(order.paymentMethod)}</p></div></div>
          </div>`;
        list.prepend(card);
      });

    const allCards = Array.from(list.querySelectorAll(".transaction-card"));
    const totals = allCards.reduce(
      (result, card) => {
        result.total += Number(card.dataset.total) || 0;
        if (!["completed", "cancelled"].includes(card.dataset.status)) result.active += 1;
        return result;
      },
      { total: 0, active: 0 },
    );
    const statValues = document.querySelectorAll(".history-stat-card strong");
    if (statValues[0]) statValues[0].textContent = String(allCards.length);
    if (statValues[1]) statValues[1].textContent = String(totals.active);
    if (statValues[2]) statValues[2].textContent = formatRupiah(totals.total).replace("Rp", "Rp");

    document.querySelectorAll(".history-tab").forEach((tab) => {
      const count = allCards.filter(
        (card) => tab.dataset.status === "all" || card.dataset.status === tab.dataset.status,
      ).length;
      const countEl = tab.querySelector("span");
      if (countEl) countEl.textContent = String(count);
    });
  }

  const pageInitializers = {
    "cart.html": initCartPage,
    "checkout.html": initCheckoutPage,
    "success.html": initSuccessPage,
    "transaction-history.html": initHistoryPage,
  };

  function init() {
    const page = window.location.pathname.split("/").pop() || "index.html";
    pageInitializers[page]?.();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.NexCommerce = Object.freeze({
    getCart,
    saveCart,
    getOrders,
    formatRupiah,
  });
})();
