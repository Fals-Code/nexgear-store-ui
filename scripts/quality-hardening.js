(() => {
  "use strict";

  const scriptUrl = document.currentScript?.src || "";
  const asset = (path) => (scriptUrl ? new URL(`../${path}`, scriptUrl).href : path);
  const page = window.location.pathname.split("/").pop() || "index.html";
  const imageFallback = asset("assets/image-fallback.svg");
  const experienceScript = asset("scripts/experience-system.js?v=1");

  const onReady = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
      return;
    }
    callback();
  };

  const ensureExperienceLayer = () => {
    if (window.NexExperience || document.querySelector('script[data-nx-experience]')) return;
    const script = document.createElement("script");
    script.src = experienceScript;
    script.async = false;
    script.dataset.nxExperience = "true";
    script.addEventListener(
      "error",
      () => console.warn("NEXGEAR experience system gagal dimuat."),
      { once: true },
    );
    document.head.append(script);
  };

  const ensureLiveRegion = () => {
    let region = document.getElementById("nexgear-live-region");
    if (region) return region;

    region = document.createElement("div");
    region.id = "nexgear-live-region";
    region.className = "visually-hidden";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    document.body.append(region);
    return region;
  };

  const announce = (message) => {
    if (!message) return;
    const region = ensureLiveRegion();
    region.textContent = "";
    window.setTimeout(() => {
      region.textContent = String(message);
    }, 20);
  };

  const initLandmarks = () => {
    const main = document.querySelector("main");
    if (!main) return;

    if (!main.id) main.id = "main-content";
    if (!main.hasAttribute("tabindex")) main.tabIndex = -1;

    let skipLink = document.querySelector(".skip-link");
    if (!skipLink) {
      skipLink = document.createElement("a");
      skipLink.className = "skip-link";
      skipLink.textContent = "Lewati ke konten utama";
      document.body.prepend(skipLink);
    }
    skipLink.href = `#${main.id}`;
    skipLink.addEventListener("click", () => {
      window.setTimeout(() => main.focus({ preventScroll: true }), 0);
    });
  };

  const applyImageDefaults = (image) => {
    if (!(image instanceof HTMLImageElement)) return;
    image.decoding = "async";
    if (!image.hasAttribute("loading") && !image.closest("header, .hero, [data-priority-media]")) {
      image.loading = "lazy";
    }
    if (!image.hasAttribute("width") && image.naturalWidth) image.width = image.naturalWidth;
    if (!image.hasAttribute("height") && image.naturalHeight) image.height = image.naturalHeight;
  };

  const replaceBrokenImage = (image) => {
    if (!(image instanceof HTMLImageElement)) return;
    if (image.dataset.imageFallback === "true" || image.src === imageFallback) return;
    image.dataset.imageFallback = "true";
    image.src = imageFallback;
    if (!image.alt.trim()) image.alt = "Media NEXGEAR tidak tersedia";
  };

  const inspectImages = (root = document) => {
    const images = root instanceof HTMLImageElement ? [root] : root.querySelectorAll?.("img") || [];
    images.forEach((image) => {
      applyImageDefaults(image);
      if (image.complete && image.naturalWidth === 0) replaceBrokenImage(image);
    });
  };

  const initMediaResilience = () => {
    inspectImages();
    document.addEventListener(
      "error",
      (event) => {
        if (event.target instanceof HTMLImageElement) replaceBrokenImage(event.target);
      },
      true,
    );

    new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node instanceof Element) inspectImages(node);
        });
      });
    }).observe(document.documentElement, { childList: true, subtree: true });
  };

  const initFormFeedback = () => {
    document.addEventListener(
      "invalid",
      (event) => {
        const field = event.target;
        if (!(field instanceof HTMLElement)) return;
        field.setAttribute("aria-invalid", "true");
        field.closest(".form-group, .checkout-field, .field, label")?.classList.add("is-invalid");
      },
      true,
    );

    const clearInvalid = (event) => {
      const field = event.target;
      if (!(field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)) return;
      if (!field.checkValidity()) return;
      field.removeAttribute("aria-invalid");
      field.closest(".form-group, .checkout-field, .field, label")?.classList.remove("is-invalid");
    };

    document.addEventListener("input", clearInvalid, true);
    document.addEventListener("change", clearInvalid, true);
  };

  const syncCurrentNavigation = () => {
    document.querySelectorAll("header nav a[href], .admin-sidebar a[href]").forEach((link) => {
      const target = new URL(link.href, window.location.href).pathname.split("/").pop() || "index.html";
      if (target === page) link.setAttribute("aria-current", "page");
      else if (link.getAttribute("aria-current") === "page") link.removeAttribute("aria-current");
    });
  };

  const initCatalogReadiness = () => {
    if (page !== "catalog.html") return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let releaseTimer = 0;
    let firstLoad = true;

    const release = () => {
      window.clearTimeout(releaseTimer);
      document.body.classList.remove("catalog-data-loading");
      const skeleton = document.querySelector(".catalog-loading-wireframe");
      if (!skeleton) return;
      skeleton.hidden = true;
      skeleton.setAttribute("aria-hidden", "true");
    };

    const scheduleRelease = () => {
      if (!document.body.classList.contains("catalog-data-loading")) return;
      if (reducedMotion.matches) {
        release();
        return;
      }
      window.clearTimeout(releaseTimer);
      releaseTimer = window.setTimeout(release, firstLoad ? 720 : 360);
      firstLoad = false;
    };

    new MutationObserver(scheduleRelease).observe(document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
    window.requestAnimationFrame(() => window.requestAnimationFrame(scheduleRelease));
    reducedMotion.addEventListener?.("change", () => {
      if (reducedMotion.matches) release();
    });
  };

  const readJson = (key, fallback) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const initPaymentRecovery = () => {
    if (page !== "payment.html") return;

    const modal = document.getElementById("payment-method-modal");
    const mobileAction = document.getElementById("payment-mobile-action");
    const changeMethod = document.getElementById("payment-change-method");
    const methodContent = document.getElementById("payment-method-content");
    const statusPill = document.getElementById("payment-status-pill");
    const title = document.getElementById("payment-workspace-title");
    const description = document.getElementById("payment-status-description");
    let returnFocus = null;

    const loadOrder = () => {
      const id = new URLSearchParams(window.location.search).get("order");
      const pending = readJson("nexgear_pending_order", null);
      const orders = readJson("nexgear_orders", []);
      return orders.find((order) => order.id === id) || ((!id || pending?.id === id) && pending) || null;
    };

    const getFocusable = () => {
      if (!modal || modal.hidden) return [];
      return Array.from(
        modal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hidden && element.getClientRects().length > 0);
    };

    const syncModalState = () => {
      if (!modal) return;
      const isOpen = !modal.hidden;
      modal.setAttribute("aria-hidden", String(!isOpen));
      document.body.dataset.modalOpen = String(isOpen);
      if (isOpen) {
        const selected = modal.querySelector("[data-payment-method].is-active");
        const close = modal.querySelector("[data-close-payment-modal]");
        window.setTimeout(() => (selected || close || getFocusable()[0])?.focus(), 0);
      } else if (returnFocus instanceof HTMLElement) {
        window.setTimeout(() => returnFocus.focus(), 0);
      }
    };

    if (modal) {
      modal.setAttribute("aria-hidden", String(modal.hidden));
      new MutationObserver(syncModalState).observe(modal, {
        attributes: true,
        attributeFilter: ["hidden"],
      });

      document.addEventListener(
        "click",
        (event) => {
          if (event.target.closest("[data-open-modal], #payment-change-method")) {
            returnFocus = event.target.closest("button, a, [tabindex]") || document.activeElement;
          }
        },
        true,
      );

      document.addEventListener(
        "keydown",
        (event) => {
          if (modal.hidden || event.key !== "Tab") return;
          const focusable = getFocusable();
          if (!focusable.length) {
            event.preventDefault();
            return;
          }
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        },
        true,
      );
    }

    const renderPaidState = () => {
      const order = loadOrder();
      if (!order || order.paymentStatus !== "paid") return;
      const target = `success.html?order=${encodeURIComponent(order.id)}`;

      if (statusPill) {
        statusPill.className = "payment-status-pill is-success";
        statusPill.innerHTML = '<i aria-hidden="true"></i>Pembayaran Berhasil';
      }
      if (title) title.textContent = "Pembayaran berhasil";
      if (description) description.textContent = "Pesanan telah dikonfirmasi dan siap dilihat pada halaman ringkasan.";
      if (changeMethod) changeMethod.disabled = true;

      if (methodContent && !methodContent.querySelector(".quality-payment-complete")) {
        methodContent.innerHTML = `
          <div class="quality-payment-complete" role="status">
            <span class="quality-payment-complete__icon" aria-hidden="true">✓</span>
            <h3>Transaksi sudah terverifikasi</h3>
            <p>Memuat ulang halaman tidak akan mengulang pembayaran. Lanjutkan ke ringkasan pesanan untuk melihat detail dan pelacakan.</p>
            <a class="btn btn-primary" href="${target}">Lihat Ringkasan Pesanan</a>
          </div>`;
      }

      if (mobileAction) {
        mobileAction.disabled = false;
        mobileAction.dataset.paymentComplete = "true";
        mobileAction.textContent = "Lihat Pesanan →";
      }
    };

    mobileAction?.addEventListener(
      "click",
      (event) => {
        if (mobileAction.dataset.paymentComplete !== "true") return;
        const order = loadOrder();
        if (!order) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        window.location.href = `success.html?order=${encodeURIComponent(order.id)}`;
      },
      true,
    );

    const statusCard = document.querySelector(".payment-status-card");
    if (statusCard) {
      new MutationObserver(() => {
        announce([title?.textContent, description?.textContent].filter(Boolean).join(". "));
      }).observe(statusCard, { childList: true, subtree: true, characterData: true });
    }

    window.requestAnimationFrame(() => window.requestAnimationFrame(renderPaidState));
    window.addEventListener("storage", renderPaidState);
  };

  const init = () => {
    ensureLiveRegion();
    initLandmarks();
    initMediaResilience();
    initFormFeedback();
    initCatalogReadiness();
    initPaymentRecovery();
    syncCurrentNavigation();
    document.addEventListener("nexgear:components-ready", syncCurrentNavigation);
  };

  window.NexA11y = Object.freeze({ announce });
  ensureExperienceLayer();
  onReady(init);
})();
