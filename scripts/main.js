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

  /* ── Simple Auth State (localStorage) ── */
  const Auth = {
    KEY: "nexgear_auth",
    get isLoggedIn() {
      return localStorage.getItem(this.KEY) === 'true';
    },
    login() {
      localStorage.setItem(this.KEY, 'true');
      this.updateUI();
    },
    logout() {
      localStorage.removeItem(this.KEY);
      this.updateUI();
    },
    updateUI() {
      document.querySelectorAll('.nav-actions').forEach(container => {
        const authBtn = container.querySelector('a[href="login.html"], a[href="profile.html"]');
        if (authBtn) {
          if (this.isLoggedIn) {
            authBtn.href = "profile.html";
            authBtn.innerHTML = '<span class="icon icon-sm"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span> Profil';
          } else {
            authBtn.href = "login.html";
            authBtn.innerHTML = '<span class="icon icon-sm"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg></span> Masuk';
          }
        }
      });
    }
  };
  window.NexAuth = Auth;

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
        // Skip rotation for filter drawer elements
        if (card.closest(".filter-drawer")) return;
        const deg = ((i % 5) - 2) * 0.4;
        card.style.setProperty("--sketch-rotate", `${deg}deg`);
        card.style.transform = `rotate(${deg}deg)`;
      });
  }

  /* ── Filter Drawer (catalog) ── */
  function initFilterDrawer() {
    const openBtn = document.getElementById("openFilterBtn");
    const closeBtn = document.getElementById("closeFilterBtn");
    const clearBtn = document.getElementById("clearFiltersBtn");
    const applyBtn = document.getElementById("applyFiltersBtn");
    const overlay = document.getElementById("filterOverlay");
    const drawer = document.getElementById("filterDrawer");
    const badge = document.getElementById("filterBadge");
    const activeFiltersList = document.getElementById("activeFiltersList");

    if (!openBtn || !drawer) return;

    function renderActiveFilters() {
      // Get all checked filters
      const checkboxes = drawer.querySelectorAll(
        ".filter-option input[type='checkbox']:checked",
      );
      const range = drawer.querySelector(".price-range");
      const maxPrice = range ? parseInt(range.value) : 5000;

      const filters = [];

      // Collect category filters
      checkboxes.forEach((cb) => {
        const label = cb.parentElement.textContent.trim();
        filters.push({ name: label, element: cb });
      });

      // Add price filter if not at max
      if (maxPrice < 5000) {
        filters.push({
          name: `Price: $0-$${maxPrice.toLocaleString()}`,
          isPriceFilter: true,
        });
      }

      // Render chips
      activeFiltersList.innerHTML = "";
      filters.forEach((filter) => {
        const chip = document.createElement("div");
        chip.className = "filter-chip";

        const label = document.createElement("span");
        label.textContent = filter.name;

        const removeBtn = document.createElement("button");
        removeBtn.className = "filter-chip-remove";
        removeBtn.setAttribute("aria-label", `Remove ${filter.name}`);
        removeBtn.innerHTML =
          '<svg viewBox="0 0 24 24" style="width: 100%; height: 100%;"><line x1="18" y1="6" x2="6" y2="18" stroke-width="2" stroke="currentColor"/><line x1="6" y1="6" x2="18" y2="18" stroke-width="2" stroke="currentColor"/></svg>';

        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          if (filter.isPriceFilter) {
            range.value = 5000;
            const label = drawer.querySelector(".price-label-max");
            if (label) label.textContent = "$5,000+";
            range.dispatchEvent(new Event("input", { bubbles: true }));
          } else if (filter.element) {
            filter.element.checked = false;
            filter.element.dispatchEvent(
              new Event("change", { bubbles: true }),
            );
          }
        });

        chip.appendChild(label);
        chip.appendChild(removeBtn);
        activeFiltersList.appendChild(chip);
      });

      // Show/hide container
      activeFiltersList.style.display = filters.length > 0 ? "flex" : "none";
    }

    function updateBadge() {
      const checkboxes = drawer.querySelectorAll(
        ".filter-option input[type='checkbox']:checked",
      );
      const range = drawer.querySelector(".price-range");
      const maxPrice = range ? parseInt(range.value) : 5000;
      const hasPrice = maxPrice < 5000;
      const count = checkboxes.length + (hasPrice ? 1 : 0);

      if (count > 0) {
        badge.textContent = count;
        badge.style.display = "inline-block";
      } else {
        badge.textContent = "";
        badge.style.display = "none";
      }

      renderActiveFilters();
    }

    function openFilter() {
      drawer.classList.add("show");
      overlay.classList.add("show");
      document.body.style.overflow = "hidden";
      openBtn.setAttribute("aria-expanded", "true");
      overlay.setAttribute("aria-hidden", "false");
    }

    function closeFilter() {
      drawer.classList.remove("show");
      overlay.classList.remove("show");
      document.body.style.overflow = "";
      openBtn.setAttribute("aria-expanded", "false");
      overlay.setAttribute("aria-hidden", "true");
      openBtn.focus();
    }

    function clearFilters() {
      drawer
        .querySelectorAll(".filter-option input[type='checkbox']")
        .forEach((cb) => (cb.checked = false));
      const range = drawer.querySelector(".price-range");
      if (range) {
        range.value = 5000;
        const label = drawer.querySelector(".price-label-max");
        if (label) label.textContent = "$5,000+";
      }
      updateBadge();
    }

    function applyFilters() {
      // Trigger search/filter logic
      const range = drawer.querySelector(".price-range");
      if (range) {
        range.dispatchEvent(new Event("input", { bubbles: true }));
      }
      closeFilter();
    }

    openBtn.addEventListener("click", openFilter);
    if (closeBtn) closeBtn.addEventListener("click", closeFilter);
    if (clearBtn) clearBtn.addEventListener("click", clearFilters);
    if (applyBtn) applyBtn.addEventListener("click", applyFilters);
    overlay.addEventListener("click", closeFilter);

    // Update badge when checkboxes change
    drawer
      .querySelectorAll(".filter-option input[type='checkbox']")
      .forEach((cb) => {
        cb.addEventListener("change", updateBadge);
      });

    // Update badge when price changes
    const range = drawer.querySelector(".price-range");
    if (range) {
      range.addEventListener("input", updateBadge);
    }

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && drawer.classList.contains("show")) {
        closeFilter();
      }
    });

    // Initial badge state
    updateBadge();
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
    initFilterDrawer();
    Cart.updateBadge();
    initMiniCart();
    Auth.updateUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
