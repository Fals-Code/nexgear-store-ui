(function () {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const K = {
    cart: "nexgear_cart",
    promo: "nexgear_cart_promo",
    draft: "nexgear_checkout_draft",
    pending: "nexgear_pending_order",
    orders: "nexgear_orders",
  };
  const FREE = 3000000,
    MAX_DISCOUNT = 250000,
    INSURANCE = 15000;
  const form = $("#checkout-form"),
    layout = $("#checkout-layout"),
    empty = $("#checkout-empty"),
    summaryItems = $("#checkout-summary-items"),
    province = $("#province"),
    city = $("#city"),
    insurance = $("#shipping-insurance"),
    savedAddress = $("#use-saved-address"),
    consent = $("#checkout-consent"),
    submit = $("#checkout-submit"),
    mobileSubmit = $("#checkout-mobile-bar button"),
    formError = $("#checkout-form-error");
  if (!form || !summaryItems) return;
  const cities = {
    "Jawa Timur": ["Surabaya", "Sidoarjo", "Gresik", "Malang", "Kediri"],
    "DKI Jakarta": [
      "Jakarta Selatan",
      "Jakarta Pusat",
      "Jakarta Barat",
      "Jakarta Timur",
      "Jakarta Utara",
    ],
    "Jawa Barat": ["Bandung", "Bekasi", "Bogor", "Depok", "Cimahi"],
    Banten: ["Tangerang", "Tangerang Selatan", "Serang", "Cilegon"],
    "Jawa Tengah": ["Semarang", "Surakarta", "Magelang", "Salatiga"],
  };
  const images = {
    "Vortex VX Pro Mechanical":
      "https://keebmechanicalkeyboard.id/wp-content/uploads/2021/04/vx8-pro-tutorial-4.jpg?w=420",
    "Logitech G Pro X Superlight":
      "https://www.cravingtech.com/blog/wp-content/uploads/2021/05/Logitech-G-PRO-X-SUPERLIGHT-Review-5.jpg",
    "Astro A50 Wireless Gen 4":
      "https://pisces.bbystatic.com/image2/BestBuy_US/images/products/6349/6349970cv18d.jpg",
    "Zephyrus G14 RTX 4060":
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=420&q=82",
    "HyperX Pulsefire Haste":
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c?auto=format&fit=crop&w=420&q=82",
    "Arctis Nova Pro Wireless":
      "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=420&q=82",
    "Artisan Zero FX XL":
      "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=420&q=82",
    "NVIDIA RTX 4080 Super":
      "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=420&q=82",
  };
  let items = readCart(),
    submitting = false;
  function parse(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }
  function readCart() {
    return window.NexCart?.items || parse(K.cart, []);
  }
  function money(v) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(v) || 0);
  }
  function esc(v) {
    return String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function baseName(v) {
    return String(v || "")
      .split(" - ")[0]
      .trim();
  }
  function itemCount() {
    return items.reduce((s, x) => s + Math.max(1, Number(x.qty) || 1), 0);
  }
  function subtotal() {
    return items.reduce(
      (s, x) => s + (Number(x.price) || 0) * Math.max(1, Number(x.qty) || 1),
      0,
    );
  }
  function selected(name) {
    return form.querySelector(`input[name="${name}"]:checked`);
  }
  function totals() {
    const sub = subtotal(),
      shipInput = selected("shipping"),
      base = Number(shipInput?.dataset.fee) || 0,
      shipping = sub >= FREE ? Math.max(0, base - 20000) : base,
      discount =
        localStorage.getItem(K.promo) === "NEX10"
          ? Math.min(Math.round(sub * 0.1), MAX_DISCOUNT)
          : 0,
      insuranceFee = insurance.checked ? INSURANCE : 0;
    return {
      subtotal: sub,
      shipping,
      discount,
      insurance: insuranceFee,
      total: Math.max(0, sub + shipping + insuranceFee - discount),
    };
  }
  function renderItems() {
    summaryItems.innerHTML = items
      .map((item) => {
        const name = baseName(item.name),
          qty = Math.max(1, Number(item.qty) || 1),
          img = esc(
            item.image ||
              images[name] ||
              "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=420&q=82",
          );
        return `<article class="checkout-summary-item"><img src="${img}" alt="${esc(name)}"><div><h3>${esc(name)}</h3><p>${qty} × ${money(item.price)}</p></div><strong>${money((Number(item.price) || 0) * qty)}</strong></article>`;
      })
      .join("");
  }
  function renderTotals() {
    const t = totals(),
      ship = selected("shipping");
    $("#checkout-subtotal-label").textContent =
      `Subtotal (${itemCount()} Item)`;
    $("#checkout-subtotal").textContent = money(t.subtotal);
    $("#checkout-shipping-label").textContent =
      ship?.dataset.label || "Pengiriman";
    $("#checkout-shipping").textContent = t.shipping
      ? money(t.shipping)
      : "Gratis";
    $("#checkout-discount-row").hidden = !t.discount;
    $("#checkout-discount").textContent = `−${money(t.discount)}`;
    $("#checkout-insurance-row").hidden = !t.insurance;
    $("#checkout-insurance").textContent = money(t.insurance);
    $("#checkout-total").textContent = money(t.total);
    $("#checkout-mobile-total").textContent = money(t.total);
    $$('input[name="shipping"]').forEach((input) => {
      const fee =
        t.subtotal >= FREE
          ? Math.max(0, (Number(input.dataset.fee) || 0) - 20000)
          : Number(input.dataset.fee) || 0;
      const out = $(`[data-shipping-price="${input.value}"]`);
      if (out) out.textContent = fee ? money(fee) : "Gratis";
    });
  }
  function render() {
    const isEmpty = !items.length;
    layout.hidden = isEmpty;
    empty.hidden = !isEmpty;
    submit.disabled = isEmpty;
    mobileSubmit.disabled = isEmpty;
    if (isEmpty) return;
    renderItems();
    renderTotals();
  }
  function populate(prov, selectedCity = "") {
    const list = cities[prov] || [];
    city.innerHTML =
      '<option value="">Pilih kota</option>' +
      list.map((x) => `<option value="${esc(x)}">${esc(x)}</option>`).join("");
    city.disabled = !list.length;
    if (list.includes(selectedCity)) city.value = selectedCity;
  }
  function wrapper(input) {
    return (
      input.closest(".checkout-field") || input.closest(".checkout-consent")
    );
  }
  function validateInput(input) {
    const valid = input.checkValidity(),
      wrap = wrapper(input);
    wrap?.classList.toggle("is-invalid", !valid);
    return valid;
  }
  function validate() {
    const required = $$(
        "input[required],select[required],textarea[required]",
        form,
      ),
      valid = required.map(validateInput).every(Boolean);
    formError.hidden = valid;
    if (!valid) {
      const first = required.find((x) => !x.checkValidity());
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.focus({ preventScroll: true });
    }
    return valid;
  }
  function saveDraft() {
    const data = Object.fromEntries(new FormData(form));
    data.province = province.value;
    data.city = city.value;
    data.insurance = insurance.checked;
    data.consent = consent.checked;
    localStorage.setItem(K.draft, JSON.stringify(data));
  }
  function restoreDraft() {
    const d = parse(K.draft, null);
    if (!d) return;
    Object.entries(d).forEach(([name, value]) => {
      const input = form.elements.namedItem(name);
      if (!input) return;
      if (input instanceof RadioNodeList) {
        const target = form.querySelector(
          `[name="${name}"][value="${CSS.escape(String(value))}"]`,
        );
        if (target) target.checked = true;
      } else if (input.type === "checkbox") input.checked = Boolean(value);
      else if (name !== "city") input.value = value;
    });
    if (d.province) {
      province.value = d.province;
      populate(d.province, d.city);
    }
    insurance.checked = Boolean(d.insurance);
    consent.checked = Boolean(d.consent);
  }
  function prefill() {
    const user = window.NexAuth?.user;
    if (!user) return;
    if (!$("#customer-name").value && user.name)
      $("#customer-name").value = user.name;
    if (!$("#customer-email").value && user.email)
      $("#customer-email").value = user.email;
  }
  function applyAddress(on) {
    const d = on
      ? {
          addressLine:
            "Jl. Jenderal Sudirman No. 88, Gedung NEX Residence, Blok C",
          province: "Jawa Timur",
          city: "Surabaya",
          district: "Wonokromo",
          postalCode: "60243",
          courierNote:
            "Titip kepada petugas keamanan jika tidak ada orang di rumah.",
        }
      : {
          addressLine: "",
          province: "",
          city: "",
          district: "",
          postalCode: "",
          courierNote: "",
        };
    $("#address-line").value = d.addressLine;
    province.value = d.province;
    populate(d.province, d.city);
    $("#district").value = d.district;
    $("#postal-code").value = d.postalCode;
    $("#courier-note").value = d.courierNote;
    saveDraft();
  }
  function orderId() {
    const d = new Date(),
      date = `${String(d.getFullYear()).slice(-2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`,
      random = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `NEX-${date}${random}`;
  }
  function buildOrder() {
    const data = new FormData(form),
      t = totals(),
      shipping = selected("shipping"),
      payment = selected("payment"),
      now = new Date();
    return {
      id: orderId(),
      createdAt: now.toISOString(),
      paymentDeadline: new Date(now.getTime() + 864e5).toISOString(),
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
        fee: t.shipping,
      },
      payment: {
        code: payment?.value || "bca-va",
        label: payment?.dataset.label || "Virtual Account BCA",
      },
      insurance: insurance.checked,
      items: items.map((x) => ({ ...x })),
      promo: t.discount ? "NEX10" : null,
      subtotal: t.subtotal,
      shippingFee: t.shipping,
      insuranceFee: t.insurance,
      discount: t.discount,
      total: t.total,
    };
  }
  function persistOrder(order) {
    localStorage.setItem(K.pending, JSON.stringify(order));
    const orders = parse(K.orders, []);
    orders.unshift(order);
    localStorage.setItem(K.orders, JSON.stringify(orders));
  }
  function setSubmitting(state) {
    submitting = state;
    submit.disabled = state;
    mobileSubmit.disabled = state;
    submit.querySelector("span").textContent = state
      ? "Menyiapkan Pembayaran..."
      : "Buat Pesanan";
    submit.classList.toggle("is-loading", state);
  }
  province.addEventListener("change", () => {
    populate(province.value);
    validateInput(province);
    saveDraft();
  });
  form.addEventListener("input", (e) => {
    if (e.target.matches("input,select,textarea")) {
      if (e.target.required) validateInput(e.target);
      saveDraft();
    }
  });
  form.addEventListener("change", (e) => {
    if (
      e.target.matches(
        'input[name="shipping"],input[name="payment"],#shipping-insurance',
      )
    ) {
      renderTotals();
      saveDraft();
    }
  });
  savedAddress.addEventListener("change", () =>
    applyAddress(savedAddress.checked),
  );
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (submitting || !items.length || !validate()) return;
    const order = buildOrder();
    setSubmitting(true);
    persistOrder(order);
    localStorage.removeItem(K.draft);
    setTimeout(() => {
      location.href = `payment.html?order=${encodeURIComponent(order.id)}`;
    }, 550);
  });
  window.addEventListener("storage", (e) => {
    if (e.key === K.cart) {
      items = readCart();
      render();
    }
  });
  restoreDraft();
  prefill();
  render();
})();
