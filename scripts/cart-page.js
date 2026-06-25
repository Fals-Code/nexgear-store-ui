(function () {
  "use strict";

  const cart = window.NexCart;
  const list = document.getElementById("cart-items");
  const emptyState = document.getElementById("cart-empty-state");
  const summary = document.getElementById("cart-summary");
  const subtotalLabel = document.getElementById("cart-subtotal-label");
  const subtotalValue = document.getElementById("cart-subtotal");
  const shippingValue = document.getElementById("cart-shipping");
  const totalValue = document.getElementById("cart-total");
  const checkoutLink = document.getElementById("cart-checkout-link");
  const clearButton = document.getElementById("cart-clear");

  if (!cart || !list) return;

  const productMeta = {
    "Vortex VX Pro Mechanical": {
      category: "Control",
      image:
        "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=800",
      href: "product-detail.html?id=vortex-vx-pro-mechanical",
    },
    "Logitech G Pro X Superlight": {
      category: "Control",
      image:
        "https://www.cravingtech.com/blog/wp-content/uploads/2021/05/Logitech-G-PRO-X-SUPERLIGHT-Review-5.jpg",
      href: "product-detail.html?id=logitech-g-pro-x-superlight",
    },
    "Astro A50 Wireless Gen 4": {
      category: "Sound",
      image:
        "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6349/6349970cv18d.jpg",
      href: "product-detail.html?id=astro-a50-wireless-gen-4",
    },
    "Zephyrus G14 RTX 4060": {
      category: "Machines",
      image:
        "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=82",
      href: "product-detail.html?id=zephyrus-g14-rtx-4060",
    },
    "HyperX Pulsefire Haste": {
      category: "Control",
      image:
        "https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c?auto=format&fit=crop&w=800&q=82",
      href: "product-detail.html?id=hyperx-pulsefire-haste",
    },
    "Arctis Nova Pro Wireless": {
      category: "Sound",
      image:
        "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=800&q=82",
      href: "product-detail.html?id=arctis-nova-pro-wireless",
    },
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=82";

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

  function itemTemplate(item) {
    const baseName = getBaseName(item.name);
    const meta = productMeta[baseName] || {};
    const safeName = escapeHtml(baseName);
    const safeFullName = escapeHtml(item.name);
    const safeVariant = escapeHtml(item.variant || getVariant(item.name));
    const safeCategory = escapeHtml(item.category || meta.category || "Gaming Gear");
    const safeImage = escapeHtml(item.image || meta.image || fallbackImage);
    const safeHref = escapeHtml(item.href || meta.href || "catalog.html");
    const quantity = Math.max(1, Number(item.qty) || 1);
    const lineTotal = (Number(item.price) || 0) * quantity;

    return `
      <article class="cart-item cart-item--dynamic" data-cart-name="${safeFullName}">
        <a class="cart-item-image" href="${safeHref}" aria-label="Lihat ${safeName}">
          <img src="${safeImage}" alt="${safeName}" loading="lazy">
        </a>
        <div class="cart-item-info">
          <span class="product-cat">${safeCategory}</span>
          <a href="${safeHref}"><h3>${safeName}</h3></a>
          <p>${safeVariant}</p>
          <div class="cart-item-actions">
            <div class="quantity-selector" aria-label="Jumlah ${safeName}">
              <button class="qty-btn" type="button" data-cart-decrease aria-label="Kurangi jumlah ${safeName}">−</button>
              <input class="qty-input" type="number" min="1" max="10" value="${quantity}" inputmode="numeric" aria-label="Jumlah ${safeName}">
              <button class="qty-btn" type="button" data-cart-increase aria-label="Tambah jumlah ${safeName}">+</button>
            </div>
            <button class="btn-remove" type="button" data-cart-remove>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
              Hapus
            </button>
          </div>
        </div>
        <div class="cart-item-price" aria-label="Subtotal ${safeName}">${formatRupiah(lineTotal)}</div>
      </article>
    `;
  }

  function calculateSummary(items) {
    const itemCount = items.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
    const subtotal = items.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
      0,
    );
    const shipping = subtotal > 0 ? 20000 : 0;

    return {
      itemCount,
      subtotal,
      shipping,
      total: subtotal + shipping,
    };
  }

  function setCheckoutState(enabled) {
    checkoutLink.classList.toggle("is-disabled", !enabled);
    checkoutLink.setAttribute("aria-disabled", String(!enabled));
    checkoutLink.tabIndex = enabled ? 0 : -1;
    if (enabled) {
      checkoutLink.href = "checkout.html";
    } else {
      checkoutLink.removeAttribute("href");
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
    subtotalLabel.textContent = `Subtotal (${totals.itemCount} Item)`;
    subtotalValue.textContent = formatRupiah(totals.subtotal);
    shippingValue.textContent = totals.shipping ? formatRupiah(totals.shipping) : "Rp0";
    totalValue.textContent = formatRupiah(totals.total);

    setCheckoutState(!isEmpty);
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
    render();
    window.showNexToast?.("Keranjang dikosongkan");
  });

  checkoutLink.addEventListener("click", (event) => {
    if (checkoutLink.getAttribute("aria-disabled") === "true") {
      event.preventDefault();
    }
  });

  render();
})();
