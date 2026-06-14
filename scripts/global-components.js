(function () {
  "use strict";

  const AUTH_PAGES = new Set([
    "login.html",
    "register.html",
    "registration.html",
    "signup.html",
  ]);

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  function deferLandingHeroVideo() {
    if (currentPage !== "index.html" && currentPage !== "") return;

    const video = document.querySelector(".hero-video");
    const source = video?.querySelector("source[src]");
    if (!video || !source) return;

    const videoSrc = source.getAttribute("src");
    if (!videoSrc) return;

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const saveData = Boolean(connection?.saveData);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const smallScreen = window.matchMedia?.("(max-width: 760px)").matches;

    source.dataset.src = videoSrc;
    source.removeAttribute("src");
    video.preload = "none";
    video.removeAttribute("autoplay");
    video.load();
    video.dataset.deferLoad = "true";

    if (saveData || reducedMotion || smallScreen) {
      video.dataset.videoSkipped = "true";
      return;
    }

    const loadVideo = () => {
      if (video.dataset.loaded === "true") return;
      video.dataset.loaded = "true";
      source.src = source.dataset.src;
      video.setAttribute("autoplay", "");
      video.preload = "metadata";
      video.load();

      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => {
          video.dataset.videoPaused = "true";
        });
      }
    };

    const schedule = () => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadVideo, { timeout: 1800 });
        return;
      }
      window.setTimeout(loadVideo, 1000);
    };

    if (document.readyState === "complete") {
      schedule();
    } else {
      window.addEventListener("load", schedule, { once: true });
    }
  }

  deferLandingHeroVideo();

  function initProductPromoCountdown() {
    if (currentPage !== "product-detail.html") return;

    const priceCard = document.querySelector(".price-action-card");
    const priceStack = priceCard?.querySelector(".price-stack");
    if (!priceCard || !priceStack) return;

    const existingCountdown = priceCard.querySelector(".promo-countdown");
    if (existingCountdown) return;

    const countdown = document.createElement("div");
    countdown.className = "promo-countdown";
    countdown.setAttribute("aria-label", "Promo countdown");
    countdown.innerHTML = '<span class="promo-countdown__label">ENDS IN</span><span class="promo-countdown__time">04h : 21m : 50s</span>';
    priceStack.insertAdjacentElement("afterend", countdown);

    const timeEl = countdown.querySelector(".promo-countdown__time");
    const storageKey = "nexgear-vortex-promo-deadline";
    const promoDurationMs = ((4 * 60 * 60) + (21 * 60) + 50) * 1000;
    const now = Date.now();
    const savedDeadline = Number(window.localStorage?.getItem(storageKey));
    const deadline = savedDeadline && savedDeadline > now
      ? savedDeadline
      : now + promoDurationMs;

    try {
      window.localStorage?.setItem(storageKey, String(deadline));
    } catch (error) {}

    const pad = (value) => String(value).padStart(2, "0");

    const render = () => {
      const remaining = Math.max(0, deadline - Date.now());
      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      timeEl.textContent = `${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`;

      if (remaining <= 0) {
        window.clearInterval(timerId);
      }
    };

    render();
    const timerId = window.setInterval(render, 1000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initProductPromoCountdown, { once: true });
  } else {
    initProductPromoCountdown();
  }

  function resolveComponentUrl(fileName) {
    const scriptUrl = document.currentScript?.src;
    if (scriptUrl) {
      return new URL(`../components/${fileName}`, scriptUrl).href;
    }

    return `components/${fileName}`;
  }

  async function fetchComponent(fileName) {
    const response = await fetch(resolveComponentUrl(fileName), {
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `Gagal memuat ${fileName}: ${response.status} ${response.statusText}`,
      );
    }

    return response.text();
  }

  function replacePlaceholder(id, html) {
    const placeholder = document.getElementById(id);
    if (!placeholder) return;

    const template = document.createElement("template");
    template.innerHTML = html.trim();

    if (!template.content.childNodes.length) {
      throw new Error(`Komponen ${id} tidak memiliki konten.`);
    }

    placeholder.replaceWith(template.content.cloneNode(true));
  }

  async function loadGlobalComponents() {
    if (AUTH_PAGES.has(currentPage)) return;

    const [headerHtml, footerHtml] = await Promise.all([
      fetchComponent("header.html"),
      fetchComponent("footer.html"),
    ]);

    replacePlaceholder("global-header", headerHtml);
    replacePlaceholder("global-footer", footerHtml);

    document.documentElement.classList.add("global-components-ready");
    document.dispatchEvent(
      new CustomEvent("nexgear:components-ready", {
        detail: { header: true, footer: true },
      }),
    );
  }

  const ready = AUTH_PAGES.has(currentPage)
    ? Promise.resolve()
    : loadGlobalComponents().catch((error) => {
        console.error("NEXGEAR global components:", error);
        document.documentElement.classList.add("global-components-error");
        throw error;
      });

  window.NexGlobalComponents = Object.freeze({ ready });
})();
