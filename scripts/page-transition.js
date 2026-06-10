(function () {
  if (window.__nexgearPageTransitionReady) return;
  window.__nexgearPageTransitionReady = true;

  const STORAGE_KEY = "nexgear-page-transition-mode";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TIMING = {
    diamondLeave: 1520,
    diamondEnter: 1960,
    catalogInitialLoad: 1440,
    catalogSoftLoad: 840,
  };
  const DIAMOND_PANELS = [
    "page-transition__panel--a",
    "page-transition__panel--b",
    "page-transition__panel--c",
    "page-transition__panel--d",
  ];

  let catalogLoadingTimer = 0;

  function getFileName(url) {
    const file = url.pathname.toLowerCase().split("/").pop();
    return file || "index.html";
  }

  function isLoginPage(url) {
    return getFileName(url) === "login.html";
  }

  function isIndexPage(url) {
    return getFileName(url) === "index.html";
  }

  function isCatalogPage() {
    return document.body?.classList.contains("page-catalog") || getFileName(new URL(window.location.href)) === "catalog.html";
  }

  function isLoginToIndex(targetUrl) {
    return isLoginPage(new URL(window.location.href)) && isIndexPage(targetUrl);
  }

  function saveEnterMode(mode) {
    try {
      sessionStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {}
  }

  function takeEnterMode() {
    try {
      const mode = sessionStorage.getItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
      return mode;
    } catch (error) {
      return null;
    }
  }

  function shouldSkipLink(link, event) {
    if (!link || !link.href) return true;
    if (link.dataset.noTransition === "true") return true;
    if (link.target === "_blank") return true;
    if (link.hasAttribute("download")) return true;
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return true;

    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin) return true;
    if (url.protocol === "mailto:" || url.protocol === "tel:") return true;

    const samePage = url.pathname === window.location.pathname && url.search === window.location.search;
    if (samePage && url.hash) return true;
    if (url.href === window.location.href) return true;

    return false;
  }

  function createDiamondLayer() {
    if (!document.body) return null;

    let layer = document.querySelector(".page-transition");
    if (!layer) {
      layer = document.createElement("div");
      layer.className = "page-transition";
      layer.setAttribute("aria-hidden", "true");
      document.body.prepend(layer);
    }

    let brand = layer.querySelector(".page-transition__brand");
    DIAMOND_PANELS.forEach(function (panelClass) {
      if (layer.querySelector("." + panelClass)) return;
      const panel = document.createElement("span");
      panel.className = "page-transition__panel " + panelClass;
      if (brand) layer.insertBefore(panel, brand);
      else layer.appendChild(panel);
    });

    if (!brand) {
      brand = document.createElement("span");
      brand.className = "page-transition__brand";
      brand.textContent = "NEXGEAR";
      layer.appendChild(brand);
    }

    return layer;
  }

  function lockTransitionLayer(layer) {
    if (layer) layer.classList.add("page-transition--locked");
  }

  function unlockTransitionLayer(layer) {
    if (layer) layer.classList.remove("page-transition--locked");
  }

  function clearPreloadClasses() {
    document.documentElement.classList.remove("pt-preload-open", "pt-preload-simple");
  }

  function clearTransitionClasses() {
    if (!document.body) return;
    document.body.classList.remove(
      "pt-leaving",
      "pt-entering-open",
      "pt-entering-closed",
      "pt-opening",
      "pt-simple-leaving",
      "pt-simple-entering",
      "pt-simple-opening",
    );
  }

  function waitForDiamond(layer, fallbackMs, callback) {
    const panel = layer?.querySelector(".page-transition__panel--a");
    let done = false;

    function finish() {
      if (done) return;
      done = true;
      if (panel) panel.removeEventListener("transitionend", onEnd);
      callback();
    }

    function onEnd(event) {
      if (event.propertyName === "margin-left") finish();
    }

    if (panel) panel.addEventListener("transitionend", onEnd);
    window.setTimeout(finish, fallbackMs);
  }

  function goTo(url) {
    window.location.href = url.href;
  }

  function startDiamondLeave(targetUrl, enterMode) {
    if (reduceMotion.matches) {
      goTo(targetUrl);
      return;
    }

    const layer = createDiamondLayer();
    if (!layer) {
      goTo(targetUrl);
      return;
    }

    lockTransitionLayer(layer);
    clearTransitionClasses();
    saveEnterMode(enterMode);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add("pt-leaving");
        waitForDiamond(layer, TIMING.diamondLeave, function () {
          window.setTimeout(function () {
            goTo(targetUrl);
          }, 80);
        });
      });
    });
  }

  function startLoginEnter() {
    const layer = createDiamondLayer();
    if (!layer || !document.body) {
      clearPreloadClasses();
      return;
    }

    unlockTransitionLayer(layer);
    clearTransitionClasses();
    document.body.classList.add("pt-entering-closed");
    clearPreloadClasses();

    requestAnimationFrame(function () {
      document.body.classList.remove("pt-entering-closed");
    });
  }

  function startDiamondOpenEnter() {
    if (reduceMotion.matches) {
      clearPreloadClasses();
      return;
    }

    const layer = createDiamondLayer();
    if (!layer || !document.body) {
      clearPreloadClasses();
      return;
    }

    lockTransitionLayer(layer);
    document.documentElement.classList.add("pt-preload-open");
    clearTransitionClasses();
    document.body.classList.add("pt-entering-open");
    void layer.offsetHeight;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add("pt-opening");
        clearPreloadClasses();
        window.setTimeout(function () {
          document.body.classList.remove("pt-entering-open", "pt-opening");
          unlockTransitionLayer(layer);
        }, TIMING.diamondEnter + 140);
      });
    });
  }

  function createCatalogWireframe() {
    const grid = document.querySelector(".catalog-product-grid, .catalog-grid");
    if (!grid || document.querySelector(".catalog-loading-wireframe")) return;

    const skeleton = document.createElement("div");
    skeleton.className = "catalog-loading-wireframe";
    skeleton.hidden = true;
    skeleton.setAttribute("aria-hidden", "true");
    skeleton.innerHTML = `
      <div class="catalog-loading-head">
        <span>Loading catalog</span>
        <strong>Menyiapkan gear pilihan...</strong>
      </div>
      <div class="catalog-loading-grid">
        ${Array.from({ length: 8 }).map(function () {
          return `<article class="catalog-loading-card"><div class="catalog-loading-media"></div><div class="catalog-loading-line catalog-loading-line--title"></div><div class="catalog-loading-line catalog-loading-line--short"></div></article>`;
        }).join("")}
      </div>
    `;
    grid.insertAdjacentElement("beforebegin", skeleton);
  }

  function setCatalogLoading(isLoading) {
    if (!isCatalogPage() || !document.body) return;
    const skeleton = document.querySelector(".catalog-loading-wireframe");
    const grid = document.querySelector(".catalog-product-grid, .catalog-grid");
    if (!skeleton || !grid) return;

    document.body.classList.toggle("catalog-data-loading", isLoading);
    skeleton.hidden = !isLoading;
    skeleton.setAttribute("aria-hidden", isLoading ? "false" : "true");
  }

  function showCatalogLoading(duration) {
    if (!isCatalogPage()) return;
    createCatalogWireframe();
    setCatalogLoading(true);
    window.clearTimeout(catalogLoadingTimer);
    catalogLoadingTimer = window.setTimeout(function () {
      setCatalogLoading(false);
    }, duration);
  }

  function initCatalogLoadingWireframe() {
    if (!isCatalogPage()) return;
    createCatalogWireframe();
    showCatalogLoading(TIMING.catalogInitialLoad);

    document.addEventListener("change", function (event) {
      const target = event.target;
      if (target && (target.matches("#sortSelect") || target.matches(".catalog-filter-option input"))) {
        showCatalogLoading(TIMING.catalogSoftLoad);
      }
    });

    document.addEventListener("click", function (event) {
      const button = event.target.closest(".catalog-filter-apply, .catalog-filter-btn, [data-filter-dropdown-trigger]");
      if (button) showCatalogLoading(TIMING.catalogSoftLoad);
    });
  }

  function initProductDetailControls() {
    if (!document.body?.classList.contains("page-product-detail")) return;

    const styleId = "nexgear-product-detail-controls-css";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .page-product-detail .product-main-media::before,
        .page-product-detail .product-gallery-panel::before,
        .page-product-detail .product-gallery-panel::after,
        .page-product-detail .option-group:nth-child(2) .option-btns::after { content: none !important; display: none !important; }
        .page-product-detail .product-detail-shell { padding-top: clamp(24px, 3vw, 42px); }
        .page-product-detail .product-hero-grid { grid-template-columns: minmax(0, 0.98fr) minmax(420px, 0.88fr) !important; gap: clamp(48px, 6vw, 88px) !important; align-items: start !important; }
        .page-product-detail .product-gallery-panel { min-width: 0; }
        .page-product-detail .product-main-media { position: relative; overflow: hidden; min-height: clamp(510px, 41vw, 610px) !important; border-radius: 28px !important; border-color: rgba(148, 163, 184, 0.13) !important; box-shadow: 0 34px 90px rgba(0, 0, 0, 0.34) !important; }
        .page-product-detail .product-media-badge { top: 18px !important; left: 18px !important; min-height: 28px !important; padding: 0 14px !important; font-size: 0.64rem !important; }
        .page-product-detail .product-buy-panel { max-width: 590px; padding: clamp(8px, 1.2vw, 18px) 0 0 !important; }
        .page-product-detail .product-buy-panel::before { margin-bottom: 16px !important; color: rgba(226, 232, 240, 0.62) !important; font-size: 0.68rem !important; letter-spacing: 0.13em !important; }
        .page-product-detail .product-title-lg { max-width: 520px !important; margin-bottom: 12px !important; color: #ffffff !important; font-size: clamp(2.15rem, 3vw, 3.15rem) !important; line-height: 0.98 !important; }
        .page-product-detail .product-meta-row { display: grid !important; grid-template-columns: 1fr !important; gap: 8px !important; margin-bottom: 18px !important; }
        .page-product-detail .product-desc { max-width: 56ch !important; margin-bottom: 26px !important; color: #ffffff !important; font-size: 0.94rem !important; line-height: 1.62 !important; -webkit-line-clamp: 2 !important; }
        .page-product-detail .rating strong,
        .page-product-detail .product-sku,
        .page-product-detail .description-copy p,
        .page-product-detail .product-spec-card--inside h2,
        .page-product-detail .specs-table th,
        .page-product-detail .specs-table td { color: #ffffff !important; }
        .page-product-detail .product-options { gap: 16px !important; margin-bottom: 24px !important; }
        .page-product-detail .option-group { grid-template-columns: minmax(116px, 0.32fr) minmax(0, 1fr) !important; gap: 22px !important; border: none !important; }
        .page-product-detail .option-group label { color: #ffffff !important; font-size: 0.76rem !important; letter-spacing: 0.1em !important; }
        .page-product-detail .color-options { gap: 10px !important; }
        .page-product-detail .color-dot { width: 34px !important; height: 34px !important; }
        .page-product-detail .switch-select { width: min(100%, 230px); min-height: 46px; padding: 0 42px 0 14px; border: 1px solid rgba(148, 163, 184, 0.24); border-radius: 10px; background: rgba(255, 255, 255, 0.035); color: #ffffff; font: inherit; font-size: 0.84rem; font-weight: 800; appearance: auto; cursor: pointer; }
        .page-product-detail .switch-select:focus { outline: none; border-color: rgba(0, 229, 255, 0.52); box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.08); }
        .page-product-detail .switch-select option { color: #06101d; background: #f8fafc; }
        .page-product-detail .price-action-card { display: flex !important; align-items: center !important; justify-content: space-between !important; flex-wrap: wrap !important; column-gap: clamp(26px, 4vw, 48px) !important; row-gap: 16px !important; margin-top: 22px !important; padding: 24px 0 20px !important; border: none !important; border-top: none !important; border-bottom: none !important; background: transparent !important; overflow: visible !important; }
        .page-product-detail .price-stack { flex: 1 1 258px !important; min-width: 248px !important; max-width: 328px !important; display: flex !important; align-items: flex-start !important; flex-wrap: wrap !important; gap: 4px 14px !important; margin: 0 clamp(22px, 3vw, 44px) 0 0 !important; border: none !important; overflow: visible !important; }
        .page-product-detail .price-stack strong { flex: 0 0 auto !important; max-width: 100% !important; color: #ffffff !important; font-size: clamp(1.95rem, 2.65vw, 2.48rem) !important; line-height: 1 !important; letter-spacing: -0.06em !important; white-space: nowrap !important; }
        .page-product-detail .price-stack em { flex: 0 0 auto !important; align-self: flex-start !important; margin: 4px 0 0 !important; color: rgba(255, 255, 255, 0.5) !important; font-size: 0.86rem !important; line-height: 1 !important; white-space: nowrap !important; transform: translateY(-2px); }
        .page-product-detail .product-action-row { flex: 0 0 auto !important; min-width: max-content !important; display: flex !important; align-items: center !important; gap: 14px !important; justify-content: flex-end !important; border: none !important; }
        .page-product-detail .quantity-selector { flex: 0 0 118px !important; min-width: 118px !important; width: 118px !important; height: 48px !important; border: none !important; border-radius: 10px !important; box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.16) !important; }
        .page-product-detail .qty-btn,
        .page-product-detail .qty-input { border: none !important; box-shadow: none !important; }
        .page-product-detail .btn-add-cart { flex: 0 0 auto !important; min-height: 48px !important; min-width: 172px !important; border: none !important; border-radius: 10px !important; color: #000000 !important; font-weight: 950 !important; letter-spacing: 0.07em !important; }
        .page-product-detail .btn-add-cart * { color: #000000 !important; }
        .page-product-detail .product-secondary-actions { margin-top: 16px !important; gap: 22px !important; border: none !important; }
        .page-product-detail .product-secondary-actions button { color: #ffffff !important; font-size: 0.8rem !important; }
        .page-product-detail .product-buy-panel,
        .page-product-detail .product-buy-panel:hover { border: none !important; box-shadow: none !important; }
        @media (max-width: 1280px) {
          .page-product-detail .price-action-card { align-items: flex-start !important; }
          .page-product-detail .price-stack { max-width: none !important; margin-right: 0 !important; }
          .page-product-detail .product-action-row { width: 100% !important; justify-content: flex-start !important; }
        }
        .page-product-detail .gallery-nav { position: absolute; top: 50%; z-index: 12; width: 42px; height: 42px; display: grid; place-items: center; border: 1px solid rgba(248, 250, 252, 0.14); border-radius: 999px; background: rgba(5, 7, 11, 0.62); color: #f8fafc; cursor: pointer; font-size: 1.82rem; line-height: 1; opacity: 0; pointer-events: none; transform: translateY(-50%) scale(0.92); backdrop-filter: blur(12px); box-shadow: 0 16px 34px rgba(0, 0, 0, 0.24); transition: opacity 180ms ease, background 180ms ease, border-color 180ms ease, transform 180ms ease; }
        .page-product-detail .product-main-media:hover .gallery-nav,
        .page-product-detail .product-main-media:focus-within .gallery-nav { opacity: 1; pointer-events: auto; transform: translateY(-50%) scale(1); }
        .page-product-detail .gallery-nav:hover { border-color: rgba(0, 229, 255, 0.42); background: rgba(0, 229, 255, 0.72); color: #06101d; transform: translateY(-50%) scale(1.05); }
        .page-product-detail .gallery-nav--prev { left: 14px; }
        .page-product-detail .gallery-nav--next { right: 14px; }
        .page-product-detail .product-thumb-row { position: relative; grid-template-columns: none !important; display: flex !important; gap: 14px !important; margin-top: 20px !important; padding: 0 !important; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; }
        .page-product-detail .product-thumb-row::-webkit-scrollbar { display: none; }
        .page-product-detail .product-thumb { flex: 0 0 calc((100% - 42px) / 4); min-width: 116px; min-height: 108px !important; border-radius: 18px !important; scroll-snap-align: center; }
        .page-product-detail .thumb-nav { position: absolute; top: 50%; z-index: 12; width: 38px; height: 82px; min-height: 82px; display: grid; place-items: center; border: 1px solid rgba(248, 250, 252, 0.12); border-radius: 14px; background: rgba(5, 7, 11, 0.68); color: #ffffff; cursor: pointer; font-size: 1.58rem; line-height: 1; opacity: 0; pointer-events: none; backdrop-filter: blur(12px); transform: translateY(-50%) scale(0.96); transition: opacity 180ms ease, background 180ms ease, transform 180ms ease, border-color 180ms ease; }
        .page-product-detail .product-gallery-panel:hover .thumb-nav,
        .page-product-detail .product-thumb-row:focus-within .thumb-nav { opacity: 1; pointer-events: auto; transform: translateY(-50%) scale(1); }
        .page-product-detail .thumb-nav:hover { border-color: rgba(0, 229, 255, 0.36); background: rgba(0, 229, 255, 0.72); color: #06101d; transform: translateY(-50%) scale(1.03); }
        .page-product-detail .thumb-nav--prev { left: 8px; order: 0; }
        .page-product-detail .thumb-nav--next { right: 8px; order: 0; }
      `;
      document.head.appendChild(style);
    }

    const mainMedia = document.querySelector(".product-main-media");
    const mainImage = document.getElementById("mainImage");
    const thumbRow = document.querySelector(".product-thumb-row");
    const thumbs = Array.from(document.querySelectorAll(".product-thumb"));

    if (mainMedia && mainImage && thumbs.length && !mainMedia.querySelector(".gallery-nav")) {
      let activeIndex = Math.max(0, thumbs.findIndex((thumb) => thumb.classList.contains("is-active")));

      function setImage(index) {
        activeIndex = (index + thumbs.length) % thumbs.length;
        const thumb = thumbs[activeIndex];
        if (!thumb) return;

        thumbs.forEach((item) => item.classList.remove("is-active"));
        thumb.classList.add("is-active");
        if (thumb.dataset.image) mainImage.src = thumb.dataset.image;
        thumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }

      const prev = document.createElement("button");
      prev.className = "gallery-nav gallery-nav--prev";
      prev.type = "button";
      prev.setAttribute("aria-label", "Gambar sebelumnya");
      prev.textContent = "‹";

      const next = document.createElement("button");
      next.className = "gallery-nav gallery-nav--next";
      next.type = "button";
      next.setAttribute("aria-label", "Gambar berikutnya");
      next.textContent = "›";

      prev.addEventListener("click", () => setImage(activeIndex - 1));
      next.addEventListener("click", () => setImage(activeIndex + 1));
      mainMedia.append(prev, next);

      thumbs.forEach((thumb, index) => {
        thumb.addEventListener("click", () => setImage(index));
      });
    }

    if (thumbRow && !thumbRow.querySelector(".thumb-nav")) {
      const prevThumb = document.createElement("button");
      prevThumb.className = "thumb-nav thumb-nav--prev";
      prevThumb.type = "button";
      prevThumb.setAttribute("aria-label", "Geser thumbnail ke kiri");
      prevThumb.textContent = "‹";

      const nextThumb = document.createElement("button");
      nextThumb.className = "thumb-nav thumb-nav--next";
      nextThumb.type = "button";
      nextThumb.setAttribute("aria-label", "Geser thumbnail ke kanan");
      nextThumb.textContent = "›";

      prevThumb.addEventListener("click", () => thumbRow.scrollBy({ left: -thumbRow.clientWidth * 0.75, behavior: "smooth" }));
      nextThumb.addEventListener("click", () => thumbRow.scrollBy({ left: thumbRow.clientWidth * 0.75, behavior: "smooth" }));
      thumbRow.prepend(prevThumb);
      thumbRow.append(nextThumb);
    }

    const switchGroup = document.querySelector(".product-options .option-group:nth-child(2) .option-btns");
    if (switchGroup && !switchGroup.querySelector(".switch-select")) {
      const buttons = Array.from(switchGroup.querySelectorAll(".opt-btn"));
      const select = document.createElement("select");
      select.className = "switch-select";
      select.setAttribute("aria-label", "Pilih switch type");

      buttons.forEach((button) => {
        const option = document.createElement("option");
        option.value = button.textContent.trim();
        option.textContent = button.textContent.trim();
        option.selected = button.classList.contains("active");
        select.appendChild(option);
      });

      switchGroup.replaceChildren(select);
    }
  }

  function onReady(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  }

  window.addEventListener("pageshow", function () {
    const layer = createDiamondLayer();
    clearTransitionClasses();
    const mode = takeEnterMode();

    if (mode === "login") {
      startLoginEnter();
      return;
    }

    if (mode === "open") {
      startDiamondOpenEnter();
      return;
    }

    unlockTransitionLayer(layer);
    clearPreloadClasses();
  });

  document.addEventListener("click", function (event) {
    const link = event.target.closest("a");
    if (shouldSkipLink(link, event)) return;

    const targetUrl = new URL(link.href, window.location.href);
    if (isLoginPage(targetUrl)) {
      event.preventDefault();
      startDiamondLeave(targetUrl, "login");
      return;
    }

    if (isLoginToIndex(targetUrl)) {
      event.preventDefault();
      startDiamondLeave(targetUrl, "open");
    }
  });

  document.addEventListener("submit", function (event) {
    const form = event.target;
    const target = form.dataset.transitionHref;
    if (!target) return;

    const targetUrl = new URL(target, window.location.href);
    if (isLoginPage(targetUrl)) {
      event.preventDefault();
      startDiamondLeave(targetUrl, "login");
      return;
    }

    if (isLoginToIndex(targetUrl)) {
      event.preventDefault();
      startDiamondLeave(targetUrl, "open");
    }
  });

  onReady(initCatalogLoadingWireframe);
  onReady(initProductDetailControls);
})();
