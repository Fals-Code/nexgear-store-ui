(function () {
  "use strict";

  const formatRupiah =
    window.formatRupiah ||
    ((value) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(Number(value) || 0));

  function activateTab(button) {
    const tabId = button.dataset.tab;
    const buttons = document.querySelectorAll(".pdp-tab-button[data-tab]");
    const panels = document.querySelectorAll(".pdp-tab-panel[data-panel]");

    buttons.forEach((item) => {
      const selected = item === button;
      item.setAttribute("aria-selected", String(selected));
      item.tabIndex = selected ? 0 : -1;
    });

    panels.forEach((panel) => {
      const selected = panel.dataset.panel === tabId;
      panel.hidden = !selected;
      panel.classList.toggle("is-entering", selected);
      if (selected) {
        window.setTimeout(() => panel.classList.remove("is-entering"), 320);
      }
    });
  }

  function initTabs() {
    const buttons = Array.from(
      document.querySelectorAll(".pdp-tab-button[data-tab]"),
    );

    buttons.forEach((button, index) => {
      button.addEventListener("click", () => activateTab(button));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
          return;
        }

        event.preventDefault();
        let targetIndex = index;
        if (event.key === "ArrowRight") targetIndex = (index + 1) % buttons.length;
        if (event.key === "ArrowLeft") targetIndex = (index - 1 + buttons.length) % buttons.length;
        if (event.key === "Home") targetIndex = 0;
        if (event.key === "End") targetIndex = buttons.length - 1;
        buttons[targetIndex].focus();
        activateTab(buttons[targetIndex]);
      });
    });
  }

  function initGallery() {
    const mainImage = document.getElementById("pdpMainImage");
    const thumbs = document.querySelectorAll(".pdp-gallery__thumb[data-image]");
    if (!mainImage || !thumbs.length) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        thumbs.forEach((item) => {
          item.classList.toggle("is-active", item === thumb);
          item.setAttribute("aria-pressed", String(item === thumb));
        });
        mainImage.src = thumb.dataset.image;
        mainImage.alt = thumb.dataset.alt || "NEXGEAR Quantum-X product view";
      });
    });
  }

  function initQuantity() {
    const quantityInput = document.getElementById("pdpQuantity");
    if (!quantityInput) return;

    document.querySelectorAll("[data-quantity-action]").forEach((button) => {
      button.addEventListener("click", () => {
        const current = Number(quantityInput.value) || 1;
        const delta = button.dataset.quantityAction === "increase" ? 1 : -1;
        quantityInput.value = Math.min(10, Math.max(1, current + delta));
      });
    });
  }

  function addToCart(button, product) {
    const quantityInput = document.getElementById("pdpQuantity");
    const qty = product.qty || Number(quantityInput?.value) || 1;

    if (window.NexCart) {
      window.NexCart.add({ ...product, qty });
    } else if (window.showNexToast) {
      window.showNexToast(`${product.name} ditambahkan ke keranjang`);
    }

    button.classList.add("is-success");
    const originalText = button.dataset.originalText || button.textContent.trim();
    button.dataset.originalText = originalText;
    button.textContent = "Added to Cart";
    window.setTimeout(() => {
      button.textContent = originalText;
      button.classList.remove("is-success");
    }, 1100);
  }

  function initCartButtons() {
    document.querySelectorAll("[data-pdp-add-cart]").forEach((button) => {
      button.addEventListener("click", () => {
        addToCart(button, {
          name: button.dataset.name || "NEXGEAR Quantum-X Mechanical Gaming Keyboard",
          price: Number(button.dataset.price) || 1899000,
          image: button.dataset.image || "",
          qty: Number(button.dataset.qty) || undefined,
        });
      });
    });
  }

  function initOptions() {
    document.querySelectorAll("[data-option-group]").forEach((group) => {
      group.querySelectorAll(".pdp-option__button").forEach((button) => {
        button.addEventListener("click", () => {
          group.querySelectorAll(".pdp-option__button").forEach((item) => {
            item.classList.toggle("is-active", item === button);
            item.setAttribute("aria-pressed", String(item === button));
          });
        });
      });
    });

    document.querySelectorAll("[data-toggle-action]").forEach((button) => {
      button.addEventListener("click", () => {
        button.classList.toggle("is-active");
        button.setAttribute(
          "aria-pressed",
          String(button.classList.contains("is-active")),
        );
        if (window.showNexToast) {
          window.showNexToast(
            button.classList.contains("is-active")
              ? "Produk disimpan"
              : "Produk dihapus dari daftar",
          );
        }
      });
    });
  }

  function initReviewSort() {
    const select = document.getElementById("reviewSort");
    const list = document.getElementById("reviewList");
    if (!select || !list) return;

    const cards = Array.from(list.querySelectorAll(".pdp-review-card"));
    const sortCards = () => {
      const sorted = [...cards].sort((a, b) => {
        if (select.value === "highest") {
          return Number(b.dataset.rating) - Number(a.dataset.rating);
        }
        if (select.value === "lowest") {
          return Number(a.dataset.rating) - Number(b.dataset.rating);
        }
        return Number(b.dataset.date) - Number(a.dataset.date);
      });
      sorted.forEach((card) => list.appendChild(card));
    };

    select.addEventListener("change", sortCards);
  }

  function initPaymentFallback() {
    document.querySelectorAll(".pdp-payment-logo img").forEach((image) => {
      image.addEventListener("error", () => {
        image.hidden = true;
        const fallback = image.nextElementSibling;
        if (fallback) fallback.style.display = "block";
      });
    });
  }

  function initDetailsMenus() {
    document.addEventListener("click", (event) => {
      document.querySelectorAll("details[open]").forEach((details) => {
        if (!details.contains(event.target)) details.removeAttribute("open");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      document.querySelectorAll("details[open]").forEach((details) => {
        details.removeAttribute("open");
      });
    });
  }

  function initReviewLink() {
    document.querySelectorAll("[data-open-reviews]").forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        document.getElementById("reviewsTab")?.click();
        document.querySelector(".pdp-tabs-section")?.scrollIntoView({
          behavior: "smooth",
        });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTabs();
    initGallery();
    initQuantity();
    initCartButtons();
    initOptions();
    initReviewSort();
    initPaymentFallback();
    initDetailsMenus();
    initReviewLink();

    document.querySelectorAll("[data-price-output]").forEach((element) => {
      element.textContent = formatRupiah(element.dataset.priceOutput);
    });
  });
})();
