(() => {
  "use strict";

  const root = document.querySelector("[data-product-detail-v2]");
  if (!root) return;

  const Cart = window.NexCart;
  const toast = window.NexToast?.showCompact || window.NexToast?.show;
  const live = root.querySelector("[data-product-live]");

  const setLive = (message) => {
    const text = String(message || "").trim();
    if (!text) return;

    if (typeof toast === "function") {
      toast(text);
    }

    if (live) {
      live.textContent = "";
      window.setTimeout(() => {
        live.textContent = text;
      }, 10);
    }
  };

  const setButtonGroupState = (buttons, activeButton) => {
    buttons.forEach((button) => {
      const isActive = button === activeButton;
      button.classList.toggle("is-active", isActive);
      button.dataset.state = isActive ? "active" : "idle";
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  const getSelectedChoice = (groupName) => {
    const active = root.querySelector(
      `[data-choice-group="${groupName}"] .pd-choice[data-state="active"]`,
    );

    return active?.dataset.choice || active?.textContent?.trim() || "";
  };

  function initGallery() {
    const visual = root.querySelector("[data-product-visual]");
    const label = root.querySelector("[data-main-media-label]");
    const thumbs = Array.from(root.querySelectorAll("[data-gallery-thumb]"));

    if (!visual || !thumbs.length) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        setButtonGroupState(thumbs, thumb);

        const visualName = thumb.dataset.visual || "front";
        const nextLabel = thumb.dataset.label || "Tampilan produk";

        visual.dataset.visual = visualName;
        if (label) label.textContent = nextLabel;
        setLive(nextLabel);
      });
    });
  }

  function initChoices() {
    root.querySelectorAll("[data-choice-group]").forEach((group) => {
      const buttons = Array.from(group.querySelectorAll(".pd-choice"));
      if (!buttons.length) return;

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          setButtonGroupState(buttons, button);
          const label = group.closest(".pd-option-group")?.querySelector("legend");
          setLive(`${label?.textContent || "Opsi"} dipilih: ${button.dataset.choice}`);
        });
      });
    });
  }

  function initQuantity() {
    const input = root.querySelector("[data-qty-input]");
    const buttons = Array.from(root.querySelectorAll("[data-qty-action]"));

    if (!input || !buttons.length) return;

    const normalize = (value) => {
      const min = Number(input.min) || 1;
      const max = Number(input.max) || 99;
      const number = Number.parseInt(value, 10);
      return Math.min(max, Math.max(min, Number.isFinite(number) ? number : min));
    };

    const sync = (value) => {
      input.value = String(normalize(value));
    };

    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const delta = button.dataset.qtyAction === "plus" ? 1 : -1;
        sync((Number(input.value) || 1) + delta);
      });
    });

    input.addEventListener("input", () => sync(input.value));
    input.addEventListener("blur", () => sync(input.value));
  }

  function initTabs() {
    const tabs = Array.from(root.querySelectorAll("[data-tab-target]"));
    const panels = Array.from(root.querySelectorAll("[data-tab-panel]"));

    if (!tabs.length || !panels.length) return;

    const activate = (tab) => {
      const target = tab.dataset.tabTarget;

      tabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.dataset.state = isActive ? "active" : "idle";
        item.setAttribute("aria-selected", String(isActive));
        item.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach((panel) => {
        const isActive = panel.dataset.tabPanel === target;
        panel.classList.toggle("is-active", isActive);
        panel.hidden = !isActive;
      });
    };

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activate(tab));
      tab.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;

        event.preventDefault();
        let nextIndex = index;

        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;

        tabs[nextIndex].focus();
        activate(tabs[nextIndex]);
      });
    });
  }

  function initFeedbackButtons() {
    root.querySelectorAll("[data-product-feedback]").forEach((button) => {
      button.addEventListener("click", () => {
        setLive(button.dataset.productFeedback);
      });
    });

    root.querySelectorAll("[data-wishlist-toggle]").forEach((button) => {
      button.addEventListener("click", () => {
        const active = button.getAttribute("aria-pressed") === "true";
        button.setAttribute("aria-pressed", String(!active));
        button.innerHTML = `${!active ? "<span aria-hidden=\"true\">♥</span>Wishlist Tersimpan" : "<span aria-hidden=\"true\">♡</span>Simpan Wishlist"}`;
        setLive(!active ? "Produk disimpan ke wishlist." : "Produk dihapus dari wishlist.");
      });
    });
  }

  function initCart() {
    const addButton = root.querySelector("[data-modern-add-cart]");
    const mobileAdd = root.querySelector("[data-mobile-add-cart]");
    const qtyInput = root.querySelector("[data-qty-input]");

    if (!addButton) return;

    const addToCart = () => {
      const quantity = Math.max(1, Number(qtyInput?.value) || 1);
      const color = getSelectedChoice("color");
      const connection = getSelectedChoice("connection");
      const name = addButton.dataset.productName || "QuantumGrip X9 Wireless";
      const price = Number(addButton.dataset.productPrice) || 899000;
      const variant = [color, connection].filter(Boolean).join(" / ");

      if (Cart?.add) {
        Cart.add({
          name,
          price,
          qty: quantity,
          variant,
          image: "",
        });
      }

      setLive(`${name} ditambahkan ke keranjang.`);

      addButton.dataset.state = "success";
      addButton.innerHTML = "✓ Ditambahkan";
      window.setTimeout(() => {
        addButton.dataset.state = "idle";
        addButton.innerHTML = `
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h8.7a2 2 0 0 0 2-1.6L22 6H6"></path>
          </svg>
          Tambah ke Keranjang
        `;
      }, 1400);
    };

    addButton.addEventListener("click", addToCart);
    mobileAdd?.addEventListener("click", addToCart);
  }

  function initReviewLink() {
    const reviewLink = root.querySelector('.pd-rating-row a[href="#reviews"]');
    const reviewTab = root.querySelector('[data-tab-target="reviews"]');

    if (!reviewLink || !reviewTab) return;

    reviewLink.addEventListener("click", (event) => {
      event.preventDefault();
      reviewTab.click();
      root.querySelector("#reviews-panel")?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
        block: "start",
      });
    });
  }

  function initRelatedWishlists() {
    root.querySelectorAll(".pd-related-card > button").forEach((button) => {
      button.addEventListener("click", () => {
        const active = button.dataset.state === "active";
        button.dataset.state = active ? "idle" : "active";
        button.textContent = active ? "♡" : "♥";
        setLive(active ? "Item rekomendasi dihapus dari wishlist." : "Item rekomendasi disimpan ke wishlist.");
      });
    });
  }

  function init() {
    initGallery();
    initChoices();
    initQuantity();
    initTabs();
    initFeedbackButtons();
    initCart();
    initReviewLink();
    initRelatedWishlists();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
