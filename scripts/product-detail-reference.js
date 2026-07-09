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
      item.classList.toggle(activeClass, item === button);
      item.setAttribute("data-state", item === button ? "active" : "idle");
      if (item.matches("button")) item.setAttribute("aria-pressed", String(item === button));
    });
  }

  function getSelectedVariant() {
    const activeSwitch = qs(".opt-btn.active")?.textContent?.trim() || "Linear Red";
    const activeColor = qs(".color-dot.is-active")?.getAttribute("aria-label") || "Stealth Black";
    return `${activeColor} / ${activeSwitch}`;
  }

  function saveCartItem() {
    const button = qs(".btn-add-cart");
    const qty = clampQuantity(qs(".qty-input")?.value || 1);
    const product = {
      id: "vortex-vx-pro-mechanical",
      name: button?.dataset.productName || "Vortex VX Pro Mechanical",
      category: "Control",
      variant: getSelectedVariant(),
      price: Number(button?.dataset.productPrice || 1850000),
      qty,
      image: qs("#mainImage")?.src || "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=640",
    };

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
    window.dispatchEvent(new CustomEvent("nexgear:toast", { detail: { message: "Produk masuk keranjang." } }));
  }

  function buildToast() {
    if (qs(".reference-toast")) return;
    const toast = document.createElement("div");
    toast.className = "reference-toast";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.style.cssText = "position:fixed;right:18px;bottom:86px;z-index:60;transform:translateY(16px);opacity:0;pointer-events:none;padding:12px 16px;border-radius:14px;background:#05070b;color:#fff;border:1px solid rgba(0,229,255,.35);box-shadow:0 24px 64px rgba(0,0,0,.28);transition:opacity .2s ease,transform .2s ease;font-weight:800";
    document.body.appendChild(toast);

    window.addEventListener("nexgear:toast", function (event) {
      toast.textContent = event.detail?.message || "Berhasil.";
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
      window.clearTimeout(toast._timer);
      toast._timer = window.setTimeout(function () {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(16px)";
      }, 2200);
    });
  }

  function enhanceProductDetail() {
    if (!document.body.classList.contains("page-product-detail")) return;
    document.body.classList.add("product-detail-reference");

    qsa(".product-thumb").forEach(function (button) {
      button.addEventListener("click", function () {
        const image = qs("#mainImage");
        if (image && button.dataset.image) image.src = button.dataset.image;
        activeToggle(button, ".product-thumb", "is-active");
      });
    });

    qsa(".color-dot").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.classList.contains("is-active")));
      button.addEventListener("click", function () {
        activeToggle(button, ".color-dot", "is-active");
      });
    });

    qsa(".opt-btn").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.classList.contains("active")));
      button.addEventListener("click", function () {
        activeToggle(button, ".opt-btn", "active");
      });
    });

    document.addEventListener("click", function (event) {
      const qtyButton = event.target.closest("[data-qty]");
      if (qtyButton) {
        const current = clampQuantity(qs(".qty-input")?.value || 1);
        syncQuantity(qtyButton.dataset.qty === "plus" ? current + 1 : current - 1);
      }

      if (event.target.closest(".btn-add-cart")) {
        saveCartItem();
        const button = event.target.closest(".btn-add-cart");
        button.dataset.state = "added";
        window.setTimeout(function () {
          button.dataset.state = "idle";
        }, 900);
      }
    });

    qsa(".qty-input").forEach(function (input) {
      input.addEventListener("change", function () {
        syncQuantity(input.value);
      });
    });

    qsa(".tab-btn").forEach(function (button) {
      button.addEventListener("click", function () {
        const target = button.dataset.tab;
        qsa(".tab-btn").forEach(function (tab) {
          tab.classList.toggle("active", tab === button);
          tab.setAttribute("aria-selected", String(tab === button));
        });
        qsa("[data-tab-panel]").forEach(function (panel) {
          panel.classList.toggle("active", panel.dataset.tabPanel === target);
          panel.hidden = panel.dataset.tabPanel !== target;
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
