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
