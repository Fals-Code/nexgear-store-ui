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
      if (window.updateCartEmptyGuidance) window.updateCartEmptyGuidance();
      if (window.updateStickyCartPreview) window.updateStickyCartPreview();
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

  /* ── Stat Count-Up ── */
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

  function initSetupBuilder() {
    const steps = document.querySelectorAll(".setup-step");
    const name = document.getElementById("setupBuilderName");
    const copy = document.getElementById("setupBuilderCopy");
    const items = document.getElementById("setupBuilderItems");
    const cta = document.getElementById("setupBuilderCta");
    if (!steps.length || !name || !copy || !items || !cta) return;

    const builds = {
      competitive: {
        name: "Competitive Core",
        copy:
          "Keyboard rapid trigger, monitor refresh tinggi, dan audio ringan untuk main kompetitif.",
        items: ["Huntsman V3 Pro", "Alienware 27", "Arctis Nova 7"],
        href: "catalog.html?setup=gaming",
      },
      creator: {
        name: "Meja Kreator",
        copy:
          "Display tajam, GPU kuat, dan headset jernih untuk edit, stream, dan meeting harian.",
        items: ["Alienware 27", "RTX 4070 Ti Super", "Arctis Nova 7"],
        href: "catalog.html?setup=streaming",
      },
      balanced: {
        name: "Balanced Starter",
        copy:
          "Mulai dari peripheral dan audio yang terasa langsung tanpa menaikkan budget terlalu jauh.",
        items: ["Huntsman V3 Pro", "Arctis Nova 7", "Setup Support"],
        href: "catalog.html?setup=budget",
      },
    };

    function render(buildKey) {
      const build = builds[buildKey] || builds.competitive;
      name.textContent = build.name;
      copy.textContent = build.copy;
      items.innerHTML = build.items.map((item) => `<span>${item}</span>`).join("");
      cta.href = build.href;

      steps.forEach((step) => {
        const isActive = step.dataset.build === buildKey;
        step.classList.toggle("active", isActive);
        step.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    steps.forEach((step) => {
      step.addEventListener("click", () => render(step.dataset.build));
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
        copy:
          "Produk pilihan diprioritaskan dari stok siap proses agar checkout tidak berakhir di estimasi yang abu-abu.",
        href: "catalog.html",
        label: "Lihat Catalog",
      },
      warranty: {
        title: "Garansi Resmi",
        copy:
          "Gear kurasi NEXGEAR diarahkan ke produk bergaransi resmi dengan dukungan brand dan invoice pembelian.",
        href: "about.html",
        label: "Baca Detail",
      },
      checkout: {
        title: "Secure Checkout",
        copy:
          "Alur checkout dibuat ringkas dengan ringkasan pesanan, validasi data, dan pembayaran yang jelas.",
        href: "cart.html",
        label: "Cek Keranjang",
      },
      delivery: {
        title: "Fast Delivery",
        copy:
          "Pesanan diproses cepat untuk kebutuhan setup mendadak, upgrade kompetitif, atau workflow harian.",
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
    const cards = document.querySelectorAll(".product-card, .related-card");
    const range = document.querySelector(".price-range");
    const sortSelect = document.getElementById("sortSelect");
    const countLabel = document.getElementById("catalogCount");
    const categoryButtons = document.querySelectorAll(
      ".category-pills .tag-chip",
    );
    if (!cards.length) return;

    const productCards = document.querySelectorAll(".product-card");
    const productGrid = document.querySelector(".catalog-product-grid");
    const productCardList = Array.from(productCards);
    productCardList.forEach((card, index) => {
      card.dataset.originalOrder = String(index);
    });
    const setupPresets = {
      gaming: { category: "all", search: "", maxPrice: null },
      productivity: { category: "peripherals", search: "", maxPrice: null },
      streaming: { category: "audio", search: "", maxPrice: null },
      budget: { category: "all", search: "", maxPrice: 250 },
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
      const priceEl = card.querySelector(
        ".price, .product-price, .product-card-price, .card-price, .related-bottom .price",
      );
      if (!priceEl) return 0;
      return parseFloat(priceEl.textContent.replace(/[^0-9.]/g, "")) || 0;
    }

    function getSearchText(card) {
      return [
        card.querySelector("h3, h4")?.textContent,
        card.querySelector(".desc")?.textContent,
        card.querySelector(".product-card-meta")?.textContent,
        card.querySelector(".quick-spec-row")?.textContent,
        card.querySelector(".product-card-badge")?.textContent,
        card.dataset.category,
        card.dataset.brand,
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

        return Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder);
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
          range.value = range.max || 5000;
          const label = document.querySelector(".price-label-max");
          if (label) {
            label.textContent = `$${parseInt(range.value).toLocaleString()}+`;
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
      const maxPrice = range ? parseInt(range.value) : Infinity;
      const selectedCategories = getCheckedFilters("category");
      const selectedBrands = getCheckedFilters("brand");
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
        // If price is 0, we assume it's valid to avoid hiding things without a price tag
        const matchPrice = price === 0 || price <= maxPrice;
        const isVisible =
          matchSearch && matchCategory && matchBrand && matchPrice;

        card.style.display = isVisible ? "" : "none";
        if (card.classList.contains("product-card") && isVisible) visibleCount++;
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
        if (label) label.textContent = `$${preset.maxPrice.toLocaleString()}+`;
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

  function initCatalogEnhancements() {
    const cards = Array.from(document.querySelectorAll(".catalog-product-card"));
    if (!cards.length) return;

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
      const name = card.querySelector("h4")?.textContent.trim() || "";
      const specs = quickSpecs[name] || [card.dataset.brand || "NEXGEAR", card.dataset.category || "Gear"];
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
      const name = card.querySelector("h4")?.textContent.trim() || "product";
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
        `Lihat detail ${card.querySelector("h4")?.textContent.trim() || "produk"}`,
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
    const heroFilterTriggers = document.querySelectorAll("[data-open-filter]");

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
            document.dispatchEvent(new CustomEvent("nexgear:filters-change"));
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
  function initStickyCartPreview() {
    if (document.querySelector(".sticky-cart-preview")) return;

    const preview = document.createElement("div");
    preview.className = "sticky-cart-preview";
    preview.innerHTML = `
      <div>
        <p class="sticky-cart-preview__label">Keranjang aktif</p>
        <strong class="sticky-cart-preview__total" id="stickyCartTotal">$0.00</strong>
      </div>
      <div class="sticky-cart-preview__actions">
        <button class="btn btn-outline sticky-cart-preview__button" type="button" id="stickyCartOpen">Review</button>
        <a class="btn btn-primary sticky-cart-preview__button" href="checkout.html">Checkout</a>
      </div>
    `;
    document.body.appendChild(preview);

    const total = document.getElementById("stickyCartTotal");
    const openBtn = document.getElementById("stickyCartOpen");

    window.updateStickyCartPreview = () => {
      const count = Cart.count;
      preview.classList.toggle("show", count > 0);
      if (total) total.textContent = `${count} item - $${Cart.total.toFixed(2)}`;
    };

    openBtn?.addEventListener("click", () => {
      if (window.openMiniCart) window.openMiniCart();
    });

    window.updateStickyCartPreview();
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

  function init() {
    document.body.classList.add("loaded");
    initNavbar();
    initMobileMenu();
    initReveal();
    initCountUp();
    initParallax();
    initPriceFilter();
    initGearFinder();
    initSetupBuilder();
    initTrustModal();
    initCatalogEnhancements();
    initSearch();
    initAddToCart();
    initCatalogCardLinks();
    setActiveNav();
    initSketchRotations();
    initFilterDrawer();
    initMiniCart();
    initStickyCartPreview();
    initCartEmptyGuidance();
    Cart.updateBadge();
    Auth.updateUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
