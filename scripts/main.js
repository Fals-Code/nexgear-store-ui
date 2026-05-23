/**
 * NEXGEAR Main Script — Handmade Edition
 * No ESM exports — classic script loading
 */

(function () {
  "use strict";

  /* ── Simple Cart State (localStorage) ── */
  const Cart = {
    KEY: "nexgear_cart",
    get items() {
      try {
        return JSON.parse(localStorage.getItem(this.KEY)) || [];
      } catch {
        return [];
      }
    },
    save(items) {
      localStorage.setItem(this.KEY, JSON.stringify(items));
      this.updateBadge();
    },
    add(product) {
      const items = this.items;
      const variantStr = product.variant ? ` - ${product.variant}` : "";
      const finalName = product.name + variantStr;

      const existing = items.find((i) => i.name === finalName);
      const qtyToAdd = product.qty || 1;

      if (existing) {
        existing.qty += qtyToAdd;
      } else {
        items.push({ ...product, name: finalName, qty: qtyToAdd });
      }
      this.save(items);
      if (window.openMiniCart) window.openMiniCart();
      else showToast(`${finalName} ditambahkan ke keranjang!`);
    },
    remove(name) {
      const items = this.items.filter((i) => i.name !== name);
      this.save(items);
      if (window.renderMiniCartGlobal) window.renderMiniCartGlobal();
    },
    updateQty(name, delta) {
      const items = this.items;
      const item = items.find((i) => i.name === name);
      if (item) {
        item.qty = Math.max(1, item.qty + delta);
        this.save(items);
      }
    },
    clear() {
      this.save([]);
    },
    get total() {
      return this.items.reduce((sum, i) => sum + i.price * i.qty, 0);
    },
    get count() {
      return this.items.reduce((sum, i) => sum + i.qty, 0);
    },
    updateBadge() {
      document.querySelectorAll(".cart-badge").forEach((badge) => {
        const c = this.count;
        badge.textContent = c > 0 ? c : "";
        badge.dataset.count = c;
      });
    },
  };

  // Expose Cart globally for page-specific scripts
  window.NexCart = Cart;

  /* ── Toast Notification ── */
  function showToast(msg) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "toastOut 0.3s forwards";
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
  window.showToast = showToast;

  /* ── Sticky Navbar ── */
  function initNavbar() {
    const nav = document.querySelector("nav");
    if (!nav) return;

    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 40);
    });
  }

  /* ── Mobile Menu ── */
  function initMobileMenu() {
    const nav = document.querySelector("nav");
    const navLinks = document.querySelector(".nav-links");
    const hamburger = document.querySelector(".hamburger");
    if (!nav || !navLinks || !hamburger) return;

    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("mobile-active");
    });

    // Close on link click
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("mobile-active");
      });
    });
  }

  /* ── Scroll Reveal ── */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    const check = () => {
      const trigger = window.innerHeight * 0.85;
      els.forEach((el) => {
        if (el.getBoundingClientRect().top < trigger) {
          el.classList.add("active");
        }
      });
    };

    window.addEventListener("scroll", check, { passive: true });
    check();
  }

  /* ── Hero Parallax ── */
  function initParallax() {
    const heroH1 = document.querySelector(".hero h1");
    if (!heroH1) return;

    window.addEventListener("mousemove", (e) => {
      const x = (window.innerWidth / 2 - e.pageX) / 60;
      const y = (window.innerHeight / 2 - e.pageY) / 60;
      heroH1.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* ── Price Filter (catalog) ── */
  function initPriceFilter() {
    const range = document.querySelector(".price-range");
    const label = document.querySelector(".price-label-max");
    if (!range || !label) return;

    range.addEventListener("input", () => {
      label.textContent = `$${parseInt(range.value).toLocaleString()}+`;
    });
  }

  /* ── Search & Filter Logic (catalog) ── */
  function initSearch() {
    const bar = document.querySelector(".search-bar");
    const cards = document.querySelectorAll(".product-card, .related-card");
    const range = document.querySelector(".price-range");
    if (!cards.length) return;

    function filterProducts() {
      const term = bar ? bar.value.toLowerCase() : "";
      const maxPrice = range ? parseInt(range.value) : Infinity;

      cards.forEach((card) => {
        // Precise search: only check title/headers
        const titleEl = card.querySelector("h3, h4");
        const text = titleEl ? titleEl.textContent.toLowerCase() : "";

        // Precise price: parse from element
        const priceEl = card.querySelector(
          ".price, .product-price, .related-bottom .price",
        );
        let price = 0;
        if (priceEl) {
          price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ""));
        }

        const matchSearch = text.includes(term);
        // If price is 0, we assume it's valid to avoid hiding things without a price tag
        const matchPrice = price === 0 || price <= maxPrice;

        card.style.display = matchSearch && matchPrice ? "" : "none";
      });
    }

    if (bar) bar.addEventListener("input", filterProducts);
    if (range) range.addEventListener("input", filterProducts);
  }

  /* ── Add-to-Cart Buttons ── */
  function initAddToCart() {
    document.querySelectorAll("[data-add-cart]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const name = btn.dataset.name || "Product";
        const price = parseFloat(btn.dataset.price) || 0;
        Cart.add({ name, price });
      });
    });
  }

  /* ── Set Active Nav Link ── */
  function setActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        link.classList.add("active");
      }
    });
  }

  /* ── Random slight rotations for sketch cards ── */
  function initSketchRotations() {
    document
      .querySelectorAll(".sketch-card, .sketch-card-alt")
      .forEach((card, i) => {
        const deg = ((i % 5) - 2) * 0.4;
        card.style.setProperty("--sketch-rotate", `${deg}deg`);
        card.style.transform = `rotate(${deg}deg)`;
      });
  }

  /* ── Filter Modal (catalog) ── */
  function initFilterModal() {
    const openBtn = document.getElementById("openFilterBtn");
    const closeBtn = document.getElementById("closeFilterBtn");
    const overlay = document.getElementById("filterOverlay");
    const modal = document.getElementById("filterModal");

    if (!openBtn || !modal) return;

    function openFilter() {
      modal.classList.add("show");
      overlay.classList.add("show");
      document.body.style.overflow = "hidden";
    }

    function closeFilter() {
      modal.classList.remove("show");
      overlay.classList.remove("show");
      document.body.style.overflow = "";
    }

    openBtn.addEventListener("click", openFilter);
    if (closeBtn) closeBtn.addEventListener("click", closeFilter);
    overlay.addEventListener("click", closeFilter);

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("show")) {
        closeFilter();
      }
    });
  }

  /* ── Mini-Cart Injection & Logic ── */
  function initMiniCart() {
    const cartHTML = `
      <div class="mini-cart-overlay" id="miniCartOverlay"></div>
      <div class="mini-cart-drawer" id="miniCartDrawer">
        <div class="mini-cart-header">
          <h3>Keranjangmu</h3>
          <button class="close-cart-btn" id="closeMiniCart">
            <span class="icon icon-sm"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
          </button>
        </div>
        <div class="mini-cart-body" id="miniCartItems"></div>
        <div class="mini-cart-footer">
          <div class="mini-cart-total">
            <span>Total:</span>
            <span id="miniCartTotal">$0.00</span>
          </div>
          <a href="checkout.html" class="btn btn-primary" style="width: 100%; justify-content: center;">Checkout</a>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML("beforeend", cartHTML);

    const overlay = document.getElementById("miniCartOverlay");
    const drawer = document.getElementById("miniCartDrawer");
    const closeBtn = document.getElementById("closeMiniCart");
    const itemsContainer = document.getElementById("miniCartItems");
    const totalEl = document.getElementById("miniCartTotal");

    function openCart() {
      renderMiniCart();
      overlay.classList.add("active");
      drawer.classList.add("active");
      document.body.style.overflow = "hidden";
    }

    function closeCart() {
      overlay.classList.remove("active");
      drawer.classList.remove("active");
      document.body.style.overflow = "";
    }

    function renderMiniCart() {
      const items = Cart.items;
      if (items.length === 0) {
        itemsContainer.innerHTML =
          '<div class="mini-cart-empty">Kosong melompong~</div>';
        totalEl.textContent = "$0.00";
        return;
      }

      itemsContainer.innerHTML = items
        .map(
          (item) => `
        <div class="mini-cart-item">
          <div class="mini-cart-item-info">
            <h4>${item.name}</h4>
            <div class="mini-cart-item-price">$${item.price.toFixed(2)} x ${item.qty}</div>
          </div>
          <button class="btn btn-outline" style="padding: 4px; border-color: var(--accent); color: var(--accent);" onclick="window.NexCart.remove('${item.name}');">
            <span class="icon icon-sm" style="width: 14px; height: 14px;"><svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></span>
          </button>
        </div>
      `,
        )
        .join("");
      totalEl.textContent = `$${Cart.total.toFixed(2)}`;
    }

    window.openMiniCart = openCart;
    window.renderMiniCartGlobal = renderMiniCart;

    closeBtn.addEventListener("click", closeCart);
    overlay.addEventListener("click", closeCart);

    document.querySelectorAll(".cart-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (!window.location.pathname.endsWith("cart.html")) {
          e.preventDefault();
          openCart();
        }
      });
    });
  }

  /* ── INIT ── */
  function init() {
    initNavbar();
    initMobileMenu();
    initReveal();
    initParallax();
    initPriceFilter();
    initSearch();
    initAddToCart();
    setActiveNav();
    initSketchRotations();
    initFilterModal();
    Cart.updateBadge();
    initMiniCart();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
