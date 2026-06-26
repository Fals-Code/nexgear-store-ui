(function () {
  "use strict";

  if (window.NexTransactionHistory) return;

  const list = document.getElementById("history-list");
  if (!list) return;

  const ORDER_KEY = "nexgear_orders";
  const tabs = Array.from(document.querySelectorAll(".history-tab"));
  const searchInput = document.getElementById("history-search-input");
  const periodSelect = document.getElementById("history-period");
  const sortSelect = document.getElementById("history-sort");
  const visibleCount = document.getElementById("history-visible-count");
  const emptyState = document.getElementById("history-empty");
  const resetButton = document.getElementById("history-reset");
  const loadMoreButton = document.getElementById("history-load-more");
  const pageSize = 4;

  let selectedStatus = "all";
  let expandedList = false;
  let cards = [];

  function parseOrders() {
    try {
      const value = JSON.parse(localStorage.getItem(ORDER_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function saveOrders(orders) {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
    } catch {
      // UI tetap berubah ketika persistence browser dibatasi.
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function money(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function dateLabel(value) {
    const date = new Date(value || Date.now());
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date).replace("pukul", "·");
  }

  function dateKey(value) {
    const date = new Date(value || Date.now());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function baseName(value) {
    return String(value || "Produk NEXGEAR").split(" - ")[0].trim();
  }

  function normalizeStatus(order) {
    const status = normalize(order.status);
    const payment = normalize(order.paymentStatus);
    if (["cancelled", "canceled"].includes(status)) return "cancelled";
    if (["completed", "delivered"].includes(status)) return "completed";
    if (["shipping", "shipped", "out-for-delivery"].includes(status)) return "shipping";
    if (status === "processing" || payment === "paid") return "processing";
    return "waiting";
  }

  function statusMeta(status) {
    return {
      waiting: { label: "Menunggu Pembayaran", className: "status-waiting" },
      processing: { label: "Sedang Diproses", className: "status-processing" },
      shipping: { label: "Dalam Pengiriman", className: "status-shipping" },
      completed: { label: "Selesai", className: "status-completed" },
      cancelled: { label: "Dibatalkan", className: "status-cancelled" },
    }[status] || { label: "Menunggu Pembayaran", className: "status-waiting" };
  }

  function actionTemplate(order, status) {
    const id = encodeURIComponent(order.id);
    if (status === "waiting") {
      return `<button type="button" class="btn btn-ghost-danger btn-sm" data-cancel-order>Batalkan</button><a href="payment.html?order=${id}" class="btn btn-primary btn-sm">Bayar Sekarang</a>`;
    }
    if (["processing", "shipping"].includes(status)) {
      return `<a href="track-order.html?order=${id}" class="btn btn-primary btn-sm">Lacak Pesanan</a>`;
    }
    if (status === "completed") {
      return `<a href="track-order.html?order=${id}" class="btn btn-outline btn-sm">Lihat Perjalanan</a><a href="catalog.html" class="btn btn-primary btn-sm">Beli Lagi</a>`;
    }
    return `<a href="catalog.html" class="btn btn-primary btn-sm">Cari Produk Serupa</a>`;
  }

  function persistedCardTemplate(order) {
    const status = normalizeStatus(order);
    const meta = statusMeta(status);
    const items = Array.isArray(order.items) ? order.items : [];
    const first = items[0] || {};
    const firstName = baseName(first.name);
    const quantity = Math.max(1, Number(first.qty) || 1);
    const remaining = Math.max(0, items.length - 1);
    const image = first.image || "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=180&q=82";
    const detailId = `detail-${String(order.id).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const address = [
      order.address?.line,
      order.address?.district,
      order.address?.city,
      order.address?.province,
      order.address?.postalCode,
    ].filter(Boolean).join(", ") || "Alamat pengiriman belum tersedia";
    const eta = order.fulfillment?.etaLabel || "Estimasi mengikuti metode pengiriman";
    const searchText = [order.id, ...items.map((item) => item.name), order.customer?.name].filter(Boolean).join(" ");

    return `
      <article class="transaction-card reveal" data-persisted-order="true" data-status="${status}" data-date="${dateKey(order.createdAt)}" data-total="${Number(order.total) || 0}" data-search="${escapeHtml(normalize(searchText))}">
        <header class="transaction-card__header">
          <div>
            <span class="persona-history-badge">Pesanan dari checkout</span>
            <span class="transaction-label">Nomor Pesanan</span>
            <h2>${escapeHtml(order.id)}</h2>
            <time datetime="${escapeHtml(order.createdAt || "")}">${escapeHtml(dateLabel(order.createdAt))}</time>
          </div>
          <span class="transaction-status ${meta.className}"><i aria-hidden="true"></i>${meta.label}</span>
        </header>
        <div class="transaction-card__body">
          <div class="transaction-product">
            <img src="${escapeHtml(image)}" alt="${escapeHtml(firstName)}">
            <div>
              <h3>${escapeHtml(firstName)}</h3>
              <p>${remaining ? `+${remaining} produk lainnya` : escapeHtml(first.variant || "Gaming gear")}</p>
              <span>${quantity} × ${money(first.price)}</span>
            </div>
          </div>
          <dl class="transaction-payment">
            <div><dt>Pembayaran</dt><dd>${escapeHtml(order.payment?.label || "Belum dipilih")}</dd></div>
            <div><dt>Total Pesanan</dt><dd>${money(order.total)}</dd></div>
          </dl>
        </div>
        <footer class="transaction-card__footer">
          <button type="button" class="btn btn-outline btn-sm transaction-detail-toggle" aria-expanded="false" aria-controls="${detailId}">Lihat Detail</button>
          ${actionTemplate(order, status)}
        </footer>
        <div class="transaction-detail" id="${detailId}" hidden>
          <div class="transaction-detail__grid">
            <div><span>Alamat Pengiriman</span><strong>${escapeHtml(order.customer?.name || "Pelanggan NEXGEAR")}</strong><p>${escapeHtml(address)}</p></div>
            <div><span>Kurir & Estimasi</span><strong>${escapeHtml(order.shipping?.label || "Reguler")}</strong><p>${escapeHtml(eta)} · ${order.shippingFee ? money(order.shippingFee) : "Gratis ongkir"}</p></div>
          </div>
          <div class="mini-timeline" aria-label="Progres pesanan">
            <div class="${status !== "waiting" && status !== "cancelled" ? "done" : status === "waiting" ? "active" : ""}"><i aria-hidden="true"></i><span>Diterima</span></div>
            <div class="${["processing", "shipping", "completed"].includes(status) ? (status === "processing" ? "active" : "done") : ""}"><i aria-hidden="true"></i><span>Diproses</span></div>
            <div class="${["shipping", "completed"].includes(status) ? (status === "shipping" ? "active" : "done") : ""}"><i aria-hidden="true"></i><span>Dikirim</span></div>
            <div class="${status === "completed" ? "active" : ""}"><i aria-hidden="true"></i><span>Selesai</span></div>
          </div>
        </div>
      </article>`;
  }

  function hydratePersistedOrders() {
    const existingIds = new Set(
      Array.from(list.querySelectorAll(".transaction-card h2")).map((heading) => heading.textContent.trim()),
    );
    parseOrders()
      .filter((order) => order?.id && !existingIds.has(order.id))
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .forEach((order) => list.insertAdjacentHTML("afterbegin", persistedCardTemplate(order)));
    cards = Array.from(list.querySelectorAll(".transaction-card"));
  }

  function getPeriodStart(days) {
    if (days === "all") return null;
    const numericDays = Number(days);
    if (!Number.isFinite(numericDays) || !cards.length) return null;
    const newestOrderDate = Math.max(
      ...cards.map((card) => new Date(`${card.dataset.date}T23:59:59`).getTime()),
    );
    return newestOrderDate - numericDays * 24 * 60 * 60 * 1000;
  }

  function matchesFilters(card) {
    const statusMatches = selectedStatus === "all" || card.dataset.status === selectedStatus;
    const query = normalize(searchInput.value);
    const searchMatches = !query || normalize(card.dataset.search).includes(query);
    const periodStart = getPeriodStart(periodSelect.value);
    const cardDate = new Date(`${card.dataset.date}T12:00:00`).getTime();
    const periodMatches = periodStart === null || cardDate >= periodStart;
    return statusMatches && searchMatches && periodMatches;
  }

  function sortCards() {
    const mode = sortSelect.value;
    const sorted = [...cards].sort((a, b) => {
      if (mode === "oldest") return new Date(a.dataset.date) - new Date(b.dataset.date);
      if (mode === "highest") return Number(b.dataset.total) - Number(a.dataset.total);
      return new Date(b.dataset.date) - new Date(a.dataset.date);
    });
    sorted.forEach((card) => list.appendChild(card));
  }

  function closeCardDetail(card) {
    const toggle = card.querySelector(".transaction-detail-toggle");
    if (!toggle) return;
    const panel = document.getElementById(toggle.getAttribute("aria-controls"));
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Lihat Detail";
    if (panel) panel.hidden = true;
  }

  function hydrateTrackingLinks() {
    cards.forEach((card) => {
      const orderNumber = card.querySelector(".transaction-card__header h2")?.textContent?.trim();
      const trackLink = card.querySelector('a[href^="track-order.html"]');
      if (!orderNumber || !trackLink) return;
      trackLink.href = `track-order.html?order=${encodeURIComponent(orderNumber)}`;
      trackLink.setAttribute("aria-label", `Lacak pesanan ${orderNumber}`);
    });
  }

  function updateTabCounts() {
    tabs.forEach((tab) => {
      const status = tab.dataset.status || "all";
      const count = status === "all" ? cards.length : cards.filter((card) => card.dataset.status === status).length;
      const output = tab.querySelector("span");
      if (output) output.textContent = String(count);
    });
  }

  function render() {
    sortCards();
    const matchingCards = cards.filter(matchesFilters);
    const visibleCards = expandedList ? matchingCards : matchingCards.slice(0, pageSize);
    cards.forEach((card) => {
      const shouldShow = visibleCards.includes(card);
      card.hidden = !shouldShow;
      if (!shouldShow) closeCardDetail(card);
    });
    visibleCount.textContent = String(visibleCards.length);
    emptyState.hidden = matchingCards.length !== 0;
    loadMoreButton.hidden = matchingCards.length <= pageSize || expandedList;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });
      selectedStatus = tab.dataset.status || "all";
      expandedList = false;
      render();
    });
  });

  searchInput.addEventListener("input", () => {
    expandedList = false;
    render();
  });
  periodSelect.addEventListener("change", () => {
    expandedList = false;
    render();
  });
  sortSelect.addEventListener("change", render);

  list.addEventListener("click", (event) => {
    const toggle = event.target.closest(".transaction-detail-toggle");
    if (toggle) {
      const card = toggle.closest(".transaction-card");
      const panelId = toggle.getAttribute("aria-controls");
      const panel = document.getElementById(panelId);
      const willOpen = toggle.getAttribute("aria-expanded") !== "true";
      cards.forEach((item) => {
        if (item !== card) closeCardDetail(item);
      });
      toggle.setAttribute("aria-expanded", String(willOpen));
      toggle.textContent = willOpen ? "Tutup Detail" : "Lihat Detail";
      if (panel) panel.hidden = !willOpen;
      return;
    }

    const cancelButton = event.target.closest("[data-cancel-order]");
    if (!cancelButton) return;
    const card = cancelButton.closest(".transaction-card");
    const orderNumber = card.querySelector(".transaction-card__header h2")?.textContent || "pesanan ini";
    const confirmed = window.confirm(`Batalkan ${orderNumber}? Tindakan ini hanya simulasi pada prototype.`);
    if (!confirmed) return;

    card.dataset.status = "cancelled";
    const badge = card.querySelector(".transaction-status");
    badge.className = "transaction-status status-cancelled";
    badge.innerHTML = '<i aria-hidden="true"></i>Dibatalkan';
    const paymentValue = card.querySelector(".transaction-payment div:first-child dd");
    if (paymentValue) paymentValue.textContent = "Dibatalkan";
    cancelButton.remove();
    const payButton = card.querySelector('a[href^="payment.html"], a[href="checkout.html"]');
    if (payButton) {
      payButton.href = "catalog.html";
      payButton.textContent = "Cari Produk Serupa";
    }

    if (card.dataset.persistedOrder === "true") {
      const orders = parseOrders();
      const index = orders.findIndex((order) => order.id === orderNumber);
      if (index >= 0) {
        orders[index] = {
          ...orders[index],
          status: "cancelled",
          paymentStatus: "cancelled",
          cancelledAt: new Date().toISOString(),
          cancelReason: "Dibatalkan customer melalui riwayat transaksi.",
        };
        saveOrders(orders);
      }
    }

    selectedStatus = "all";
    tabs.forEach((tab) => {
      const active = tab.dataset.status === "all";
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    updateTabCounts();
    render();
  });

  resetButton.addEventListener("click", () => {
    selectedStatus = "all";
    expandedList = false;
    searchInput.value = "";
    periodSelect.value = "all";
    sortSelect.value = "newest";
    tabs.forEach((tab) => {
      const active = tab.dataset.status === "all";
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });
    render();
    searchInput.focus();
  });

  loadMoreButton.addEventListener("click", () => {
    expandedList = true;
    render();
    const firstPreviouslyHidden = cards.filter(matchesFilters)[pageSize];
    if (firstPreviouslyHidden) firstPreviouslyHidden.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  hydratePersistedOrders();
  hydrateTrackingLinks();
  updateTabCounts();
  render();

  window.NexTransactionHistory = Object.freeze({
    render,
    refresh() {
      hydratePersistedOrders();
      hydrateTrackingLinks();
      updateTabCounts();
      render();
    },
    get count() {
      return cards.length;
    },
  });
})();
