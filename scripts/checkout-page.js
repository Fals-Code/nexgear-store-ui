(function () {
  "use strict";

  const CART_KEY = "nexgear_cart";
  const PROMO_KEY = "nexgear_cart_promo";
  const CHECKOUT_DRAFT_KEY = "nexgear_checkout_draft";
  const PENDING_ORDER_KEY = "nexgear_pending_order";
  const ORDERS_KEY = "nexgear_orders";
  const FREE_SHIPPING_THRESHOLD = 3000000;
  const PROMO_MAX_DISCOUNT = 250000;
  const INSURANCE_FEE = 15000;

  const form = document.getElementById("checkout-form");
  const layout = document.getElementById("checkout-layout");
  const emptyState = document.getElementById("checkout-empty");
  const summaryItems = document.getElementById("checkout-summary-items");
  const subtotalLabel = document.getElementById("checkout-subtotal-label");
  const subtotalValue = document.getElementById("checkout-subtotal");
  const shippingLabel = document.getElementById("checkout-shipping-label");
  const shippingValue = document.getElementById("checkout-shipping");
  const discountRow = document.getElementById("checkout-discount-row");
  const discountValue = document.getElementById("checkout-discount");
  const insuranceRow = document.getElementById("checkout-insurance-row");
  const insuranceValue = document.getElementById("checkout-insurance");
  const totalValue = document.getElementById("checkout-total");
  const mobileTotal = document.getElementById("checkout-mobile-total");
  const submitButton = document.getElementById("checkout-submit");
  const mobileSubmitButton = document.querySelector("#checkout-mobile-bar button");
  const provinceSelect = document.getElementById("province");
  const citySelect = document.getElementById("city");
  const insuranceInput = document.getElementById("shipping-insurance");
  const savedAddressToggle = document.getElementById("use-saved-address");
  const consent = document.getElementById("checkout-consent");
  const formError = document.getElementById("checkout-form-error");

  if (!form || !summaryItems) return;

  const citiesByProvince = {
    "Jawa Timur": ["Surabaya", "Sidoarjo", "Gresik", "Malang", "Kediri"],
    "DKI Jakarta": ["Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara"],
    "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Depok", "Cimahi"],
    Banten: ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon"],
    "Jawa Tengah": ["Semarang", "Surakarta", "Magelang", "Salatiga"],
  };

  const productMeta = {
    "Vortex VX Pro Mechanical": {
      image: "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=420",
      href: "product-detail.html?id=vortex-vx-pro-mechanical",
    },
    "Logitech G Pro X Superlight": {
      image: "https://www.cravingtech.com/blog/wp-content/uploads/2021/05/Logitech-G-PRO-X-SUPERLIGHT-Review-5.jpg",
      href: "product-detail.html?id=logitech-g-pro-x-superlight",
    },
    "Astro A50 Wireless Gen 4": {
      image: "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6349/6349970cv18d.jpg",
      href: "product-detail.html?id=astro-a50-wireless-gen-4",
    },
    "Zephyrus G14 RTX 4060": {
      image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=420&q=82",
      href: "product-detail.html?id=zephyrus-g14-rtx-4060",
    },
    "HyperX Pulsefire Haste": {
      image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c?auto=format&fit=crop&w=420&q=82",
      href: "product-detail.html?id=hyperx-pulsefire-haste",
    },
    "Arctis Nova Pro Wireless": {
      image: "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=420&q=82",
      href: "product-detail.html?id=arctis-nova-pro-wireless",
    },
    "Artisan Zero FX XL": {
      image: "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=420&q=82",
      href: "product-detail.html?id=artisan-zero-fx-xl",
    },
    "NVIDIA RTX 4080 Super": {
      image: "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=420&q=82",
      href: "catalog.html?category=build",
    },
  };

  const fallbackImage = "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=420&q=82";

  let cartItems = readCart();
  let isSubmitting = false;

  function readCart() {
    if (window.NexCart?.items) return window.NexCart.items;
    try {
      const value = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function getBaseName(name) {
    return String(name || "").split(" - ")[0].trim();
  }

  function getItemCount() {
    return cartItems.reduce((sum, item) => sum + Math.max(1, Number(item.qty) || 1), 0);
  }

  function getSubtotal() {
    return cartItems.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * Math.max(1, Number(item.qty) || 1),
      0,
    );
  }

  function getSelectedShipping() {
    return form.querySelector('input[name="shipping"]:checked');
  }

  function getSelectedPayment() {
    return form.querySelector('input[name="payment"]:checked');
  }

  function getShippingFee(subtotal) {
    const input = getSelectedShipping();
    const baseFee = Number(input?.dataset.fee) || 0;
    return subtotal >= FREE_SHIPPING_THRESHOLD ? Math.max(0, baseFee - 20000) : baseFee;
  }

  function getDiscount(subtotal) {
    return localStorage.getItem(PROMO_KEY) === "NEX10"
      ? Math.min(Math.round(subtotal * 0.1), PROMO_MAX_DISCOUNT)
      : 0;
  }

  function calculateTotals() {
    const subtotal = getSubtotal();
    const shipping = getShippingFee(subtotal);
    const discount = getDiscount(subtotal);
    const insurance = insuranceInput.checked ? INSURANCE_FEE : 0;
    return {
      subtotal,
      shipping,
      discount,
      insurance,
      total: Math.max(0, subtotal + shipping + insurance - discount),
    };
  }

  function renderSummaryItems() {
    summaryItems.innerHTML = cartItems
      .map((item) => {
        const name = getBaseName(item.name);
        const meta = productMeta[name] || {};
        const quantity = Math.max(1, Number(item.qty) || 1);
        const lineTotal = (Number(item.price) || 0) * quantity;
        const image = escapeHtml(item.image || meta.image || fallbackImage);
        const href = escapeHtml(item.href || meta.href || "catalog.html");

        return `
          <article class="checkout-summary-item">
            <a href="${href}" aria-label="Lihat ${escapeHtml(name)}">
              <img src="${image}" alt="${escapeHtml(name)}" loading="lazy">
            </a>
            <div>
              <h3>${escapeHtml(name)}</h3>
              <p>${quantity} × ${formatRupiah(item.price)}</p>
            </div>
            <strong>${formatRupiah(lineTotal)}</strong>
          </article>
        `;
      })
      .join("");
  }

  function updateShippingPrices(subtotal) {
    document.querySelectorAll('input[name="shipping"]').forEach((input) => {
      const baseFee = Number(input.dataset.fee) || 0;
      const fee = subtotal >= FREE_SHIPPING_THRESHOLD ? Math.max(0, baseFee - 20000) : baseFee;
      const output = document.querySelector(`[data-shipping-price="${input.value}"]`);
      if (output) output.textContent = fee === 0 ? "Gratis" : formatRupiah(fee);
    });
  }

  function renderTotals() {
    const totals = calculateTotals();
    const count = getItemCount();
    const shipping = getSelectedShipping();

    subtotalLabel.textContent = `Subtotal (${count} Item)`;
    subtotalValue.textContent = formatRupiah(totals.subtotal);
    shippingLabel.textContent = shipping?.dataset.label || "Pengiriman";
    shippingValue.textContent = totals.shipping === 0 ? "Gratis" : formatRupiah(totals.shipping);
    discountRow.hidden = totals.discount === 0;
    discountValue.textContent = `−${formatRupiah(totals.discount)}`;
    insuranceRow.hidden = totals.insurance === 0;
    insuranceValue.textContent = formatRupiah(totals.insurance);
    totalValue.textContent = formatRupiah(totals.total);
    mobileTotal.textContent = formatRupiah(totals.total);

    updateShippingPrices(totals.subtotal);
  }

  function renderCheckout() {
    const isEmpty = cartItems.length === 0;
    layout.hidden = isEmpty;
    emptyState.hidden = !isEmpty;
    submitButton.disabled = isEmpty;
    mobileSubmitButton.disabled = isEmpty;

    if (isEmpty) return;
    renderSummaryItems();
    renderTotals();
  }

  function populateCities(province, selectedCity) {
    const cities = citiesByProvince[province] || [];
    citySelect.innerHTML = '<option value="">Pilih kota</option>' + cities
      .map((city) => `<option value="${escapeHtml(city)}">${escapeHtml(city)}</option>`)
      .join("");
    citySelect.disabled = cities.length === 0;
    if (selectedCity && cities.includes(selectedCity)) citySelect.value = selectedCity;
  }

  function getFieldWrapper(input) {
    return input.closest(".checkout-field") || input.closest(".checkout-consent");
  }

  function validateInput(input) {
    const wrapper = getFieldWrapper(input);
    if (!wrapper) return input.checkValidity();
    const valid = input.checkValidity();
    wrapper.classList.toggle("is-invalid", !valid);
    return valid;
  }

  function validateForm() {
    const requiredInputs = Array.from(form.querySelectorAll("input[required], select[required], textarea[required]"));
    const validInputs = requiredInputs.map(validateInput);
    const valid = validInputs.every(Boolean);
    formError.hidden = valid;

    if (!valid) {
      const firstInvalid = requiredInputs.find((input) => !input.checkValidity());
      firstInvalid?.focus({ preventScroll: true });
      firstInvalid?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    return valid;
  }

  function readDraft() {
    try {
      return JSON.parse(localStorage.getItem(CHECKOUT_DRAFT_KEY) || "null");
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const data = new FormData(form);
    const draft = Object.fromEntries(data.entries());
    draft.province = provinceSelect.value;
    draft.city = citySelect.value;
    draft.insurance = insuranceInput.checked;
    draft.consent = consent.checked;
    localStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(draft));
  }

  function restoreDraft() {
    const draft = readDraft();
    if (!draft) return false;

    Object.entries(draft).forEach(([name, value]) => {
      const input = form.elements.namedItem(name);
      if (!input) return;
      if (input instanceof RadioNodeList) {
        const target = form.querySelector(`[name="${name}"][value="${CSS.escape(String(value))}"]`);
        if (target) target.checked = true;
      } else if (input.type === "checkbox") {
        input.checked = Boolean(value);
      } else if (name !== "city") {
        input.value = value;
      }
    });

    if (draft.province) {
      provinceSelect.value = draft.province;
      populateCities(draft.province, draft.city);
    }
    insuranceInput.checked = Boolean(draft.insurance);
    consent.checked = Boolean(draft.consent);
    return true;
  }

  function prefillUser() {
    const user = window.NexAuth?.user;
    if (!user) return;
    const nameInput = document.getElementById("customer-name");
    const emailInput = document.getElementById("customer-email");
    if (!nameInput.value && user.name) nameInput.value = user.name;
    if (!emailInput.value && user.email) emailInput.value = user.email;
  }

  function applySavedAddress(enabled) {
    const values = enabled
      ? {
          addressLine: "Jl. Jenderal Sudirman No. 88, Gedung NEX Residence, Blok C",
          province: "Jawa Timur",
          city: "Surabaya",
          district: "Wonokromo",
          postalCode: "60243",
          courierNote: "Titip kepada petugas keamanan jika tidak ada orang di rumah.",
        }
      : {
          addressLine: "",
          province: "",
          city: "",
          district: "",
          postalCode: "",
          courierNote: "",
        };

    document.getElementById("address-line").value = values.addressLine;
    provinceSelect.value = values.province;
    populateCities(values.province, values.city);
    document.getElementById("district").value = values.district;
    document.getElementById("postal-code").value = values.postalCode;
    document.getElementById("courier-note").value = values.courierNote;
    saveDraft();
  }

  function generateOrderId() {
    const now = new Date();
    const datePart = [
      String(now.getFullYear()).slice(-2),
      String(now.getMonth() + 1).padStart(2, "0"),
      String(now.getDate()).padStart(2, "0"),
    ].join("");
    const randomPart = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `NEX-${datePart}${randomPart}`;
  }

  function buildOrder() {
    const data = new FormData(form);
    const totals = calculateTotals();
    const shipping = getSelectedShipping();
    const payment = getSelectedPayment();

    return {
      id: generateOrderId(),
      createdAt: new Date().toISOString(),
      status: "waiting",
      paymentStatus: "waiting",
      customer: {
        name: data.get("customerName"),
        phone: data.get("customerPhone"),
        email: data.get("customerEmail"),
      },
      address: {
        line: data.get("addressLine"),
        province: data.get("province"),
        city: data.get("city"),
        district: data.get("district"),
        postalCode: data.get("postalCode"),
        courierNote: data.get("courierNote") || "",
      },
      shipping: {
        code: shipping?.value || "regular",
        label: shipping?.dataset.label || "Reguler",
        fee: totals.shipping,
      },
      payment: {
        code: payment?.value || "bca-va",
        label: payment?.dataset.label || "Virtual Account BCA",
      },
      insurance: insuranceInput.checked,
      items: cartItems.map((item) => ({ ...item })),
      promo: totals.discount > 0 ? "NEX10" : null,
      subtotal: totals.subtotal,
      shippingFee: totals.shipping,
      insuranceFee: totals.insurance,
      discount: totals.discount,
      total: totals.total,
    };
  }

  function appendOrder(order) {
    let orders = [];
    try {
      const stored = JSON.parse(localStorage.getItem(ORDERS_KEY) || "[]");
      if (Array.isArray(stored)) orders = stored;
    } catch {}
    orders.unshift(order);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }

  function setSubmitting(state) {
    isSubmitting = state;
    submitButton.disabled = state;
    mobileSubmitButton.disabled = state;
    submitButton.querySelector("span").textContent = state ? "Memproses Pesanan..." : "Buat Pesanan";
    submitButton.classList.toggle("is-loading", state);
  }

  provinceSelect.addEventListener("change", () => {
    populateCities(provinceSelect.value);
    validateInput(provinceSelect);
    saveDraft();
  });

  form.addEventListener("input", (event) => {
    const input = event.target;
    if (input.matches("input, select, textarea")) {
      if (input.hasAttribute("required")) validateInput(input);
      saveDraft();
    }
  });

  form.addEventListener("change", (event) => {
    if (event.target.matches('input[name="shipping"], input[name="payment"], #shipping-insurance')) {
      renderTotals();
      saveDraft();
    }
  });

  savedAddressToggle.addEventListener("change", () => {
    applySavedAddress(savedAddressToggle.checked);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (isSubmitting || cartItems.length === 0) return;
    if (!validateForm()) return;

    const order = buildOrder();
    setSubmitting(true);
    localStorage.setItem(PENDING_ORDER_KEY, JSON.stringify(order));
    appendOrder(order);
    localStorage.removeItem(CHECKOUT_DRAFT_KEY);

    if (window.NexCart?.clear) {
      window.NexCart.clear();
    } else {
      localStorage.setItem(CART_KEY, "[]");
    }

    window.setTimeout(() => {
      window.location.href = `success.html?order=${encodeURIComponent(order.id)}`;
    }, 650);
  });

  window.addEventListener("storage", (event) => {
    if (event.key !== CART_KEY) return;
    cartItems = readCart();
    renderCheckout();
  });

  restoreDraft();
  prefillUser();
  renderCheckout();
})();
