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
    "page-transition__panel--b",
    "page-transition__panel--c",
    "page-transition__panel--d",
  ].filter((value, index, array) => array.indexOf(value) === index);

  let catalogLoadingTimer = 0;

  function getFileName(url) {
    const path = url.pathname.toLowerCase();
    const file = path.split("/").pop();

    return file || "index.html";
  }

  function isLoginPage(url) {
    return getFileName(url) === "login.html";
  }

  function isIndexPage(url) {
    return getFileName(url) === "index.html";
  }

  function isCatalogPage() {
    return (
      document.body?.classList.contains("page-catalog") ||
      getFileName(new URL(window.location.href)) === "catalog.html"
    );
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

    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      event.button !== 0
    ) {
      return true;
    }

    const url = new URL(link.href, window.location.href);

    if (url.origin !== window.location.origin) return true;
    if (url.protocol === "mailto:" || url.protocol === "tel:") return true;

    const samePage =
      url.pathname === window.location.pathname &&
      url.search === window.location.search;

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

      if (brand) {
        layer.insertBefore(panel, brand);
      } else {
        layer.appendChild(panel);
      }
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

  function getMainPanel(layer) {
    return layer?.querySelector(".page-transition__panel--a") || null;
  }

  function waitForDiamond(layer, fallbackMs, callback) {
    const panel = getMainPanel(layer);
    let done = false;

    function finish() {
      if (done) return;
      done = true;

      if (panel) {
        panel.removeEventListener("transitionend", onEnd);
      }

      callback();
    }

    function onEnd(event) {
      if (event.propertyName !== "margin-left") return;
      finish();
    }

    if (panel) {
      panel.addEventListener("transitionend", onEnd);
    }

    window.setTimeout(finish, fallbackMs);
  }

  function goTo(url) {
    window.location.href = url.href;
  }

  function clearPreloadClasses() {
    document.documentElement.classList.remove("pt-preload-open");
    document.documentElement.classList.remove("pt-preload-simple");
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

    const cards = Array.from({ length: 8 })
      .map(
        function () {
          return `
            <article class="catalog-loading-card">
              <div class="catalog-loading-media"></div>
              <div class="catalog-loading-line catalog-loading-line--title"></div>
              <div class="catalog-loading-line catalog-loading-line--short"></div>
            </article>
          `;
        },
      )
      .join("");

    skeleton.innerHTML = `
      <div class="catalog-loading-head">
        <span>Loading catalog</span>
        <strong>Menyiapkan gear pilihan...</strong>
      </div>
      <div class="catalog-loading-grid">${cards}</div>
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
      if (!target) return;

      if (
        target.matches("#sortSelect") ||
        target.matches(".catalog-filter-option input")
      ) {
        showCatalogLoading(TIMING.catalogSoftLoad);
      }
    });

    document.addEventListener("click", function (event) {
      const button = event.target.closest(
        ".catalog-filter-apply, .catalog-filter-btn, [data-filter-dropdown-trigger]",
      );

      if (button) {
        showCatalogLoading(TIMING.catalogSoftLoad);
      }
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
        .page-product-detail .product-gallery-panel::after { content: none !important; display: none !important; }
        .page-product-detail .product-main-media { position: relative; }
        .page-product-detail .gallery-nav {
          position: absolute; top: 50%; z-index: 12; width: 46px; height: 46px; display: grid; place-items: center;
          border: 0; border-radius: 999px; background: rgba(5, 7, 11, 0.58); color: #f8fafc; cursor: pointer;
          font-size: 2rem; line-height: 1; transform: translateY(-50%); backdrop-filter: blur(10px); transition: background 180ms ease, transform 180ms ease, opacity 180ms ease;
        }
        .page-product-detail .gallery-nav:hover { background: rgba(0, 229, 255, 0.72); color: #06101d; transform: translateY(-50%) scale(1.04); }
        .page-product-detail .gallery-nav--prev { left: 18px; }
        .page-product-detail .gallery-nav--next { right: 18px; }
        .page-product-detail .product-thumb-row { grid-template-columns: none !important; display: flex !important; gap: 12px !important; overflow-x: auto; scroll-snap-type: x proximity; scrollbar-width: none; }
        .page-product-detail .product-thumb-row::-webkit-scrollbar { display: none; }
        .page-product-detail .product-thumb { flex: 0 0 calc((100% - 36px) / 4); min-width: 116px; scroll-snap-align: center; }
        .page-product-detail .thumb-nav {
          position: sticky; z-index: 12; flex: 0 0 48px; width: 48px; min-height: 104px; display: grid; place-items: center;
          border: 0; background: rgba(0, 102, 255, 0.86); color: #ffffff; cursor: pointer; font-size: 1.8rem; line-height: 1;
        }
        .page-product-detail .thumb-nav:hover { background: rgba(0, 229, 255, 0.92); color: #06101d; }
        .page-product-detail .thumb-nav--prev { left: 0; order: -1; }
        .page-product-detail .thumb-nav--next { right: 0; order: 999; }
        .page-product-detail .switch-select {
          width: min(100%, 230px); min-height: 42px; padding: 0 42px 0 14px; border: 1px solid rgba(148, 163, 184, 0.22); border-radius: 8px;
          background: rgba(255, 255, 255, 0.035); color: rgba(248, 250, 252, 0.92); font: inherit; font-size: 0.84rem; font-weight: 800;
          appearance: auto; cursor: pointer;
        }
        .page-product-detail .switch-select:focus { outline: none; border-color: rgba(0, 229, 255, 0.52); box-shadow: 0 0 0 4px rgba(0, 229, 255, 0.08); }
        .page-product-detail .switch-select option { color: #06101d; background: #f8fafc; }
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
