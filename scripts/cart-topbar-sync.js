(function () {
  "use strict";

  const CART_KEY = "nexgear_cart";
  const MAX_VISIBLE_ITEMS = 3;
  let previousCount = null;

  const productMeta = {
    "Vortex VX Pro Mechanical": {
      image: "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=420",
      href: "product-detail.html?id=vortex-vx-pro-mechanical",
    },
    "Logitech G Pro X Superlight": {
      image: "https://www.cravingtech.com/blog/wp-content/uploads/2021/05/Logitech-G-PRO-X-SUPERLIGHT-Review-5.jpg",
      href: "product-detail.html?id=logitech-g-pro-x-superlight",
    },
    "Astro A50 Wireless Gen 4": {
      image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6349/6349970cv18d.jpg",
      href: "product-detail.html?id=astro-a50-wireless-gen-4",
    },
    "Zephyrus G14 RTX 4060": {
      image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=420&q=82",
      href: "product-detail.html?id=zephyrus-g14-rtx-4060",
    },
    "HyperX Pulsefire Haste": {
      image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c?auto=format&fit=crop&w=420&q=82",
      href: "product-detail.html?id=hyperx-pulsefire-haste",
    },
    "Arctis Nova Pro Wireless": {
      image: "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=420&q=82",
      href: "product-detail.html?id=arctis-nova-pro-wireless",
    },
    "Artisan Zero FX XL": {
      image: "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=420&q=82",
      href: "product-detail.html?id=artisan-zero-fx-xl",
    },
  };

  const fallbackImage =
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=420&q=82";

  function readItems() {
    try {
      const items = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(items) ? items : [];
    } catch {
      return [];
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

  function getCount(items) {
    return items.reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0);
  }

  function getTotal(items) {
    return items.reduce(
      (sum, item) =>
        sum + (Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1),
      0,
    );
  }

  function renderMiniItem(item) {
    const baseName = getBaseName(item.name);
    const meta = productMeta[baseName] || {};
    const quantity = Math.max(1, Number(item.qty) || 1);
    const image = escapeHtml(item.image || meta.image || fallbackImage);
    const href = escapeHtml(item.href || meta.href || "catalog.html");
    const fullName = escapeHtml(item.name || baseName);
    const safeBaseName = escapeHtml(baseName);
    const lineTotal = (Number(item.price) || 0) * quantity;

    return `
      <div class="mini-cart-item" data-mini-cart-name="${fullName}">
        <a href="${href}" class="mini-cart-thumb">
          <img src="${image}" alt="${safeBaseName}" loading="lazy">
        </a>
        <div class="mini-cart-info">
          <a href="${href}" class="mini-cart-name">${quantity}x ${safeBaseName}</a>
          <strong class="mini-cart-price">${formatRupiah(lineTotal)}</strong>
        </div>
        <button class="mini-cart-remove" type="button" data-mini-cart-remove aria-label="Hapus ${safeBaseName} dari keranjang">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M3 6h18"></path>
            <path d="M8 6V4h8v2"></path>
            <path d="M19 6l-1 14H6L5 6"></path>
            <path d="M10 11v5"></path>
            <path d="M14 11v5"></path>
          </svg>
        </button>
      </div>
    `;
  }

  function pulseBadge(badge, count) {
    if (previousCount === null || previousCount === count) return;
    badge.classList.remove("is-pulsing");
    void badge.offsetWidth;
    badge.classList.add("is-pulsing");
    window.setTimeout(() => badge.classList.remove("is-pulsing"), 450);
  }

  function render() {
    const items = readItems();
    const count = getCount(items);
    const total = getTotal(items);

    document.querySelectorAll(".cart-badge").forEach((badge) => {
      pulseBadge(badge, count);
      badge.textContent = count > 0 ? String(count) : "";
      badge.dataset.count = String(count);
    });

    document.querySelectorAll(".mini-cart-dropdown").forEach((dropdown) => {
      const itemsContainer = dropdown.querySelector(".mini-cart-items");
      const totalValue = dropdown.querySelector(".mini-cart-total strong");
      const checkoutLink = dropdown.querySelector('.mini-cart-actions a[href="checkout.html"]');

      if (!itemsContainer || !totalValue) return;

      dropdown.dataset.cartEmpty = String(items.length === 0);
      totalValue.textContent = formatRupiah(total);

      if (items.length === 0) {
        itemsContainer.innerHTML = `
          <div class="mini-cart-empty-state">
            <div>
              <strong>Keranjang masih kosong</strong>
              <span>Tambahkan gear dari katalog untuk memulai checkout.</span>
            </div>
          </div>
        `;
        checkoutLink?.classList.add("is-disabled");
        checkoutLink?.setAttribute("aria-disabled", "true");
        checkoutLink?.removeAttribute("href");
        return;
      }

      const visibleItems = items.slice(0, MAX_VISIBLE_ITEMS);
      const hiddenCount = items.length - visibleItems.length;
      itemsContainer.innerHTML = visibleItems.map(renderMiniItem).join("");

      if (hiddenCount > 0) {
        itemsContainer.insertAdjacentHTML(
          "beforeend",
          `<p class="mini-cart-overflow-note">+${hiddenCount} produk lain di keranjang</p>`,
        );
      }

      if (checkoutLink) {
        checkoutLink.href = "checkout.html";
        checkoutLink.classList.remove("is-disabled");
        checkoutLink.setAttribute("aria-disabled", "false");
      }
    });

    previousCount = count;
  }

  function saveItems(items) {
    if (window.NexCart?.save) {
      window.NexCart.save(items);
      return;
    }

    localStorage.setItem(CART_KEY, JSON.stringify(items));
    render();
  }

  function removeItem(name) {
    const nextItems = readItems().filter((item) => item.name !== name);
    saveItems(nextItems);
    window.showNexToast?.(`${getBaseName(name)} dihapus dari keranjang`);
  }

  function hookNexCart(attempt) {
    const cart = window.NexCart;

    if (!cart) {
      if (attempt < 120) {
        window.setTimeout(() => hookNexCart(attempt + 1), 25);
      }
      return;
    }

    if (cart.__topbarSyncWrapped) {
      render();
      return;
    }

    const originalSave = cart.save;
    cart.save = function saveAndSync(items) {
      const result = originalSave.call(this, items);
      render();
      window.dispatchEvent(
        new CustomEvent("nexgear:cart-updated", {
          detail: {
            items: readItems(),
            count: getCount(readItems()),
            total: getTotal(readItems()),
          },
        }),
      );
      return result;
    };

    Object.defineProperty(cart, "__topbarSyncWrapped", {
      value: true,
      configurable: false,
      enumerable: false,
      writable: false,
    });

    render();
  }

  document.addEventListener("click", (event) => {
    const removeButton = event.target.closest("[data-mini-cart-remove]");
    if (!removeButton) return;

    event.preventDefault();
    event.stopPropagation();

    const itemElement = removeButton.closest("[data-mini-cart-name]");
    if (!itemElement) return;
    removeItem(itemElement.dataset.miniCartName);
  });

  window.addEventListener("storage", (event) => {
    if (event.key === CART_KEY) render();
  });

  window.addEventListener("nexgear:cart-updated", render);
  document.addEventListener("nexgear:components-ready", render);

  window.renderMiniCartGlobal = render;

  render();
  hookNexCart(0);
})();
