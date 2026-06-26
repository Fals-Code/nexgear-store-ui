(() => {
  "use strict";

  const formatRupiah = window.NexCurrency?.formatRupiah || window.formatRupiah;
  const Cart = window.NexCart;
  const showToast = window.NexToast?.show || window.showToast;
  const showNexToast = window.NexToast?.showCompact || window.showNexToast;

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

        localStorage.setItem(
          "nexgear_wishlist",
          JSON.stringify([...wishlistSet]),
        );
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

        localStorage.setItem(
          "nexgear_compare",
          JSON.stringify([...compareSet]),
        );
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
      bar
        .querySelectorAll("[data-filter-dropdown-trigger]")
        .forEach((trigger) => {
          trigger.setAttribute("aria-expanded", "false");
          trigger
            .closest(".catalog-filter-dropdown")
            ?.classList.remove("is-open");
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
    const menus = Array.from(
      bar.querySelectorAll("[data-filter-dropdown-menu]"),
    );

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
        trigger
          .closest(".catalog-filter-dropdown")
          ?.classList.toggle("is-open", willOpen);
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
          const trigger = dropdown?.querySelector(
            "[data-filter-dropdown-trigger]",
          );
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

  let initialized = false;

  function safeInit(initializer) {
    try {
      if (typeof initializer === "function") initializer();
    } catch (error) {
      console.warn("NEXGEAR NexCatalog warning:", error);
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;
    safeInit(initPriceFilter);
    safeInit(initGearFinder);
    safeInit(initCatalogEnhancements);
    safeInit(initSearch);
    safeInit(initAddToCart);
    safeInit(initCatalogActionFeedback);
    safeInit(initCatalogCardLinks);
    safeInit(initSketchRotations);
    safeInit(initFilterDrawer);
    safeInit(initCatalogFilterBar);
    safeInit(initCatalogFilterDropdowns);
  }

  window.NexCatalog = Object.freeze({ init });
})();
