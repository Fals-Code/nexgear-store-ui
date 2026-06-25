(function () {
  "use strict";

  const cart = window.NexCart;
  const list = document.getElementById("cart-items");
  const emptyState = document.getElementById("cart-empty-state");
  const summary = document.getElementById("cart-summary");
  const liveCount = document.getElementById("cart-live-count");
  const subtotalLabel = document.getElementById("cart-subtotal-label");
  const subtotalValue = document.getElementById("cart-subtotal");
  const shippingValue = document.getElementById("cart-shipping");
  const discountRow = document.getElementById("cart-discount-row");
  const discountValue = document.getElementById("cart-discount");
  const totalValue = document.getElementById("cart-total");
  const checkoutLink = document.getElementById("cart-checkout-link");
  const clearButton = document.getElementById("cart-clear");
  const shippingPanel = document.getElementById("shipping-progress-panel");
  const shippingMessage = document.getElementById("shipping-progress-message");
  const shippingPercent = document.getElementById("shipping-progress-value");
  const shippingBar = document.getElementById("shipping-progress-bar");
  const promoForm = document.getElementById("cart-promo-form");
  const promoInput = document.getElementById("cart-promo-input");
  const promoStatus = document.getElementById("cart-promo-status");
  const mobileTotal = document.getElementById("cart-mobile-total");
  const mobileCheckout = document.getElementById("cart-mobile-checkout");
  const recommendationButtons = document.querySelectorAll("[data-cart-recommendation]");

  if (!cart || !list) return;

  const FREE_SHIPPING_THRESHOLD = 3000000;
  const SHIPPING_FEE = 20000;
  const PROMO_CODE = "NEX10";
  const PROMO_MAX_DISCOUNT = 250000;
  const PROMO_STORAGE_KEY = "nexgear_cart_promo";

  const productMeta = {
    "Vortex VX Pro Mechanical": {
      category: "Control",
      stock: "Ready stock",
      warranty: "Garansi 2 tahun",
      image:
        "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=800",
      href: "product-detail.html?id=vortex-vx-pro-mechanical",
    },
    "Logitech G Pro X Superlight": {
      category: "Control",
      stock: "Ready stock",
      warranty: "Garansi 1 tahun",
      image:
        "https://www.cravingtech.com/blog/wp-content/uploads/2021/05/Logitech-G-PRO-X-SUPERLIGHT-Review-5.jpg",
      href: "product-detail.html?id=logitech-g-pro-x-superlight",
    },
    "Astro A50 Wireless Gen 4": {
      category: "Sound",
      stock: "Stok terbatas",
      warranty: "Garansi 1 tahun",
      image:
        "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6349/6349970cv18d.jpg",
      href: "product-detail.html?id=astro-a50-wireless-gen-4",
    },
    "Zephyrus G14 RTX 4060": {
      category: "Machines",
      stock: "Ready stock",
      warranty: "Garansi 2 tahun",
      image:
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=82",
      href: "product-detail.html?id=zephyrus-g14-rtx-4060",
    },
    "HyperX Pulsefire Haste": {
      category: "Control",
      stock: "Ready stock",
      warranty: "Garansi 1 tahun",
      image:
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c?auto=format&fit=crop&w=800&q=82",
      href: "product-detail.html?id=hyperx-pulsefire-haste",
    },
    "Arctis Nova Pro Wireless": {
      category: "Sound",
      stock: "Stok terbatas",
      warranty: "Garansi 1 tahun",
      image:
        "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=800&q=82",
      href: "product-detail.html?id=arctis-nova-pro-wireless",
    },
    "Artisan Zero FX XL": {
      category: "Control",
      stock: "Ready stock",
      warranty: "Jaminan 30 hari",
      image:
        "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=800&q=82",
      href: "product-detail.html?id=artisan-zero-fx-xl",
    },
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=82";

  let activePromo = localStorage.getItem(PROMO_STORAGE_KEY) === PROMO_CODE;

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getBaseName(name) {
    return String(name || "").split(" - ")[0].trim();
  }

  function getVariant(name) {
    const parts = String(name || "").split(" - ");
    return parts.length > 1 ? parts.slice(1).join(" - ") : "Varian standar";
  }

  function itemTemplate(item, index) {
    const baseName = getBaseName(item.name);
    const meta = productMeta[baseName] || {};
    const safeName = escapeHtml(baseName);
    const safeFullName = escapeHtml(item.name);
    const safeVariant = escapeHtml(item.variant || getVariant(item.name));
    const safeCategory = escapeHtml(item.category || meta.category || "Gaming Gear");
    const safeStock = escapeHtml(item.stock || meta.stock || "Ready stock");
    const safeWarranty = escapeHtml(item.warranty || meta.warranty || "Garansi resmi");
    const safeImage = escapeHtml(item.image || meta.image || fallbackImage);
    const safeHref = escapeHtml(item.href || meta.href || "catalog.html");
    const quantity = Math.max(1, Number(item.qty) || 1);
    const unitPrice = Number(item.price) || 0;
    const lineTotal = unitPrice * quantity;

    return `
      <article class="cart-item cart-item--dynamic" data-cart-name="${safeFullName}" style="animation-delay:${Math.min(index * 55, 220)}ms">
        <a class="cart-item-image" href="${safeHref}" aria-label="Lihat ${safeName}">
          <img src="${safeImage}" alt="${safeName}" loading="lazy">
        </a>
        <div class="cart-item-info">
          <span class="product-cat">${safeCategory}</span>
          <a href="${safeHref}"><h3>${safeName}</h3></a>
          <p>${safeVariant}</p>
          <div class="cart-item-meta" aria-label="Informasi produk">
            <span class="cart-meta-chip"><i aria-hidden="true"></i>${safeStock}</span>
            <span class="cart-meta-chip">${safeWarranty}</span>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-selector" aria-label="Jumlah ${safeName}">
              <button class="qty-btn" type="button" data-cart-decrease aria-label="Kurangi jumlah ${safeName}" ${quantity <= 1 ? "disabled" : ""}>−</button>
              <input class="qty-input" type="number" min="1" max="10" value="${quantity}" inputmode="numeric" aria-label="Jumlah ${safeName}">
              <button class="qty-btn" type="button" data-cart-increase aria-label="Tambah jumlah ${safeName}" ${quantity >= 10 ? "disabled" : ""}>+</button>
            </div>
            <button class="btn-remove" type="button" data-cart-remove>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Hapus
            </button>
            <span class="cart-unit-price">${formatRupiah(unitPrice)} / item</span>
          </div>
        </div>
        <div class="cart-item-price" aria-label="Subtotal ${safeName}">
          <span>Line Total</span>
          <strong>${formatRupiah(lineTotal)}</strong>
        </div>
      </article>
    `;
  }

  function calculateSummary(items) {
    const itemCount = items.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
      0,
    );
    const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_FEE : 0;
    const discount = activePromo
      ? Math.min(Math.round(subtotal * 0.1), PROMO_MAX_DISCOUNT)
      : 0;

    return {
      itemCount,
      subtotal,
      shipping,
      discount,
      total: Math.max(0, subtotal + shipping - discount),
    };
  }

  function updateCheckoutLink(link, enabled) {
    if (!link) return;
    link.classList.toggle("is-disabled", !enabled);
    link.setAttribute("aria-disabled", String(!enabled));
    link.tabIndex = enabled ? 0 : -1;
    if (enabled) {
      link.href = "checkout.html";
    } else {
      link.removeAttribute("href");
    }
  }

  function updateShippingProgress(subtotal) {
    const progress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
    const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
    const complete = subtotal >= FREE_SHIPPING_THRESHOLD;

    shippingBar.style.width = `${progress}%`;
    shippingPercent.textContent = `${progress}%`;
    shippingPanel.classList.toggle("is-complete", complete);

    if (complete) {
      shippingMessage.textContent = "Gratis ongkir berhasil dibuka";
    } else if (subtotal > 0) {
      shippingMessage.textContent = `Tambah ${formatRupiah(remaining)} lagi untuk gratis ongkir`;
    } else {
      shippingMessage.textContent = "Tambahkan gear untuk membuka gratis ongkir";
    }
  }

  function updatePromoDisplay(totals) {
    discountRow.hidden = !activePromo || totals.discount <= 0;
    discountValue.textContent = `−${formatRupiah(totals.discount)}`;
    promoInput.value = activePromo ? PROMO_CODE : "";

    if (activePromo) {
      promoStatus.textContent = `Promo ${PROMO_CODE} aktif. Kamu menghemat ${formatRupiah(totals.discount)}.`;
      promoStatus.className = "promo-status is-success";
    } else if (!promoStatus.classList.contains("is-error")) {
      promoStatus.textContent = "Diskon 10% maksimal Rp250.000.";
      promoStatus.className = "promo-status";
    }
  }

  function render() {
    const items = cart.items;
    const isEmpty = items.length === 0;

    list.innerHTML = items.map(itemTemplate).join("");
    emptyState.hidden = !isEmpty;
    summary.classList.toggle("cart-summary--empty", isEmpty);
    clearButton.hidden = isEmpty;

    const totals = calculateSummary(items);
    const itemText = totals.itemCount === 1 ? "1 item" : `${totals.itemCount} items`;
    liveCount.textContent = itemText;
    subtotalLabel.textContent = `Subtotal (${totals.itemCount} Item)`;
    subtotalValue.textContent = formatRupiah(totals.subtotal);
    shippingValue.textContent = totals.shipping ? formatRupiah(totals.shipping) : "Gratis";
    totalValue.textContent = formatRupiah(totals.total);
    mobileTotal.textContent = formatRupiah(totals.total);

    updateShippingProgress(totals.subtotal);
    updatePromoDisplay(totals);
    updateCheckoutLink(checkoutLink, !isEmpty);
    updateCheckoutLink(mobileCheckout, !isEmpty);
    cart.updateBadge();
  }

  function updateQuantity(name, value) {
    const items = cart.items;
    const target = items.find((item) => item.name === name);
    if (!target) return;

    target.qty = Math.min(10, Math.max(1, Number(value) || 1));
    cart.save(items);
    render();
  }

  list.addEventListener("click", (event) => {
    const itemElement = event.target.closest("[data-cart-name]");
    if (!itemElement) return;

    const name = itemElement.dataset.cartName;
    const current = cart.items.find((item) => item.name === name);
    if (!current) return;

    if (event.target.closest("[data-cart-increase]")) {
      updateQuantity(name, (Number(current.qty) || 1) + 1);
      return;
    }

    if (event.target.closest("[data-cart-decrease]")) {
      updateQuantity(name, (Number(current.qty) || 1) - 1);
      return;
    }

    if (event.target.closest("[data-cart-remove]")) {
      cart.remove(name);
      render();
      window.showNexToast?.(`${getBaseName(name)} dihapus dari keranjang`);
    }
  });

  list.addEventListener("change", (event) => {
    if (!event.target.matches(".qty-input")) return;
    const itemElement = event.target.closest("[data-cart-name]");
    if (!itemElement) return;
    updateQuantity(itemElement.dataset.cartName, event.target.value);
  });

  clearButton.addEventListener("click", () => {
    cart.clear();
    activePromo = false;
    localStorage.removeItem(PROMO_STORAGE_KEY);
    promoStatus.className = "promo-status";
    render();
    window.showNexToast?.("Keranjang dikosongkan");
  });

  promoForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const code = promoInput.value.trim().toUpperCase();

    if (!cart.items.length) {
      promoStatus.textContent = "Tambahkan produk sebelum menggunakan promo.";
      promoStatus.className = "promo-status is-error";
      return;
    }

    if (code === PROMO_CODE) {
      activePromo = true;
      localStorage.setItem(PROMO_STORAGE_KEY, PROMO_CODE);
      promoStatus.className = "promo-status is-success";
      render();
      window.showNexToast?.(`Promo ${PROMO_CODE} berhasil digunakan`);
      return;
    }

    activePromo = false;
    localStorage.removeItem(PROMO_STORAGE_KEY);
    promoStatus.textContent = "Kode promo tidak dikenali. Gunakan NEX10.";
    promoStatus.className = "promo-status is-error";
    render();
  });

  recommendationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const name = button.dataset.name;
      const price = Number(button.dataset.price) || 0;
      cart.add({ name, price, silent: true });
      render();

      const previousText = button.textContent;
      button.textContent = "Ditambahkan ✓";
      button.disabled = true;
      window.showNexToast?.(`${name} ditambahkan ke keranjang`);

      window.setTimeout(() => {
        button.textContent = previousText;
        button.disabled = false;
      }, 1000);
    });
  });

  [checkoutLink, mobileCheckout].forEach((link) => {
    link?.addEventListener("click", (event) => {
      if (link.getAttribute("aria-disabled") === "true") {
        event.preventDefault();
      }
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key === "nexgear_cart") render();
  });

  render();
})();
