/**
 * NEXGEAR Main Script â€” Handmade Edition
 * No ESM exports â€” classic script loading
 */

(function () {
  "use strict";

  const formatRupiah = window.NexCurrency?.formatRupiah || window.formatRupiah;
  const Cart = window.NexCart;
  const Auth = window.NexAuth;
  const showToast = window.NexToast?.show || window.showToast;
  const showNexToast = window.NexToast?.showCompact || window.showNexToast;

  /* — Mobile Menu — */

  /* â”€â”€ Scroll Reveal â”€â”€ */
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

  /* â”€â”€ Stat Count-Up â”€â”€ */
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

  /* â”€â”€ Hero Parallax â”€â”€ */
  function initParallax() {
    const heroH1 = document.querySelector(".hero h1");
    if (!heroH1) return;

    window.addEventListener("mousemove", (e) => {
      const x = (window.innerWidth / 2 - e.pageX) / 60;
      const y = (window.innerHeight / 2 - e.pageY) / 60;
      heroH1.style.transform = `translate(${x}px, ${y}px)`;
    });
  }

  /* â”€â”€ Price Filter (catalog) â”€â”€ */

  /* â”€â”€ Search & Filter Logic (catalog) â”€â”€ */

  /* â”€â”€ Add-to-Cart Buttons â”€â”€ */

  /* â”€â”€ Set Active Nav Link â”€â”€ */

  /* â”€â”€ Random slight rotations for sketch cards â”€â”€ */

  /* â”€â”€ Filter Drawer (catalog) â”€â”€ */

  function initLoginReveal() {
    const loginShell = document.querySelector(".login-shell");
    if (!loginShell) return;

    window.setTimeout(() => {
      loginShell.classList.add("is-open");
    }, 280);

    loginShell.addEventListener("click", () => {
      loginShell.classList.add("is-open");
    });
  }

  function announceFeedback(message) {
    const text = String(message || "").trim();
    if (!text) return;

    if (typeof showNexToast === "function") {
      showNexToast(text);
      return;
    }

    if (typeof showToast === "function") {
      showToast(text);
      return;
    }

    let liveRegion = document.querySelector("[data-nex-live-region]");
    if (!liveRegion) {
      liveRegion = document.createElement("div");
      liveRegion.setAttribute("data-nex-live-region", "");
      liveRegion.setAttribute("role", "status");
      liveRegion.setAttribute("aria-live", "polite");
      liveRegion.style.position = "absolute";
      liveRegion.style.width = "1px";
      liveRegion.style.height = "1px";
      liveRegion.style.margin = "-1px";
      liveRegion.style.padding = "0";
      liveRegion.style.overflow = "hidden";
      liveRegion.style.clip = "rect(0 0 0 0)";
      liveRegion.style.whiteSpace = "nowrap";
      liveRegion.style.border = "0";
      document.body.appendChild(liveRegion);
    }

    liveRegion.textContent = "";
    window.setTimeout(() => {
      liveRegion.textContent = text;
    }, 10);
  }

  function initSearchDrawerControls() {
    document.querySelectorAll("[data-search-drawer-close]").forEach((button) => {
      button.addEventListener("click", () => {
        document.getElementById("search-drawer")?.classList.remove("active");
      });
    });
  }

  function initReviewForm() {
    const form = document.querySelector("[data-review-form]");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      announceFeedback("Ulasan Anda telah dikirim untuk dimoderasi. Terima kasih!");
      window.setTimeout(() => {
        window.location.href = "product-detail.html";
      }, 700);
    });
  }

  function initProfileFeedback() {
    document.querySelectorAll("[data-profile-feedback]").forEach((link) => {
      link.addEventListener("click", (event) => {
        const message = link.dataset.profileFeedback;
        const href = link.getAttribute("href");
        if (!href) {
          announceFeedback(message);
          return;
        }

        event.preventDefault();
        announceFeedback(message);
        window.setTimeout(() => {
          window.location.href = href;
        }, 500);
      });
    });
  }

  /* INIT */

  function initFooterReveal() {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;

    if (!("IntersectionObserver" in window)) {
      footer.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        footer.classList.toggle("is-visible", entry.isIntersecting);
      },
      { threshold: 0.04 },
    );

    observer.observe(footer);
  }

  function syncFooterRevealSpace() {
    const footer = document.querySelector(".site-footer");
    if (!footer) return;

    const setFooterSpace = () => {
      const footerHeight = footer.offsetHeight || 0;
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const mode = document.body?.dataset?.footerReveal || "normal";

      const revealSpace =
        mode === "compact"
          ? Math.round(
              Math.min(
                Math.max(footerHeight * 0.62, viewportHeight * 0.34),
                380,
              ),
            )
          : Math.ceil(footerHeight);

      document.documentElement.style.setProperty(
        "--footer-reveal-space",
        `${revealSpace}px`,
      );
    };

    setFooterSpace();
    window.addEventListener("resize", setFooterSpace, { passive: true });
    window.addEventListener("load", setFooterSpace, { once: true });

    // Use ResizeObserver if available to watch for footer height changes
    if ("ResizeObserver" in window) {
      const observer = new ResizeObserver(setFooterSpace);
      observer.observe(footer);
    }

    // Also listen for image load events on all footer images
    footer.querySelectorAll("img").forEach((img) => {
      if (!img.complete) {
        img.addEventListener("load", setFooterSpace, { once: true });
        img.addEventListener("error", setFooterSpace, { once: true });
      }
    });
  }

  function initPromoWindowReveal() {
    const promoWindow = document.querySelector(".promo-window");
    if (!promoWindow) return;

    if (!("IntersectionObserver" in window)) {
      promoWindow.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        promoWindow.classList.toggle("is-visible", entry.isIntersecting);
      },
      { threshold: 0.18 },
    );

    observer.observe(promoWindow);
  }

  function initShowcaseFilters() {
    const section = document.querySelector(".showcase-section");
    if (!section) return;

    const buttons = section.querySelectorAll("[data-showcase-filter]");
    const cards = section.querySelectorAll("[data-showcase-card]");
    if (!buttons.length || !cards.length) return;

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.showcaseFilter || "all";

        buttons.forEach((btn) => {
          const isActive = btn === button;
          btn.classList.toggle("is-active", isActive);
          btn.setAttribute("aria-selected", isActive ? "true" : "false");
        });

        cards.forEach((card) => {
          const tags = (card.dataset.showcaseCard || "")
            .split(" ")
            .filter(Boolean);
          const shouldShow = filter === "all" || tags.includes(filter);

          window.clearTimeout(card._showcaseFilterTimer);

          if (shouldShow) {
            card.classList.remove("is-hidden");
            requestAnimationFrame(() => {
              card.classList.remove("is-hiding");
            });
          } else {
            card.classList.add("is-hiding");
            card._showcaseFilterTimer = window.setTimeout(() => {
              card.classList.add("is-hidden");
            }, 180);
          }
        });
      });
    });
  }

  function initFooterGalleryAutoScroll() {
    const track = document.querySelector(".footer-gallery-track");
    if (!track) return;

    let paused = false;
    let frameId = null;

    const tick = () => {
      if (!paused && track.scrollWidth > track.clientWidth) {
        track.scrollLeft += 0.22;

        if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2) {
          track.scrollLeft = 0;
        }
      }

      frameId = requestAnimationFrame(tick);
    };

    track.addEventListener("mouseenter", () => {
      paused = true;
    });

    track.addEventListener("mouseleave", () => {
      paused = false;
    });

    track.addEventListener("focusin", () => {
      paused = true;
    });

    track.addEventListener("focusout", () => {
      paused = false;
    });

    tick();
  }

  function safeInit(fn) {
    try {
      if (typeof fn === "function") fn();
    } catch (e) {
      console.warn("NEXGEAR JS Warning:", e);
    }
  }

  function init() {
    document.body.classList.add("loaded", "js-enabled");

    const modules = [
      () => window.NexNavigation?.init(),
      () => window.NexDialogs?.init(),
      () => window.NexCatalog?.init(),
      initReveal,
      initCountUp,
      initParallax,
      initLoginReveal,
      initSearchDrawerControls,
      initReviewForm,
      initProfileFeedback,
      syncFooterRevealSpace,
      initPromoWindowReveal,
      initShowcaseFilters,
    ];

    modules.forEach((module) => safeInit(module));
    safeInit(() => Cart.updateBadge());
    safeInit(() => Auth.updateUI());
  }

  function startAfterGlobalComponents() {
    const componentsReady = window.NexGlobalComponents?.ready;

    if (componentsReady && typeof componentsReady.then === "function") {
      componentsReady
        .then(() => init())
        .catch((error) => {
          console.warn("NEXGEAR components fallback:", error);
          init();
        });
      return;
    }

    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAfterGlobalComponents);
  } else {
    startAfterGlobalComponents();
  }
})();
