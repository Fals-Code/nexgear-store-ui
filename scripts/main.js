/**
 * NEXGEAR Main Script â€” Handmade Edition
 * No ESM exports â€” classic script loading
 */

(function () {
  "use strict";

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  window.formatRupiah = formatRupiah;

  /* â”€â”€ Simple Cart State (localStorage) â”€â”€ */
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
      const { silent, ...cartProduct } = product;
      const variantStr = cartProduct.variant ? ` - ${cartProduct.variant}` : "";
      const finalName = cartProduct.name + variantStr;

      const existing = items.find((i) => i.name === finalName);
      const qtyToAdd = cartProduct.qty || 1;

      if (existing) {
        existing.qty += qtyToAdd;
      } else {
        items.push({ ...cartProduct, name: finalName, qty: qtyToAdd });
      }
      this.save(items);
      if (!silent) showToast(`${finalName} ditambahkan ke keranjang!`);
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
      if (window.updateCartEmptyGuidance) window.updateCartEmptyGuidance();
    },
  };

  // Expose Cart globally for page-specific scripts
  window.NexCart = Cart;

  /* â”€â”€ Simple Auth State (localStorage) â”€â”€ */
  const Auth = {
    KEY: "nexgear_auth",
    get isLoggedIn() {
      return localStorage.getItem(this.KEY) === "true";
    },
    login() {
      localStorage.setItem(this.KEY, "true");
      this.updateUI();
    },
    logout() {
      localStorage.removeItem(this.KEY);
      this.updateUI();
    },
    updateUI() {
      document.querySelectorAll(".nav-actions").forEach((container) => {
        const authBtn = container.querySelector(
          'a[href="login.html"], a[href="profile.html"]',
        );
        if (authBtn) {
          if (this.isLoggedIn) {
            authBtn.href = "profile.html";
            authBtn.innerHTML =
              '<span class="icon icon-sm"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span> Profil';
          } else {
            authBtn.href = "login.html";
            authBtn.innerHTML =
              '<span class="icon icon-sm"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg></span> Masuk';
          }
        }
      });
    },
  };
  window.NexAuth = Auth;

  /* â”€â”€ Toast Notification â”€â”€ */
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

  function showNexToast(message) {
    let toast = document.querySelector(".nex-toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.className = "nex-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");

    clearTimeout(window.__nexToastTimer);
    window.__nexToastTimer = setTimeout(() => {
      toast.classList.remove("is-visible");
    }, 1800);
  }
  window.showNexToast = showNexToast;

  /* ―― Sticky Navbar ―― */
  function initNavbar() {
    const topBar = document.querySelector(".top-bar");
    const shopBar = document.querySelector("#shop-bar");
    if (!shopBar) return;

    let spacer = document.querySelector(".shop-bar-spacer");
    if (!spacer) {
      spacer = document.createElement("div");
      spacer.className = "shop-bar-spacer";
      shopBar.insertAdjacentElement("afterend", spacer);
    }

    const setShopBarHeight = () => {
      const height = shopBar.offsetHeight || 70;
      document.documentElement.style.setProperty(
        "--shop-bar-height",
        `${height}px`,
      );
    };

    const onScroll = () => {
      const threshold = topBar ? topBar.offsetHeight : 72;
      const shouldStick = window.scrollY > threshold;

      shopBar.classList.toggle("is-sticky", shouldStick);
      shopBar.classList.toggle("is-fixed", shouldStick);
      spacer.classList.toggle("is-active", shouldStick);
    };

    setShopBarHeight();
    onScroll();

    window.addEventListener("resize", setShopBarHeight, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* — Mobile Menu — */
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

  /* â”€â”€ Scroll Reveal â”€â”€ */
  function initReveal() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;

    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("active"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("active");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px 120px 0px" },
    );

    els.forEach((el) => observer.observe(el));
  }

  /* â”€â”€ Stat Count-Up â”€â”€ */
  function initCountUp() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const nums = document.querySelectorAll(".stats-num[data-target]");
    if (!nums.length) return;

    if (!("IntersectionObserver" in window)) {
      nums.forEach((el) => {
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || "";
        el.textContent = `${target}${suffix}`;
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          const target = parseFloat(el.dataset.target);
          const suffix = el.dataset.suffix || "";
          const duration = 1200;
          const start = performance.now();
          const isDecimal = target % 1 !== 0;

          function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = eased * target;
            el.textContent = `${isDecimal ? current.toFixed(1) : Math.floor(current)}${suffix}`;

            if (progress < 1) requestAnimationFrame(update);
          }

          requestAnimationFrame(update);
          observer.unobserve(el);
        });
      },
      { threshold: 0.5 },
    );

    nums.forEach((el) => observer.observe(el));
  }

  /* â”€â”€ Hero Parallax â”€â”€ */
  function initParallax() {
    const heroH1 = document.querySelector(".hero h1");
    if (!heroH1) return;

    window.addEventListener("mousemove", (e) => {
      const x = (window.innerWidth / 2 - e.pageX) / 60;
      const y = (window.innerHeight / 2 - e.pageY) / 60;
      heroH1.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* â”€â”€ Price Filter (catalog) â”€â”€ */
  function initPriceFilter() {
    const range =
      document.querySelector("#priceRange") ||
      document.querySelector(".price-range input[type='range']");
    const label = document.querySelector(".price-label-max");
    if (!range || !label) return;

    range.addEventListener("input", () => {
      const min = document.querySelector(".price-min");
      const minValue = min ? parseInt(min.value) : 0;
      const maxValue = parseInt(range.value);
      label.textContent =
        minValue >= 20000000 && maxValue >= 50000000
          ? `${formatRupiah(minValue)}+`
          : `${formatRupiah(minValue)}-${formatRupiah(maxValue)}`;
    });
  }

  /* â”€â”€ Search & Filter Logic (catalog) â”€â”€ */
  function initGearFinder() {
    const options = document.querySelectorAll(".gear-finder__option");
    const cta = document.getElementById("gearFinderCta");
    if (!options.length || !cta) return;

    const ctaLabels = {
      gaming: "Cari Gear Gaming",
      productivity: "Cari Gear Produktivitas",
      streaming: "Cari Gear Streaming",
      budget: "Cari Setup Hemat",
    };

    options.forEach((option) => {
      option.addEventListener("click", () => {
        const setup = option.dataset.setup || "gaming";

        options.forEach((item) => {
          const isActive = item === option;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-pressed", isActive ? "true" : "false");
        });

        cta.href = `catalog.html?setup=${encodeURIComponent(setup)}`;
        cta.textContent = ctaLabels[setup] || "Jelajahi Catalog";
      });
    });
  }

  function initTrustModal() {
    const modal = document.getElementById("trustModal");
    const title = document.getElementById("trustModalTitle");
    const copy = document.getElementById("trustModalCopy");
    const link = document.getElementById("trustModalLink");
    const closeBtn = modal?.querySelector(".trust-modal__close");
    const triggers = document.querySelectorAll(".trust-action");
    if (!modal || !title || !copy || !link || !closeBtn || !triggers.length) {
      return;
    }

    const content = {
      stock: {
        title: "Ready Stock",
        copy: "Produk pilihan diprioritaskan dari stok siap proses agar checkout tidak berakhir di estimasi yang abu-abu.",
        href: "catalog.html",
        label: "Lihat Catalog",
      },
      warranty: {
        title: "Garansi Resmi",
        copy: "Gear kurasi NEXGEAR diarahkan ke produk bergaransi resmi dengan dukungan brand dan invoice pembelian.",
        href: "about.html",
        label: "Baca Detail",
      },
      checkout: {
        title: "Secure Checkout",
        copy: "Alur checkout dibuat ringkas dengan ringkasan pesanan, validasi data, dan pembayaran yang jelas.",
        href: "cart.html",
        label: "Cek Keranjang",
      },
      delivery: {
        title: "Fast Delivery",
        copy: "Pesanan diproses cepat untuk kebutuhan setup mendadak, upgrade kompetitif, atau workflow harian.",
        href: "contact.html",
        label: "Hubungi Support",
      },
    };

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      requestAnimationFrame(() => {
        document.querySelectorAll(".reveal:not(.active)").forEach((element) => {
          const rect = element.getBoundingClientRect();
          const isVisible =
            rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
          if (isVisible) element.classList.add("active");
        });
      });
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const data = content[trigger.dataset.trust] || content.stock;
        title.textContent = data.title;
        copy.textContent = data.copy;
        link.href = data.href;
        link.textContent = data.label;
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        closeBtn.focus();
      });
    });

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("open")) {
        closeModal();
      }
    });
  }

  function initSearch() {
    const bar = document.querySelector(".search-bar");
    const cards = document.querySelectorAll(
      ".product-card, .catalog-product-card, .related-card",
    );
    const range =
      document.querySelector("#priceRange") ||
      document.querySelector(".price-range input[type='range']");
    const sortSelect =
      document.getElementById("sortSelect") ||
      document.getElementById("sort-select");
    const countLabel = document.getElementById("catalogCount");
    const categoryButtons = document.querySelectorAll(
      ".category-pills .tag-chip",
    );
    if (!cards.length) return;

    const productCards = document.querySelectorAll(
      ".product-card, .catalog-product-card",
    );
    const productGrid = document.querySelector(".catalog-product-grid");
    const productCardList = Array.from(productCards);
    productCardList.forEach((card, index) => {
      card.dataset.originalOrder = String(index);
    });
    const setupPresets = {
      gaming: { category: "all", search: "", maxPrice: null },
      productivity: { category: "peripherals", search: "", maxPrice: null },
      streaming: { category: "audio", search: "", maxPrice: null },
      budget: { category: "all", search: "", maxPrice: 5000000 },
    };
    const params = new URLSearchParams(window.location.search);
    const setup = params.get("setup");
    const categoryParam = params.get("category");
    const preset = setupPresets[setup] || null;
    let activeCategory = categoryParam || preset?.category || "all";

    function getCheckedFilters(type) {
      return Array.from(
        document.querySelectorAll(
          `.filter-option input[data-filter-type='${type}']:checked`,
        ),
      ).map((input) => input.value.toLowerCase());
    }

    function getCardPrice(card) {
      const cartButton = card.querySelector("[data-price]");
      if (cartButton?.dataset.price) {
        return parseInt(cartButton.dataset.price, 10) || 0;
      }

      const priceEl = card.querySelector(
        ".price, .product-price, .catalog-product-price, .product-card-price, .card-price, .related-bottom .price",
      );
      if (!priceEl) return 0;
      return parseInt(priceEl.textContent.replace(/[^\d]/g, ""), 10) || 0;
    }

    function getSearchText(card) {
      return [
        card.querySelector("h3, h4")?.textContent,
        card.querySelector(".desc")?.textContent,
        card.querySelector(".product-card-meta")?.textContent,
        card.querySelector(".quick-spec-row")?.textContent,
        card.querySelector(".product-card-badge")?.textContent,
        card.querySelector(".catalog-product-badge")?.textContent,
        card.dataset.category,
        card.dataset.brand,
        card.dataset.setup,
        card.dataset.stock,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    }

    function sortProducts() {
      if (!productGrid || !sortSelect) return;

      const sortedCards = [...productCardList].sort((a, b) => {
        if (sortSelect.value === "price-asc") {
          return getCardPrice(a) - getCardPrice(b);
        }

        if (sortSelect.value === "price-desc") {
          return getCardPrice(b) - getCardPrice(a);
        }

        return (
          Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder)
        );
      });

      sortedCards.forEach((card) => productGrid.appendChild(card));
    }

    function removeNoResults() {
      const empty = document.getElementById("no-results");
      if (empty) empty.remove();
    }

    function renderNoResults() {
      if (!productCards.length) return;

      const hasResults = Array.from(productCards).some(
        (card) => card.style.display !== "none",
      );

      if (hasResults) {
        removeNoResults();
        return;
      }

      if (document.getElementById("no-results")) return;

      const empty = document.createElement("div");
      empty.id = "no-results";
      empty.className = "catalog-empty-state";

      const text = document.createElement("p");
      text.innerHTML =
        "<strong>Gear tidak ditemukan</strong><span>Coba ubah kategori, turunkan filter harga, atau reset pencarian.</span>";

      const reset = document.createElement("button");
      reset.type = "button";
      reset.className = "btn btn-primary";
      reset.textContent = "Reset Filter";
      reset.addEventListener("click", () => {
        if (bar) bar.value = "";
        if (range) {
          const min = document.querySelector(".price-min");
          if (min) min.value = 0;
          range.value = range.max || 50000000;
          const label = document.querySelector(".price-label-max");
          if (label) {
            label.textContent = `${formatRupiah(0)}-${formatRupiah(parseInt(range.value))}`;
          }
        }
        activeCategory = "all";
        categoryButtons.forEach((button) => {
          button.classList.toggle("active", button.dataset.category === "all");
        });
        document
          .querySelectorAll(".filter-option input[type='checkbox']")
          .forEach((checkbox) => {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          });
        if (sortSelect) sortSelect.value = "newest";
        filterProducts();
      });

      empty.appendChild(text);
      empty.appendChild(reset);
      productCards[0].parentElement.appendChild(empty);
    }

    function filterProducts() {
      const term = bar ? bar.value.toLowerCase() : "";
      const minInput = document.querySelector(".price-min");
      const minPrice = minInput ? parseInt(minInput.value) : 0;
      const maxPrice = range ? parseInt(range.value) : Infinity;
      const selectedCategories = getCheckedFilters("category");
      const selectedBrands = getCheckedFilters("brand");
      const selectedAvailability = getCheckedFilters("availability");
      const selectedSetup = getCheckedFilters("setup");
      let visibleCount = 0;

      cards.forEach((card) => {
        const text = getSearchText(card);
        const price = getCardPrice(card);

        const matchSearch = text.includes(term);
        const category = card.dataset.category || "all";
        const brand = (card.dataset.brand || "").toLowerCase();
        const matchCategory =
          selectedCategories.length > 0
            ? selectedCategories.includes(category)
            : activeCategory === "all" || category === activeCategory;
        const matchBrand =
          selectedBrands.length === 0 || selectedBrands.includes(brand);
        const matchAvailability =
          selectedAvailability.length === 0 ||
          selectedAvailability.some((value) => text.includes(value));
        const matchSetup =
          selectedSetup.length === 0 ||
          selectedSetup.some((value) =>
            value
              .split(/\s+/)
              .filter(Boolean)
              .some((keyword) => text.includes(keyword)),
          );
        // If price is 0, we assume it's valid to avoid hiding things without a price tag
        const matchPrice =
          price === 0 || (price >= minPrice && price <= maxPrice);
        const isVisible =
          matchSearch &&
          matchCategory &&
          matchBrand &&
          matchAvailability &&
          matchSetup &&
          matchPrice;

        card.style.display = isVisible ? "" : "none";
        if (
          (card.classList.contains("product-card") ||
            card.classList.contains("catalog-product-card")) &&
          isVisible
        )
          visibleCount++;
      });

      if (countLabel) {
        countLabel.textContent = `${visibleCount} produk ditemukan`;
      }
      sortProducts();
      renderNoResults();
    }

    function setActiveCategory(category) {
      activeCategory = category || "all";
      categoryButtons.forEach((button) => {
        button.classList.toggle(
          "active",
          button.dataset.category === activeCategory,
        );
      });
      filterProducts();
    }

    if (preset) {
      if (bar && preset.search) bar.value = preset.search;
      if (range && preset.maxPrice) {
        range.value = preset.maxPrice;
        const label = document.querySelector(".price-label-max");
        if (label) label.textContent = `${formatRupiah(preset.maxPrice)}+`;
      }
    }

    categoryButtons.forEach((button) => {
      button.addEventListener("click", () => {
        document
          .querySelectorAll(".filter-option input[data-filter-type='category']")
          .forEach((checkbox) => {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event("change", { bubbles: true }));
          });
        setActiveCategory(button.dataset.category || "all");
      });
    });

    if (bar) bar.addEventListener("input", filterProducts);
    if (range) range.addEventListener("input", filterProducts);
    if (sortSelect) sortSelect.addEventListener("change", filterProducts);
    document.addEventListener("nexgear:filters-change", filterProducts);
    setActiveCategory(activeCategory);
  }

  /* â”€â”€ Add-to-Cart Buttons â”€â”€ */
  function initAddToCart() {
    document.querySelectorAll("[data-add-cart]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const name = btn.dataset.name || "Product";
        const price = parseFloat(btn.dataset.price) || 0;
        const silent = btn.classList.contains("catalog-action-btn--cart");
        Cart.add({ name, price, silent });
      });
    });
  }

  function initCatalogActionFeedback() {
    const catalog = document.querySelector(".page-catalog");
    if (!catalog) return;

    function readStorageSet(key) {
      try {
        const items = JSON.parse(localStorage.getItem(key) || "[]");
        return new Set(Array.isArray(items) ? items : []);
      } catch {
        return new Set();
      }
    }

    const compareSet = readStorageSet("nexgear_compare");
    const wishlistSet = readStorageSet("nexgear_wishlist");

    catalog.querySelectorAll(".single-product").forEach((card) => {
      const productId = card.dataset.id;
      if (!productId) return;

      if (wishlistSet.has(productId)) {
        card
          .querySelector(".catalog-action-btn--wishlist")
          ?.classList.add("is-active");
      }

      if (compareSet.has(productId)) {
        card
          .querySelector(".catalog-action-btn--compare")
          ?.classList.add("is-active");
      }
    });

    catalog.addEventListener("click", (event) => {
      const btn = event.target.closest(".catalog-action-btn");
      if (!btn) return;

      const card = btn.closest(".catalog-product-card, .single-product");
      if (!card) return;

      const productId = card.dataset.id || "";
      const storageId =
        productId ||
        card.querySelector(".product-title")?.textContent?.trim() ||
        "produk";
      const productTitle =
        card.querySelector(".product-title")?.textContent?.trim() || "Produk";

      if (btn.classList.contains("catalog-action-btn--cart")) {
        btn.classList.add("is-success");
        showNexToast(`${productTitle} ditambahkan ke keranjang`);

        setTimeout(() => {
          btn.classList.remove("is-success");
        }, 900);

        return;
      }

      if (btn.classList.contains("catalog-action-btn--wishlist")) {
        btn.classList.toggle("is-active");

        if (btn.classList.contains("is-active")) {
          wishlistSet.add(storageId);
          showNexToast(`${productTitle} ditambahkan ke wishlist`);
        } else {
          wishlistSet.delete(storageId);
          showNexToast(`${productTitle} dihapus dari wishlist`);
        }

        localStorage.setItem("nexgear_wishlist", JSON.stringify([...wishlistSet]));
        return;
      }

      if (btn.classList.contains("catalog-action-btn--compare")) {
        const isActive = btn.classList.contains("is-active");

        if (!isActive && compareSet.size >= 4) {
          showNexToast("Maksimal 4 produk untuk dibandingkan");
          return;
        }

        btn.classList.toggle("is-active");

        if (btn.classList.contains("is-active")) {
          compareSet.add(storageId);
          showNexToast(`${productTitle} ditambahkan ke perbandingan`);
        } else {
          compareSet.delete(storageId);
          showNexToast(`${productTitle} dihapus dari perbandingan`);
        }

        localStorage.setItem("nexgear_compare", JSON.stringify([...compareSet]));
        return;
      }

      if (btn.classList.contains("catalog-action-btn--quickview")) {
        btn.classList.add("is-loading");
        showNexToast("Membuka detail produk...");

        setTimeout(() => {
          window.location.href = `product-detail.html?id=${encodeURIComponent(productId)}`;
        }, 250);
      }
    });
  }

  function initCatalogEnhancements() {
    const cards = Array.from(
      document.querySelectorAll(".catalog-product-card"),
    );
    if (!cards.length) return;
    if (document.body?.classList.contains("page-catalog")) return;

    const quickSpecs = {
      "ROG Strix G16": ["RTX", "165Hz", "16GB"],
      "Huntsman V3 Pro": ["Analog", "RGB", "Wired"],
      "Alienware 27": ["280Hz", "1ms", "IPS"],
      "RTX 4070 Ti Super": ["16GB", "DLSS", "RTX"],
      "Arctis Nova 7": ["Wireless", "Clear Mic", "Multi-platform"],
      "G Pro X Superlight 2": ["Wireless", "Ultra light", "Esports"],
      "Corsair K70 Max RGB": ["Magnetic", "RGB", "Wired"],
      "MSI Raider GE78 HX": ["QHD", "RTX", "DDR5"],
      "Samsung Odyssey G7": ["Curved", "QHD", "Smooth"],
      "Ryzen 7 7800X3D": ["AM5", "3D Cache", "Gaming"],
      "Vengeance RGB 32GB": ["32GB", "DDR5", "RGB"],
      "HyperX Cloud III Wireless": ["Wireless", "Boom Mic", "Comfort"],
      "Elgato Wave:3": ["USB", "Cardioid", "Streaming"],
    };

    cards.forEach((card) => {
      const name =
        card
          .querySelector(
            ".catalog-product-title, .creator-product-title, .product-title, h4, h3",
          )
          ?.textContent.trim() || "";
      const specs = quickSpecs[name] || [
        card.dataset.brand || "NEXGEAR",
        card.dataset.category || "Gear",
      ];
      const meta = card.querySelector(".product-card-meta");

      if (meta && !card.querySelector(".quick-spec-row")) {
        const row = document.createElement("div");
        row.className = "quick-spec-row";
        row.innerHTML = specs.map((spec) => `<span>${spec}</span>`).join("");
        meta.insertAdjacentElement("afterend", row);
      }
    });
  }

  function initCatalogCardLinks() {
    const cards = document.querySelectorAll(".catalog-product-card");
    if (!cards.length) return;

    function slugify(value) {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }

    function getProductUrl(card) {
      const name =
        card
          .querySelector(
            ".catalog-product-title, .creator-product-title, .product-title, h4, h3",
          )
          ?.textContent.trim() || "product";
      return `product.html?product=${encodeURIComponent(slugify(name))}`;
    }

    function shouldIgnoreRedirect(target) {
      return Boolean(
        target.closest("button, a, input, select, textarea, label"),
      );
    }

    cards.forEach((card) => {
      card.setAttribute("role", "link");
      card.setAttribute("tabindex", "0");
      card.setAttribute(
        "aria-label",
        `Lihat detail ${
          card
            .querySelector(
              ".catalog-product-title, .creator-product-title, .product-title, h4, h3",
            )
            ?.textContent.trim() || "produk"
        }`,
      );

      card.addEventListener("click", (event) => {
        if (shouldIgnoreRedirect(event.target)) return;
        window.location.href = getProductUrl(card);
      });

      card.addEventListener("keydown", (event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        window.location.href = getProductUrl(card);
      });
    });
  }

  /* â”€â”€ Set Active Nav Link â”€â”€ */
  function setActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        link.classList.add("active");
      }
    });
  }

  /* â”€â”€ Random slight rotations for sketch cards â”€â”€ */
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

  /* â”€â”€ Filter Drawer (catalog) â”€â”€ */
  function initFilterDrawer() {
    const openBtn = document.getElementById("openFilterBtn");
    const closeBtn = document.getElementById("closeFilterBtn");
    const clearBtn = document.getElementById("clearFiltersBtn");
    const applyBtn = document.getElementById("applyFiltersBtn");
    const overlay = document.getElementById("filterOverlay");
    const drawer = document.getElementById("filterDrawer");
    const badge = document.getElementById("filterBadge");
    const activeFiltersList = document.getElementById("activeFiltersList");
    const heroFilterTriggers = document.querySelectorAll("[data-open-filter]");

    if (!openBtn || !drawer) return;

    function syncPricePresetButtons() {
      const range = drawer.querySelector(".price-range");
      const min = drawer.querySelector(".price-min");
      const buttons = drawer.querySelectorAll("[data-price-preset]");
      if (!range || !buttons.length) return;

      buttons.forEach((button) => {
        const buttonMin = button.dataset.priceMin || "0";
        const currentMin = min?.value || "0";
        const isActive =
          String(button.dataset.pricePreset) === String(range.value) &&
          String(buttonMin) === String(currentMin);
        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function renderActiveFilters() {
      // Get all checked filters
      const checkboxes = drawer.querySelectorAll(
        ".filter-option input[type='checkbox']:checked",
      );
      const range = drawer.querySelector(".price-range");
      const min = drawer.querySelector(".price-min");
      const minPrice = min ? parseInt(min.value) : 0;
      const maxPrice = range ? parseInt(range.value) : 50000000;

      const filters = [];

      // Collect category filters
      checkboxes.forEach((cb) => {
        const label = cb.parentElement.textContent.trim();
        filters.push({ name: label, element: cb });
      });

      // Add price filter if not at max
      if (minPrice > 0 || maxPrice < 50000000) {
        filters.push({
          name:
            minPrice >= 20000000 && maxPrice >= 50000000
              ? `Harga: ${formatRupiah(minPrice)}+`
              : `Harga: ${formatRupiah(minPrice)}-${formatRupiah(maxPrice)}`,
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
            const min = drawer.querySelector(".price-min");
            if (min) min.value = 0;
            range.value = 50000000;
            const label = drawer.querySelector(".price-label-max");
            if (label)
              label.textContent = `${formatRupiah(0)}-${formatRupiah(50000000)}`;
            range.dispatchEvent(new Event("input", { bubbles: true }));
            syncPricePresetButtons();
            updateBadge();
          } else if (filter.element) {
            filter.element.checked = false;
            filter.element.dispatchEvent(
              new Event("change", { bubbles: true }),
            );
            document.dispatchEvent(new CustomEvent("nexgear:filters-change"));
          }
        });

        chip.appendChild(label);
        chip.appendChild(removeBtn);
        activeFiltersList.appendChild(chip);
      });

      // Show/hide container
      activeFiltersList.style.display = filters.length > 0 ? "flex" : "none";
      syncPricePresetButtons();
    }

    function updateBadge() {
      const checkboxes = drawer.querySelectorAll(
        ".filter-option input[type='checkbox']:checked",
      );
      const range = drawer.querySelector(".price-range");
      const maxPrice = range ? parseInt(range.value) : 50000000;
      const hasPrice = maxPrice < 50000000;
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
        const min = drawer.querySelector(".price-min");
        if (min) min.value = 0;
        range.value = 50000000;
        const label = drawer.querySelector(".price-label-max");
        if (label)
          label.textContent = `${formatRupiah(0)}-${formatRupiah(50000000)}`;
      }
      syncPricePresetButtons();
      updateBadge();
      document.dispatchEvent(new CustomEvent("nexgear:filters-change"));
    }

    function applyFilters() {
      // Trigger search/filter logic
      const range = drawer.querySelector(".price-range");
      if (range) {
        range.dispatchEvent(new Event("input", { bubbles: true }));
      }
      document.dispatchEvent(new CustomEvent("nexgear:filters-change"));
      closeFilter();
    }

    openBtn.addEventListener("click", openFilter);
    heroFilterTriggers.forEach((trigger) => {
      trigger.addEventListener("click", openFilter);
    });
    if (closeBtn) closeBtn.addEventListener("click", closeFilter);
    if (clearBtn) clearBtn.addEventListener("click", clearFilters);
    if (applyBtn) applyBtn.addEventListener("click", applyFilters);
    overlay.addEventListener("click", closeFilter);

    drawer.querySelectorAll("[data-price-preset]").forEach((button) => {
      button.addEventListener("click", () => {
        const range = drawer.querySelector(".price-range");
        const min = drawer.querySelector(".price-min");
        if (!range) return;

        if (min) min.value = button.dataset.priceMin || 0;
        range.value = button.dataset.pricePreset || range.max || 50000000;
        const label = drawer.querySelector(".price-label-max");
        if (label) {
          const minValue = min ? parseInt(min.value) : 0;
          const maxValue = parseInt(range.value);
          label.textContent =
            minValue >= 20000000 && maxValue >= 50000000
              ? `${formatRupiah(minValue)}+`
              : `${formatRupiah(minValue)}-${formatRupiah(maxValue)}`;
        }
        range.dispatchEvent(new Event("input", { bubbles: true }));
        syncPricePresetButtons();
        updateBadge();
      });
    });

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

  function initCatalogFilterBar() {
    const button = document.querySelector(".catalog-filter-btn");
    const bar = document.querySelector("#catalog-filter-bar");

    if (!button || !bar) return;

    let filterBarTimer;
    let onFilterBarTransitionEnd;

    button.addEventListener("click", () => {
      const willOpen = bar.hidden || !bar.classList.contains("is-open");

      clearTimeout(filterBarTimer);
      if (onFilterBarTransitionEnd) {
        bar.removeEventListener("transitionend", onFilterBarTransitionEnd);
        onFilterBarTransitionEnd = null;
      }

      if (willOpen) {
        bar.hidden = false;
        button.classList.add("is-active");
        button.setAttribute("aria-expanded", "true");
        requestAnimationFrame(() => {
          bar.classList.add("is-open");
        });
        return;
      }

      bar.classList.remove("is-open");
      bar.querySelectorAll("[data-filter-dropdown-menu]").forEach((menu) => {
        menu.hidden = true;
        menu.classList.remove("is-open");
      });
      bar.querySelectorAll("[data-filter-dropdown-trigger]").forEach((trigger) => {
        trigger.setAttribute("aria-expanded", "false");
        trigger.closest(".catalog-filter-dropdown")?.classList.remove("is-open");
      });
      button.classList.remove("is-active");
      button.setAttribute("aria-expanded", "false");

      onFilterBarTransitionEnd = (event) => {
        if (event.target !== bar || event.propertyName !== "max-height") return;
        bar.hidden = true;
        bar.removeEventListener("transitionend", onFilterBarTransitionEnd);
        onFilterBarTransitionEnd = null;
      };

      bar.addEventListener("transitionend", onFilterBarTransitionEnd);
      filterBarTimer = setTimeout(() => {
        bar.hidden = true;
        if (onFilterBarTransitionEnd) {
          bar.removeEventListener("transitionend", onFilterBarTransitionEnd);
          onFilterBarTransitionEnd = null;
        }
      }, 280);
    });
  }

  function initCatalogFilterDropdowns() {
    const bar = document.querySelector("#catalog-filter-bar");
    if (!bar) return;

    const triggers = Array.from(
      bar.querySelectorAll("[data-filter-dropdown-trigger]"),
    );
    const menus = Array.from(bar.querySelectorAll("[data-filter-dropdown-menu]"));

    function closeMenu(trigger) {
      const menuId = trigger.getAttribute("aria-controls");
      const menu = menuId ? document.getElementById(menuId) : null;

      trigger.setAttribute("aria-expanded", "false");
      trigger.closest(".catalog-filter-dropdown")?.classList.remove("is-open");

      if (!menu) return;
      menu.classList.remove("is-open");
      menu.hidden = true;
    }

    function closeAll(exceptTrigger) {
      triggers.forEach((trigger) => {
        if (trigger !== exceptTrigger) closeMenu(trigger);
      });
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const menuId = trigger.getAttribute("aria-controls");
        const menu = menuId ? document.getElementById(menuId) : null;
        if (!menu) return;

        const willOpen = menu.hidden;
        closeAll(trigger);

        trigger.setAttribute("aria-expanded", String(willOpen));
        trigger.closest(".catalog-filter-dropdown")?.classList.toggle("is-open", willOpen);
        menu.hidden = !willOpen;

        if (willOpen) {
          requestAnimationFrame(() => {
            menu.classList.add("is-open");
          });
        } else {
          menu.classList.remove("is-open");
        }
      });
    });

    menus.forEach((menu) => {
      menu.querySelectorAll(".catalog-filter-apply").forEach((button) => {
        button.addEventListener("click", () => {
          const dropdown = button.closest(".catalog-filter-dropdown");
          const trigger = dropdown?.querySelector("[data-filter-dropdown-trigger]");
          if (trigger) closeMenu(trigger);
        });
      });
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest("#catalog-filter-bar")) return;
      closeAll();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeAll();
    });
  }

  /* INIT */
  function initMiniCartDropdownRemove() {
    document
      .querySelectorAll(".mini-cart-dropdown .mini-cart-remove")
      .forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();

          const item = button.closest(".mini-cart-item");
          if (item) item.remove();
        });
      });
  }

  function initCategoryPanel() {
    const shell = document.querySelector(".category-dropdown-shell");
    if (!shell) return;

    const mainItems = shell.querySelectorAll(
      ".category-main-item[data-panel-target]",
    );
    const panels = shell.querySelectorAll(".category-sub-panel[data-panel]");
    if (!mainItems.length || !panels.length) return;

    function activatePanel(target) {
      shell.classList.add("has-active-panel");
      mainItems.forEach((item) => {
        item.classList.toggle("is-active", item.dataset.panelTarget === target);
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.panel === target);
      });
    }

    function deactivateAll() {
      shell.classList.remove("has-active-panel");
      mainItems.forEach((item) => item.classList.remove("is-active"));
      panels.forEach((panel) => panel.classList.remove("is-active"));
    }

    const subCol = shell.querySelector(".category-dropdown-sub");

    mainItems.forEach((item) => {
      const target = item.dataset.panelTarget;
      item.addEventListener("mouseenter", () => activatePanel(target));
      item.addEventListener("focus", () => activatePanel(target));
      item.addEventListener("mouseleave", (event) => {
        const related = event.relatedTarget;
        if (
          related &&
          (item.contains(related) ||
            subCol?.contains(related) ||
            related.closest?.(".category-main-item"))
        ) {
          return;
        }
        deactivateAll();
      });
    });

    subCol?.addEventListener("mouseleave", (event) => {
      const related = event.relatedTarget;
      if (related?.closest?.(".category-main-item")) return;
      deactivateAll();
    });

    const dropdownCat = shell.closest(".dropdown-cat");
    if (dropdownCat) {
      const parent = dropdownCat.closest(".nav-item");
      parent?.addEventListener("mouseleave", deactivateAll);
    }
  }

  function initCartEmptyGuidance() {
    window.updateCartEmptyGuidance = () => {
      document.querySelectorAll(".cart-btn").forEach((button) => {
        const isEmpty = Cart.count === 0;
        button.classList.toggle("cart-empty", isEmpty);
        button.setAttribute(
          "aria-label",
          isEmpty ? "Keranjang kosong, pilih gear dulu" : "Buka keranjang",
        );
      });
    };

    window.updateCartEmptyGuidance();
  }

  function initFooterReveal() {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;

    if (!("IntersectionObserver" in window)) {
      footer.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        footer.classList.toggle("is-visible", entry.isIntersecting);
      },
      { threshold: 0.04 },
    );

    observer.observe(footer);
  }

  function syncFooterRevealSpace() {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;

    const setFooterSpace = () => {
      const footerHeight = footer.offsetHeight || 0;
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const mode = document.body?.dataset?.footerReveal || "normal";

      const revealSpace =
        mode === "compact"
          ? Math.round(
              Math.min(Math.max(footerHeight * 0.62, viewportHeight * 0.34), 380),
            )
          : Math.ceil(footerHeight);

      document.documentElement.style.setProperty(
        "--footer-reveal-space",
        `${revealSpace}px`,
      );
    };

    setFooterSpace();
    window.addEventListener("resize", setFooterSpace, { passive: true });
    window.addEventListener("load", setFooterSpace, { once: true });

    // Use ResizeObserver if available to watch for footer height changes
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(setFooterSpace);
      observer.observe(footer);
    }

    // Also listen for image load events on all footer images
    footer.querySelectorAll("img").forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", setFooterSpace, { once: true });
        img.addEventListener("error", setFooterSpace, { once: true });
      }
    });
  }

  function initPromoWindowReveal() {
    const promoWindow = document.querySelector(".promo-window");
    if (!promoWindow) return;

    if (!("IntersectionObserver" in window)) {
      promoWindow.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        promoWindow.classList.toggle("is-visible", entry.isIntersecting);
      },
      { threshold: 0.18 },
    );

    observer.observe(promoWindow);
  }

  function initShowcaseFilters() {
    const section = document.querySelector(".showcase-section");
    if (!section) return;

    const buttons = section.querySelectorAll("[data-showcase-filter]");
    const cards = section.querySelectorAll("[data-showcase-card]");
    if (!buttons.length || !cards.length) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.showcaseFilter || "all";

        buttons.forEach((btn) => {
          const isActive = btn === button;
          btn.classList.toggle("is-active", isActive);
          btn.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        cards.forEach((card) => {
          const tags = (card.dataset.showcaseCard || "")
            .split(" ")
            .filter(Boolean);
          const shouldShow = filter === "all" || tags.includes(filter);

          window.clearTimeout(card._showcaseFilterTimer);

          if (shouldShow) {
            card.classList.remove("is-hidden");
            requestAnimationFrame(() => {
              card.classList.remove("is-hiding");
            });
          } else {
            card.classList.add("is-hiding");
            card._showcaseFilterTimer = window.setTimeout(() => {
              card.classList.add("is-hidden");
            }, 180);
          }
        });
      });
    });
  }

  function initFooterGalleryAutoScroll() {
    const track = document.querySelector(".footer-gallery-track");
    if (!track) return;

    let paused = false;
    let frameId = null;

    const tick = () => {
      if (!paused && track.scrollWidth > track.clientWidth) {
        track.scrollLeft += 0.22;

        if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) {
          track.scrollLeft = 0;
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    track.addEventListener("mouseenter", () => {
      paused = true;
    });

    track.addEventListener("mouseleave", () => {
      paused = false;
    });

    track.addEventListener("focusin", () => {
      paused = true;
    });

    track.addEventListener("focusout", () => {
      paused = false;
    });

    tick();
  }

  function safeInit(fn) {
    try {
      if (typeof fn === "function") fn();
    } catch (e) {
      console.warn("NEXGEAR JS Warning:", e);
    }
  }

  function init() {
    document.body.classList.add("loaded", "js-enabled");

    const modules = [
      initNavbar,
      initMobileMenu,
      initReveal,
      initCountUp,
      initParallax,
      initPriceFilter,
      initGearFinder,
      initTrustModal,
      initCatalogEnhancements,
      initSearch,
      initAddToCart,
      initCatalogActionFeedback,
      initCatalogCardLinks,
      setActiveNav,
      initSketchRotations,
      initCatalogFilterBar,
      initCatalogFilterDropdowns,
      initFilterDrawer,
      initMiniCartDropdownRemove,
      initCategoryPanel,
      initCartEmptyGuidance,
      syncFooterRevealSpace,
      initPromoWindowReveal,
      initShowcaseFilters,
    ];

    modules.forEach((module) => safeInit(module));
    safeInit(() => Cart.updateBadge());
    safeInit(() => Auth.updateUI());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
