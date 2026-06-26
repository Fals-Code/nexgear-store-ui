(() => {
  "use strict";

  const authPages = new Set([
    "login.html",
    "register.html",
    "registration.html",
    "signup.html",
  ]);
  const page = window.location.pathname.split("/").pop() || "index.html";
  const fullFooterRevealPages = new Set([
    "about.html",
    "help.html",
    "contact.html",
  ]);
  const scriptUrl = document.currentScript?.src || "";
  const asset = (path) =>
    scriptUrl ? new URL(`../${path}`, scriptUrl).href : path;

  if (fullFooterRevealPages.has(page)) {
    document.body.dataset.footerReveal = "normal";
  }

  const ensureStyle = (path) => {
    const href = asset(path);
    if ([...document.styleSheets].some((sheet) => sheet.href === href)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  };

  const ensureScript = (path) => {
    const src = asset(path);
    if ([...document.scripts].some((script) => script.src === src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      script.addEventListener("load", resolve, { once: true });
      script.addEventListener("error", reject, { once: true });
      document.head.append(script);
    });
  };

  ensureStyle("styles/quality-hardening.css?v=1");
  const qualityReady = ensureScript("scripts/quality-hardening.js?v=1").catch(
    (error) => {
      console.warn("NEXGEAR quality hardening fallback", error);
    },
  );

  if (["contact.html", "help.html", "track-order.html"].includes(page)) {
    ensureStyle("styles/support-accessibility.css?v=1");
  }

  const deferHeroVideo = () => {
    if (page !== "index.html" && page !== "") return;
    const video = document.querySelector(".hero-video");
    const source = video?.querySelector("source[src]");
    if (!video || !source) return;

    const src = source.getAttribute("src");
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    const skip =
      connection?.saveData ||
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      matchMedia("(max-width: 760px)").matches;

    source.removeAttribute("src");
    video.removeAttribute("autoplay");
    video.preload = "none";
    video.load();
    if (skip || !src) return;

    const load = () => {
      source.src = src;
      video.preload = "metadata";
      video.load();
      video.play().catch(() => {
        video.dataset.videoPaused = "true";
      });
    };

    window.addEventListener(
      "load",
      () => window.setTimeout(load, 700),
      { once: true },
    );
  };

  const initPromoCountdown = () => {
    if (page !== "product-detail.html") return;
    const card = document.querySelector(".price-action-card");
    const stack = card?.querySelector(".price-stack");
    if (!card || !stack || card.querySelector(".promo-countdown")) return;

    const element = document.createElement("div");
    element.className = "promo-countdown";
    element.innerHTML =
      '<span class="promo-countdown__label">ENDS IN</span><span class="promo-countdown__time"></span>';
    stack.insertAdjacentElement("afterend", element);

    const output = element.querySelector(".promo-countdown__time");
    const key = "nexgear-vortex-promo-deadline";
    const saved = Number(localStorage.getItem(key));
    const deadline = saved > Date.now() ? saved : Date.now() + 15710000;

    try {
      localStorage.setItem(key, String(deadline));
    } catch (error) {
      console.warn("NEXGEAR promo persistence fallback", error);
    }

    let timer = 0;
    const render = () => {
      const seconds = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      const pad = (value) => String(value).padStart(2, "0");
      output.textContent = `${pad(Math.floor(seconds / 3600))}h : ${pad(
        Math.floor((seconds % 3600) / 60),
      )}m : ${pad(seconds % 60)}s`;
      if (seconds === 0 && timer) clearInterval(timer);
    };

    render();
    timer = setInterval(render, 1000);
  };

  deferHeroVideo();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initPromoCountdown, {
      once: true,
    });
  } else {
    initPromoCountdown();
  }

  const fetchComponent = async (name) => {
    const response = await fetch(asset(`components/${name}`), {
      cache: "no-cache",
    });
    if (!response.ok) {
      throw new Error(`Gagal memuat ${name}: ${response.status}`);
    }
    return response.text();
  };

  const replace = (id, html) => {
    const target = document.getElementById(id);
    if (!target) return;
    const template = document.createElement("template");
    template.innerHTML = html.trim();
    target.replaceWith(template.content.cloneNode(true));
  };

  const load = async () => {
    if (authPages.has(page)) return;

    const [header, footer] = await Promise.all([
      fetchComponent("header.html"),
      fetchComponent("footer.html"),
    ]);
    replace("global-header", header);
    replace("global-footer", footer);

    ensureStyle("styles/cart-topbar-sync.css?v=1");
    try {
      await ensureScript("scripts/cart-topbar-sync.js?v=1");
    } catch (error) {
      console.warn("NEXGEAR cart sync fallback", error);
    }

    document.documentElement.classList.add("global-components-ready");
    document.dispatchEvent(
      new CustomEvent("nexgear:components-ready", {
        detail: { header: true, footer: true },
      }),
    );
  };

  const componentsReady = authPages.has(page)
    ? Promise.resolve()
    : load().catch((error) => {
        console.error("NEXGEAR global components", error);
        document.documentElement.classList.add("global-components-error");
        throw error;
      });

  const ready = Promise.all([qualityReady, componentsReady]).then(
    () => undefined,
  );

  window.NexGlobalComponents = Object.freeze({ ready });
})();
