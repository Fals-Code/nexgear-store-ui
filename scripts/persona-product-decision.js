(() => {
  "use strict";

  if (window.NexPersonaProductDecision) return;

  const page = window.location.pathname.split("/").pop() || "index.html";
  if (!["catalog.html", "product-detail.html"].includes(page)) return;

  const WISHLIST_KEY = "nexgear_wishlist";
  const COMPARE_KEY = "nexgear_compare";
  const CHECKOUT_INTENT_KEY = "nexgear_checkout_intent";

  const productSignals = {
    "vortex-vx-pro-mechanical": { rating: "4.8", reviews: "124", value: "Setup ringkas", warranty: "2 tahun" },
    "astro-a50-wireless-gen-4": { rating: "4.7", reviews: "89", value: "Audio premium", warranty: "2 tahun" },
    "zephyrus-g14-rtx-4060": { rating: "4.9", reviews: "76", value: "Performa tinggi", warranty: "2 tahun" },
    "logitech-g-pro-x-superlight": { rating: "4.8", reviews: "211", value: "Pilihan esports", warranty: "2 tahun" },
  };

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const readSet = (key) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      return new Set(Array.isArray(value) ? value : []);
    } catch {
      return new Set();
    }
  };

  const writeSet = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify([...value]));
    } catch {
      // Feedback visual tetap bekerja saat storage browser dibatasi.
    }
  };

  const notify = (message) => {
    const compact = window.NexToast?.showCompact || window.showNexToast;
    const standard = window.NexToast?.show || window.showToast;
    if (typeof compact === "function") compact(message);
    else if (typeof standard === "function") standard(message);
  };

  const fallbackCartAdd = (product) => {
    try {
      const items = JSON.parse(localStorage.getItem("nexgear_cart") || "[]");
      const normalized = Array.isArray(items) ? items : [];
      const existing = normalized.find((item) => item.name === product.name);
      if (existing) existing.qty = (Number(existing.qty) || 1) + product.qty;
      else normalized.push(product);
      localStorage.setItem("nexgear_cart", JSON.stringify(normalized));
    } catch {
      // Checkout tetap dibuka meskipun browser membatasi persistence.
    }
  };

  const addProduct = (product, { silent = false } = {}) => {
    const payload = { ...product, silent };
    if (window.NexCart?.add) window.NexCart.add(payload);
    else fallbackCartAdd(product);
  };

  const setCheckoutIntent = (product) => {
    try {
      sessionStorage.setItem(CHECKOUT_INTENT_KEY, JSON.stringify({
        source: "buy-now",
        productId: product.id,
        productName: product.name,
        createdAt: Date.now(),
      }));
    } catch {
      // Intent hanya membantu continuity, bukan syarat checkout.
    }
  };

  const buyNow = (product) => {
    addProduct(product, { silent: true });
    setCheckoutIntent(product);
    notify(`${product.name} siap dilanjutkan ke checkout`);
    window.setTimeout(() => {
      window.location.href = "checkout.html";
    }, 180);
  };

  const buildCardProduct = (card) => {
    const name = $(".product-title, .catalog-product-title, h3", card)?.textContent?.trim() || "Produk NEXGEAR";
    const price = Number(card.dataset.price) || Number($("[data-price]", card)?.dataset.price) || 0;
    const image = $("img", card)?.src || "";
    return {
      id: card.dataset.id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name,
      price,
      qty: 1,
      image,
    };
  };

  const createQualitySignals = (card) => {
    const id = card.dataset.id || "";
    const signal = productSignals[id] || {
      rating: "4.7",
      reviews: "50+",
      value: card.dataset.category === "machines" ? "Performa tinggi" : "Value teruji",
      warranty: "2 tahun",
    };

    const block = document.createElement("div");
    block.className = "persona-quality-signals";
    block.setAttribute("aria-label", "Ringkasan kualitas produk");
    block.innerHTML = `
      <span class="persona-quality-signals__rating"><b>★ ${signal.rating}</b><small>${signal.reviews} ulasan</small></span>
      <span><b>${signal.warranty}</b><small>garansi resmi</small></span>
      <span><b>Ready</b><small>${signal.value}</small></span>`;
    return block;
  };

  const createCatalogQuickPaths = () => {
    const grid = $(".catalog-product-grid");
    if (!grid || $("[data-persona-quick-paths]")) return;

    const section = document.createElement("section");
    section.className = "persona-quick-paths";
    section.dataset.personaQuickPaths = "true";
    section.setAttribute("aria-labelledby", "persona-quick-path-title");
    section.innerHTML = `
      <div>
        <span>FAST PICK</span>
        <h2 id="persona-quick-path-title">Pilih sesuai kebutuhan</h2>
        <p>Langsung ke kelompok gear yang paling relevan tanpa membuka filter satu per satu.</p>
      </div>
      <nav aria-label="Pilihan kebutuhan cepat">
        <a href="catalog.html?category=control">Setup Ringkas</a>
        <a href="catalog.html?setup=budget">Pilihan Hemat</a>
        <a href="catalog.html?setup=streaming">Streaming</a>
        <a href="catalog.html?category=machines">Performa Tinggi</a>
      </nav>`;

    const activeFilters = $("#activeFiltersList");
    if (activeFilters) activeFilters.insertAdjacentElement("afterend", section);
    else grid.insertAdjacentElement("beforebegin", section);
  };

  const enhanceCatalogCards = () => {
    $$(".page-catalog .catalog-product-card").forEach((card) => {
      if (card.dataset.personaDecision === "ready") return;
      card.dataset.personaDecision = "ready";

      const body = $(".part-2", card);
      if (!body) return;
      body.append(createQualitySignals(card));

      const actions = document.createElement("div");
      actions.className = "persona-card-decision";
      const detailHref = $(".product-title a", card)?.href || `product-detail.html?id=${encodeURIComponent(card.dataset.id || "")}`;
      actions.innerHTML = `
        <a href="${detailHref}" class="persona-card-decision__detail">Lihat Detail</a>
        <button type="button" class="persona-card-decision__buy">Beli Sekarang</button>`;

      $(".persona-card-decision__buy", actions).addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        buyNow(buildCardProduct(card));
      });

      body.append(actions);
    });
  };

  const getSelectedVariant = () => {
    const color = $(".color-choice.is-active")?.dataset.color || $(".color-dot.is-active, .color-dot.active")?.getAttribute("aria-label") || "Stealth Black";
    const switchType = $(".opt-btn.active, .option-btn.active, .option-btn.is-active")?.textContent?.trim() || "Linear Red";
    return `${color} · ${switchType}`;
  };

  const buildDetailProduct = () => {
    const button = $(".btn-add-cart");
    const name = button?.dataset.productName || $("#product-title")?.textContent?.trim() || "Produk NEXGEAR";
    const price = Number(button?.dataset.productPrice) || 0;
    const qty = Math.max(1, Number($(".qty-input")?.value) || 1);
    return {
      id: new URLSearchParams(window.location.search).get("id") || "vortex-vx-pro-mechanical",
      name,
      price,
      qty,
      image: $("#mainImage")?.src || "",
      variant: getSelectedVariant(),
    };
  };

  const createDetailEvidence = () => {
    // Product Detail intentionally uses a single source of truth from rendered review state.
    // No synthetic rating, verified-buyer, warranty, or stock evidence is injected here.
  };

  const bindDetailActions = () => {
    if (document.body.classList.contains("product-detail-reference")) return;

    const addButton = $(".btn-add-cart");
    const actionRow = $(".product-action-row");
    if (!addButton || !actionRow || actionRow.dataset.personaBound === "true") return;
    actionRow.dataset.personaBound = "true";

    addButton.addEventListener("click", (event) => {
      event.preventDefault();
      addProduct(buildDetailProduct());
      addButton.dataset.state = "success";
      const original = addButton.textContent;
      addButton.textContent = "Ditambahkan";
      window.setTimeout(() => {
        addButton.textContent = original;
        addButton.dataset.state = "idle";
      }, 1200);
    });

    const existingBuyButton = $("[data-product-action='buy'], .btn-buy-now, .persona-buy-now", actionRow);
    if (existingBuyButton) return;

    const buyButton = document.createElement("button");
    buyButton.type = "button";
    buyButton.className = "btn persona-buy-now";
    buyButton.textContent = "Beli Sekarang";
    buyButton.addEventListener("click", () => buyNow(buildDetailProduct()));
    actionRow.append(buyButton);
  };

  const bindDetailSecondaryActions = () => {
    if (document.body.classList.contains("product-detail-reference")) return;

    const container = $(".product-secondary-actions");
    const buttons = $$("button", container);
    if (!container || buttons.length < 2 || container.dataset.personaBound === "true") return;
    container.dataset.personaBound = "true";

    const product = buildDetailProduct();
    const wishlist = readSet(WISHLIST_KEY);
    const compare = readSet(COMPARE_KEY);
    const wishlistButton = buttons[0];
    const compareButton = buttons[1];

    const sync = () => {
      const wished = wishlist.has(product.id);
      const compared = compare.has(product.id);
      wishlistButton.classList.toggle("is-active", wished);
      wishlistButton.setAttribute("aria-pressed", String(wished));
      wishlistButton.textContent = wished ? "♥ Tersimpan di Wishlist" : "♡ Simpan Wishlist";
      compareButton.classList.toggle("is-active", compared);
      compareButton.setAttribute("aria-pressed", String(compared));
      compareButton.textContent = compared ? "✓ Masuk Perbandingan" : "⇄ Bandingkan";
    };

    wishlistButton.addEventListener("click", () => {
      if (wishlist.has(product.id)) {
        wishlist.delete(product.id);
        notify(`${product.name} dihapus dari wishlist`);
      } else {
        wishlist.add(product.id);
        notify(`${product.name} disimpan ke wishlist`);
      }
      writeSet(WISHLIST_KEY, wishlist);
      sync();
    });

    compareButton.addEventListener("click", () => {
      if (!compare.has(product.id) && compare.size >= 4) {
        notify("Maksimal 4 produk untuk dibandingkan");
        return;
      }
      if (compare.has(product.id)) {
        compare.delete(product.id);
        notify(`${product.name} dihapus dari perbandingan`);
      } else {
        compare.add(product.id);
        notify(`${product.name} masuk daftar perbandingan`);
      }
      writeSet(COMPARE_KEY, compare);
      sync();
    });

    sync();
  };

  const createMobileDecisionBar = () => {
    if (document.body.classList.contains("product-detail-reference")) return;
    if ($(".persona-mobile-buy-bar")) return;

    const price = $(".price-stack strong")?.textContent?.trim() || "Rp1.850.000";
    const bar = document.createElement("aside");
    bar.className = "persona-mobile-buy-bar";
    bar.setAttribute("aria-label", "Aksi pembelian cepat");
    bar.innerHTML = `<div><span>Total produk</span><strong>${price}</strong></div><button type="button">Beli Sekarang</button>`;
    $("button", bar).addEventListener("click", () => buyNow(buildDetailProduct()));
    document.body.append(bar);
  };

  const initCatalog = () => {
    createCatalogQuickPaths();
    enhanceCatalogCards();
    document.body.dataset.personaProductPhase = "decision-ready";
  };

  const initProductDetail = () => {
    createDetailEvidence();
    bindDetailActions();
    bindDetailSecondaryActions();
    createMobileDecisionBar();
    document.body.dataset.personaProductPhase = "decision-ready";
  };

  const init = () => {
    if (page === "catalog.html") initCatalog();
    if (page === "product-detail.html") initProductDetail();
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  window.NexPersonaProductDecision = Object.freeze({
    buyNow,
    refresh: init,
  });
})();
