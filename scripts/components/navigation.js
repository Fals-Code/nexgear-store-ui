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
    const nav = document.querySelector("nav");
    const navLinks = document.querySelector(".nav-links");
    const hamburger = document.querySelector(".hamburger");
    if (!nav || !navLinks || !hamburger) return;

    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("active");
      navLinks.classList.toggle("mobile-active");
    });

    // Close on link click
    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("mobile-active");
      });
    });
  }

  function setActiveNav() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".nav-links a").forEach((link) => {
      const href = link.getAttribute("href");
      if (href === path || (path === "" && href === "index.html")) {
        link.classList.add("active");
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
