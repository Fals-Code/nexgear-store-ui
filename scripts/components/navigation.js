(() => {
  "use strict";

  const Cart = window.NexCart;

  function initNavbar() {
    const topBar = document.querySelector(".top-bar");
    const shopBar = document.querySelector("#shop-bar");
    if (!shopBar) return;

    let spacer = document.querySelector(".shop-bar-spacer");
    if (!spacer) {
      spacer = document.createElement("div");
      spacer.className = "shop-bar-spacer";
      shopBar.insertAdjacentElement("afterend", spacer);
    }

    const setShopBarHeight = () => {
      const height = shopBar.offsetHeight || 70;
      document.documentElement.style.setProperty(
        "--shop-bar-height",
        `${height}px`,
      );
    };

    const onScroll = () => {
      const threshold = topBar ? topBar.offsetHeight : 72;
      const shouldStick = window.scrollY > threshold;

      shopBar.classList.toggle("is-sticky", shouldStick);
      shopBar.classList.toggle("is-fixed", shouldStick);
      spacer.classList.toggle("is-active", shouldStick);
    };

    setShopBarHeight();
    onScroll();

    window.addEventListener("resize", setShopBarHeight, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function initMobileMenu() {
    const trigger = document.querySelector("[data-mobile-nav-toggle]");
    const layer = document.querySelector("[data-mobile-nav-layer]");
    const drawer = document.getElementById("mobile-nav-drawer");
    if (!trigger || !layer || !drawer) return;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(",");
    let returnFocus = null;
    let previousBodyOverflow = "";

    const focusable = () =>
      Array.from(drawer.querySelectorAll(focusableSelector)).filter(
        (element) => element.getClientRects().length > 0,
      );

    const setState = (open) => {
      trigger.dataset.state = open ? "open" : "closed";
      trigger.setAttribute("aria-expanded", String(open));
      layer.dataset.state = open ? "open" : "closed";
      layer.setAttribute("aria-hidden", String(!open));
      drawer.dataset.state = open ? "open" : "closed";
      document.body.classList.toggle("mobile-nav-open", open);

      if (open) {
        previousBodyOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.setTimeout(() => (focusable()[0] || drawer).focus(), 0);
        return;
      }

      document.body.style.overflow = previousBodyOverflow;
      if (returnFocus instanceof HTMLElement) {
        window.setTimeout(() => returnFocus.focus(), 0);
      }
    };

    const open = () => {
      if (layer.dataset.state === "open") return;
      returnFocus = document.activeElement;
      setState(true);
    };

    const close = () => {
      if (layer.dataset.state !== "open") return;
      setState(false);
    };

    const trapFocus = (event) => {
      if (layer.dataset.state !== "open" || event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        drawer.focus();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    trigger.addEventListener("click", () => {
      if (layer.dataset.state === "open") close();
      else open();
    });

    layer.querySelectorAll("[data-mobile-nav-close]").forEach((control) => {
      control.addEventListener("click", close);
    });

    drawer.querySelectorAll("[data-mobile-nav-link]").forEach((link) => {
      link.addEventListener("click", close);
    });

    document.addEventListener("keydown", (event) => {
      if (layer.dataset.state !== "open") return;
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      trapFocus(event);
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 992px)").matches) close();
    });
  }

  function setActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document
      .querySelectorAll(".nav-links a, .mobile-primary-nav a")
      .forEach((link) => {
        const href = (link.getAttribute("href") || "").split("?")[0];
        const current = href === path || (path === "" && href === "index.html");
        link.classList.toggle("active", current);
        if (current) link.setAttribute("aria-current", "page");
        else if (link.getAttribute("aria-current") === "page") {
          link.removeAttribute("aria-current");
        }
      });
  }
  function initMiniCartDropdownRemove() {
    document
      .querySelectorAll(".mini-cart-dropdown .mini-cart-remove")
      .forEach((button) => {
        button.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();

          const item = button.closest(".mini-cart-item");
          if (item) item.remove();
        });
      });
  }

  function initCategoryPanel() {
    const shell = document.querySelector(".category-dropdown-shell");
    if (!shell) return;

    const mainItems = shell.querySelectorAll(
      ".category-main-item[data-panel-target]",
    );
    const panels = shell.querySelectorAll(".category-sub-panel[data-panel]");
    if (!mainItems.length || !panels.length) return;

    function activatePanel(target) {
      shell.classList.add("has-active-panel");
      mainItems.forEach((item) => {
        item.classList.toggle("is-active", item.dataset.panelTarget === target);
      });
      panels.forEach((panel) => {
        panel.classList.toggle("is-active", panel.dataset.panel === target);
      });
    }

    function deactivateAll() {
      shell.classList.remove("has-active-panel");
      mainItems.forEach((item) => item.classList.remove("is-active"));
      panels.forEach((panel) => panel.classList.remove("is-active"));
    }

    const subCol = shell.querySelector(".category-dropdown-sub");

    mainItems.forEach((item) => {
      const target = item.dataset.panelTarget;
      item.addEventListener("mouseenter", () => activatePanel(target));
      item.addEventListener("focus", () => activatePanel(target));
      item.addEventListener("mouseleave", (event) => {
        const related = event.relatedTarget;
        if (
          related &&
          (item.contains(related) ||
            subCol?.contains(related) ||
            related.closest?.(".category-main-item"))
        ) {
          return;
        }
        deactivateAll();
      });
    });

    subCol?.addEventListener("mouseleave", (event) => {
      const related = event.relatedTarget;
      if (related?.closest?.(".category-main-item")) return;
      deactivateAll();
    });

    const dropdownCat = shell.closest(".dropdown-cat");
    if (dropdownCat) {
      const parent = dropdownCat.closest(".nav-item");
      parent?.addEventListener("mouseleave", deactivateAll);
    }
  }

  function initCartEmptyGuidance() {
    window.updateCartEmptyGuidance = () => {
      document.querySelectorAll(".cart-btn").forEach((button) => {
        const isEmpty = Cart.count === 0;
        button.classList.toggle("cart-empty", isEmpty);
        button.setAttribute(
          "aria-label",
          isEmpty ? "Keranjang kosong, pilih gear dulu" : "Buka keranjang",
        );
      });
    };

    window.updateCartEmptyGuidance();
  }

  let initialized = false;

  function safeInit(initializer) {
    try {
      if (typeof initializer === "function") initializer();
    } catch (error) {
      console.warn("NEXGEAR NexNavigation warning:", error);
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;
    safeInit(initNavbar);
    safeInit(initMobileMenu);
    safeInit(setActiveNav);
    safeInit(initMiniCartDropdownRemove);
    safeInit(initCategoryPanel);
    safeInit(initCartEmptyGuidance);
  }

  window.NexNavigation = Object.freeze({ init });
})();
