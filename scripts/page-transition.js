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

    // Jaga overlay tetap tertutup sampai frame opening benar-benar dimulai.
    // Tanpa ini, browser kadang repaint 1 frame dalam keadaan layer sudah tidak visible.
    document.documentElement.classList.add("pt-preload-open");
    clearTransitionClasses();
    document.body.classList.add("pt-entering-open");

    // Force layout supaya state tertutup terekam sebelum kelas opening dipasang.
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
})();
