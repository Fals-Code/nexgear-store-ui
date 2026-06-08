(function () {
  const STORAGE_KEY = "nexgear-page-transition-mode";
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const TIMING = {
    simpleLeave: 420,
    simpleEnter: 520,
    diamondLeave: 1280,
    diamondEnter: 1700,
  };

  function getFileName(url) {
    const path = url.pathname.toLowerCase();
    const file = path.split("/").pop();

    return file || "index.html";
  }

  function isLoginPage(url) {
    return getFileName(url) === "login.html";
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
    let layer = document.querySelector(".page-transition");

    if (!layer) {
      layer = document.createElement("div");
      layer.className = "page-transition";
      layer.setAttribute("aria-hidden", "true");

      layer.innerHTML = `
        <span class="page-transition__panel page-transition__panel--a"></span>
        <span class="page-transition__panel page-transition__panel--b"></span>
        <span class="page-transition__panel page-transition__panel--c"></span>
        <span class="page-transition__panel page-transition__panel--d"></span>
        <span class="page-transition__brand">NEXGEAR</span>
      `;

      document.body.prepend(layer);
    }

    return layer;
  }

  function createSimpleLayer() {
    let layer = document.querySelector(".simple-page-transition");

    if (!layer) {
      layer = document.createElement("div");
      layer.className = "simple-page-transition";
      layer.setAttribute("aria-hidden", "true");

      layer.innerHTML = `
        <span class="simple-page-transition__line"></span>
        <span class="simple-page-transition__text">NEXGEAR</span>
      `;

      document.body.prepend(layer);
    }

    return layer;
  }

  function getMainPanel(layer) {
    return layer.querySelector(".page-transition__panel--a");
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

  function startDiamondLeave(targetUrl) {
    if (reduceMotion.matches) {
      goTo(targetUrl);
      return;
    }

    const layer = createDiamondLayer();

    document.body.classList.remove(
      "pt-simple-leaving",
      "pt-simple-entering",
      "pt-simple-opening",
      "pt-entering-open",
      "pt-entering-closed",
      "pt-opening",
    );

    saveEnterMode("login");

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add("pt-leaving");

        waitForDiamond(layer, TIMING.diamondLeave, function () {
          window.setTimeout(function () {
            goTo(targetUrl);
          }, 120);
        });
      });
    });
  }

  function startSimpleLeave(targetUrl) {
    if (reduceMotion.matches) {
      goTo(targetUrl);
      return;
    }

    createSimpleLayer();

    document.body.classList.remove(
      "pt-leaving",
      "pt-entering-open",
      "pt-entering-closed",
      "pt-opening",
      "pt-simple-entering",
      "pt-simple-opening",
    );

    saveEnterMode("simple");

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add("pt-simple-leaving");

        window.setTimeout(function () {
          goTo(targetUrl);
        }, TIMING.simpleLeave);
      });
    });
  }

  function startLoginEnter() {
    createDiamondLayer();

    document.body.classList.remove(
      "pt-leaving",
      "pt-entering-open",
      "pt-opening",
      "pt-simple-leaving",
      "pt-simple-entering",
      "pt-simple-opening",
    );

    document.documentElement.classList.remove("pt-preload-open");
    document.documentElement.classList.remove("pt-preload-simple");

    document.body.classList.add("pt-entering-closed");

    requestAnimationFrame(function () {
      document.body.classList.remove("pt-entering-closed");
    });
  }

  function startSimpleEnter() {
    if (reduceMotion.matches) return;

    createSimpleLayer();

    document.body.classList.remove(
      "pt-leaving",
      "pt-entering-open",
      "pt-entering-closed",
      "pt-opening",
      "pt-simple-leaving",
    );

    document.body.classList.add("pt-simple-entering");

    document.documentElement.classList.remove("pt-preload-simple");
    document.documentElement.classList.remove("pt-preload-open");

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        document.body.classList.add("pt-simple-opening");

        window.setTimeout(function () {
          document.body.classList.remove(
            "pt-simple-entering",
            "pt-simple-opening",
          );
        }, TIMING.simpleEnter);
      });
    });
  }

  window.addEventListener("pageshow", function () {
    createDiamondLayer();
    createSimpleLayer();

    document.body.classList.remove(
      "pt-leaving",
      "pt-entering-open",
      "pt-entering-closed",
      "pt-opening",
      "pt-simple-leaving",
      "pt-simple-entering",
      "pt-simple-opening",
    );

    const mode = takeEnterMode();

    if (mode === "login") {
      startLoginEnter();
      return;
    }

    if (mode === "simple") {
      startSimpleEnter();
      return;
    }

    document.documentElement.classList.remove("pt-preload-open");
    document.documentElement.classList.remove("pt-preload-simple");
  });

  document.addEventListener("click", function (event) {
    const link = event.target.closest("a");

    if (shouldSkipLink(link, event)) return;

    event.preventDefault();

    const targetUrl = new URL(link.href, window.location.href);

    if (isLoginPage(targetUrl)) {
      startDiamondLeave(targetUrl);
      return;
    }

    startSimpleLeave(targetUrl);
  });

  document.addEventListener("submit", function (event) {
    const form = event.target;
    const target = form.dataset.transitionHref;

    if (!target) return;

    event.preventDefault();

    const targetUrl = new URL(target, window.location.href);

    if (isLoginPage(targetUrl)) {
      startDiamondLeave(targetUrl);
      return;
    }

    startSimpleLeave(targetUrl);
  });
})();
