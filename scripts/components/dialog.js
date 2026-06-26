(() => {
  "use strict";

  const FOCUSABLE =
    'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function createDialog(root, closeSelector = "[data-dialog-close]") {
    if (!root) return null;
    let returnFocus = null;
    const focusables = () =>
      Array.from(root.querySelectorAll(FOCUSABLE)).filter(
        (element) => !element.hidden && element.offsetParent !== null,
      );
    function open(trigger = document.activeElement) {
      returnFocus = trigger instanceof HTMLElement ? trigger : null;
      root.hidden = false;
      root.dataset.state = "open";
      root.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => focusables()[0]?.focus());
    }
    function close() {
      root.dataset.state = "closed";
      root.setAttribute("aria-hidden", "true");
      root.hidden = true;
      document.body.style.overflow = "";
      returnFocus?.focus?.();
    }
    root.addEventListener("click", (event) => {
      if (event.target === root || event.target.closest(closeSelector)) close();
    });
    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") return close();
      if (event.key !== "Tab") return;
      const elements = focusables();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    return Object.freeze({ open, close });
  }

  window.NexDialog = Object.freeze({ create: createDialog });

  function initTrustModal() {
    const modal = document.getElementById("trustModal");
    const title = document.getElementById("trustModalTitle");
    const copy = document.getElementById("trustModalCopy");
    const link = document.getElementById("trustModalLink");
    const closeBtn = modal?.querySelector(".trust-modal__close");
    const triggers = document.querySelectorAll(".trust-action");
    if (!modal || !title || !copy || !link || !closeBtn || !triggers.length) {
      return;
    }

    const content = {
      stock: {
        title: "Ready Stock",
        copy: "Produk pilihan diprioritaskan dari stok siap proses agar checkout tidak berakhir di estimasi yang abu-abu.",
        href: "catalog.html",
        label: "Lihat Catalog",
      },
      warranty: {
        title: "Garansi Resmi",
        copy: "Gear kurasi NEXGEAR diarahkan ke produk bergaransi resmi dengan dukungan brand dan invoice pembelian.",
        href: "about.html",
        label: "Baca Detail",
      },
      checkout: {
        title: "Secure Checkout",
        copy: "Alur checkout dibuat ringkas dengan ringkasan pesanan, validasi data, dan pembayaran yang jelas.",
        href: "cart.html",
        label: "Cek Keranjang",
      },
      delivery: {
        title: "Fast Delivery",
        copy: "Pesanan diproses cepat untuk kebutuhan setup mendadak, upgrade kompetitif, atau workflow harian.",
        href: "contact.html",
        label: "Hubungi Support",
      },
    };

    function closeModal() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      requestAnimationFrame(() => {
        document.querySelectorAll(".reveal:not(.active)").forEach((element) => {
          const rect = element.getBoundingClientRect();
          const isVisible =
            rect.top < window.innerHeight * 0.95 && rect.bottom > 0;
          if (isVisible) element.classList.add("active");
        });
      });
    }

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        const data = content[trigger.dataset.trust] || content.stock;
        title.textContent = data.title;
        copy.textContent = data.copy;
        link.href = data.href;
        link.textContent = data.label;
        modal.classList.add("open");
        modal.setAttribute("aria-hidden", "false");
        closeBtn.focus();
      });
    });

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("open")) {
        closeModal();
      }
    });
  }

  let initialized = false;

  function safeInit(initializer) {
    try {
      if (typeof initializer === "function") initializer();
    } catch (error) {
      console.warn("NEXGEAR NexDialogs warning:", error);
    }
  }

  function init() {
    if (initialized) return;
    initialized = true;
    safeInit(initTrustModal);
  }

  window.NexDialogs = Object.freeze({ init });
})();
