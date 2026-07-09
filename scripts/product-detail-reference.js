(function () {
  "use strict";

  if (window.__nexgearProductDetailReferenceReady) return;
  window.__nexgearProductDetailReferenceReady = true;

  const CART_KEY = "nexgear_cart";
  const CART_INIT_KEY = "nexgear_cart_initialized";

  function qs(selector, root) {
    return (root || document).querySelector(selector);
  }

  function qsa(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function safeJson(value, fallback) {
    try {
      const parsed = JSON.parse(value);
      return parsed ?? fallback;
    } catch (error) {
      return fallback;
    }
  }

  function clampQuantity(value) {
    return Math.min(10, Math.max(1, Number(value) || 1));
  }

  function syncQuantity(value) {
    const next = clampQuantity(value);
    qsa(".qty-input").forEach(function (input) {
      input.value = String(next);
    });
  }

  function activeToggle(button, selector, activeClass) {
    qsa(selector).forEach(function (item) {
      const active = item === button;
      item.classList.toggle(activeClass, active);
      item.setAttribute("data-state", active ? "active" : "idle");
      if (item.matches("button")) item.setAttribute("aria-pressed", String(active));
    });
  }

  function getSelectedColor() {
    const stickySelect = qs(".reference-sticky-cart select");
    const activeColor = qs(".color-choice.is-active")?.dataset.color;
    return stickySelect?.value || activeColor || "Stealth Black";
  }

  function getSelectedVariant() {
    const activeSwitch = qs(".opt-btn.active")?.textContent?.trim() || "Linear Red";
    return `${getSelectedColor()} / ${activeSwitch}`;
  }

  function getProductPayload(trigger) {
    return {
      id: "vortex-vx-pro-mechanical",
      name: trigger?.dataset.productName || "Vortex VX Pro Mechanical",
      category: "Control",
      variant: getSelectedVariant(),
      price: Number(trigger?.dataset.productPrice || 1850000),
      qty: clampQuantity(qs(".qty-input")?.value || 1),
      image: qs("#mainImage")?.src || "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=640",
    };
  }

  function saveCartItem(trigger) {
    const product = getProductPayload(trigger);
    const current = safeJson(localStorage.getItem(CART_KEY), []);
    const items = Array.isArray(current) ? current : [];
    const existing = items.find(function (item) {
      return item.id === product.id && item.variant === product.variant;
    });

    if (existing) existing.qty = clampQuantity(existing.qty + product.qty);
    else items.push(product);

    localStorage.setItem(CART_KEY, JSON.stringify(items));
    localStorage.setItem(CART_INIT_KEY, "true");
    window.NexCart?.updateBadge?.();
    window.dispatchEvent(new CustomEvent("nexgear:cart-updated", { detail: { items } }));
    return items;
  }

  function buildToast() {
    if (qs(".reference-toast")) return;
    const toast = document.createElement("div");
    toast.className = "reference-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    document.body.appendChild(toast);

    window.addEventListener("nexgear:toast", function (event) {
      toast.textContent = event.detail?.message || "Berhasil.";
      toast.classList.add("is-visible");
      window.clearTimeout(toast._timer);
      toast._timer = window.setTimeout(function () {
        toast.classList.remove("is-visible");
      }, 2200);
    });
  }

  function updateStickyColor(value) {
    const select = qs(".reference-sticky-cart select");
    if (select && value && select.value !== value) select.value = value;
  }

  function showPanelSkeleton(panel) {
    if (!panel) return;
    panel.classList.add("is-loading");
    panel.setAttribute("aria-busy", "true");
    window.clearTimeout(panel._loadingTimer);
    panel._loadingTimer = window.setTimeout(function () {
      panel.classList.remove("is-loading");
      panel.removeAttribute("aria-busy");
    }, 360);
  }

  function showGallerySkeleton() {
    const media = qs(".product-main-media");
    if (!media) return;
    media.classList.add("is-loading");
    window.clearTimeout(media._loadingTimer);
    media._loadingTimer = window.setTimeout(function () {
      media.classList.remove("is-loading");
    }, 420);
  }

  function openLightbox() {
    const modal = qs(".product-lightbox");
    const modalImage = qs(".product-lightbox__image");
    const mainImage = qs("#mainImage");
    if (!modal || !modalImage || !mainImage) return;

    modalImage.src = mainImage.src;
    modalImage.alt = mainImage.alt || "Gambar produk diperbesar";
    modal.hidden = false;
    document.documentElement.classList.add("lightbox-open");
    qs(".product-lightbox__close")?.focus();
  }

  function closeLightbox() {
    const modal = qs(".product-lightbox");
    if (!modal) return;
    modal.hidden = true;
    document.documentElement.classList.remove("lightbox-open");
    qs(".product-zoom-trigger")?.focus();
  }

  function enhanceProductDetail() {
    if (!document.body.classList.contains("page-product-detail")) return;
    document.body.classList.add("product-detail-reference");

    qsa(".product-thumb").forEach(function (button) {
      button.addEventListener("click", function () {
        const image = qs("#mainImage");
        if (image && button.dataset.image) image.src = button.dataset.image;
        activeToggle(button, ".product-thumb", "is-active");
        showGallerySkeleton();
      });
    });

    qsa(".color-choice").forEach(function (button) {
      button.addEventListener("click", function () {
        activeToggle(button, ".color-choice", "is-active");
        updateStickyColor(button.dataset.color);
        showGallerySkeleton();
      });
    });

    qsa(".opt-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        activeToggle(button, ".opt-btn", "active");
      });
    });

    qs(".product-zoom-trigger")?.addEventListener("click", openLightbox);
    qsa("[data-lightbox-close]").forEach(function (button) {
      button.addEventListener("click", closeLightbox);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeLightbox();
    });

    document.addEventListener("click", function (event) {
      const qtyButton = event.target.closest("[data-qty]");
      if (qtyButton) {
        const current = clampQuantity(qs(".qty-input")?.value || 1);
        syncQuantity(qtyButton.dataset.qty === "plus" ? current + 1 : current - 1);
      }

      const actionButton = event.target.closest("[data-product-action]");
      if (!actionButton) return;

      const action = actionButton.dataset.productAction;
      saveCartItem(actionButton);
      actionButton.dataset.state = "added";
      window.setTimeout(function () {
        actionButton.dataset.state = "idle";
      }, 900);

      if (action === "buy") {
        window.dispatchEvent(new CustomEvent("nexgear:toast", { detail: { message: "Produk disiapkan untuk checkout." } }));
        window.setTimeout(function () {
          window.location.href = "checkout.html";
        }, 420);
        return;
      }

      window.dispatchEvent(new CustomEvent("nexgear:toast", { detail: { message: "Produk masuk keranjang." } }));
    });

    qsa(".qty-input").forEach(function (input) {
      input.addEventListener("change", function () {
        syncQuantity(input.value);
      });
    });

    qs(".reference-sticky-cart select")?.addEventListener("change", function (event) {
      const value = event.target.value;
      const matchingButton = qsa(".color-choice").find(function (button) {
        return button.dataset.color === value;
      });
      if (matchingButton) activeToggle(matchingButton, ".color-choice", "is-active");
      showGallerySkeleton();
    });

    qsa(".tab-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        const target = button.dataset.tab;
        qsa(".tab-btn").forEach(function (tab) {
          const active = tab === button;
          tab.classList.toggle("active", active);
          tab.setAttribute("aria-selected", String(active));
        });
        qsa("[data-tab-panel]").forEach(function (panel) {
          const active = panel.dataset.tabPanel === target;
          panel.classList.toggle("active", active);
          panel.hidden = !active;
          if (active) showPanelSkeleton(panel);
        });
      });
    });

    buildToast();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceProductDetail);
  } else {
    enhanceProductDetail();
  }
})();
