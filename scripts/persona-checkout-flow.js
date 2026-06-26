(() => {
  "use strict";

  if (window.NexPersonaCheckoutFlow) return;

  const page = window.location.pathname.split("/").pop() || "index.html";
  const supportedPages = new Set([
    "cart.html",
    "checkout.html",
    "payment.html",
    "success.html",
    "transaction-history.html",
  ]);
  if (!supportedPages.has(page)) return;

  const KEYS = Object.freeze({
    profile: "nexgear_customer_profile",
    address: "nexgear_saved_address",
    preferences: "nexgear_checkout_preferences",
    draft: "nexgear_checkout_draft",
    pending: "nexgear_pending_order",
    orders: "nexgear_orders",
    lastOrder: "nexgear_last_order_id",
  });

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

  const parse = (key, fallback = null) => {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  };

  const write = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  };

  const formatMoney = (value) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

  const formatDate = (value) => new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

  const addDays = (value, days) => {
    const date = new Date(value || Date.now());
    date.setDate(date.getDate() + days);
    return date;
  };

  const shippingWindow = (code, base = Date.now()) => {
    const map = {
      "same-day": { min: 0, max: 0, label: "Tiba hari ini" },
      "next-day": { min: 1, max: 1, label: "Tiba besok" },
      regular: { min: 2, max: 3, label: "Tiba 2–3 hari kerja" },
    };
    const selected = map[code] || map.regular;
    const start = addDays(base, selected.min);
    const end = addDays(base, selected.max);
    return {
      code: code || "regular",
      minDays: selected.min,
      maxDays: selected.max,
      label: selected.min === selected.max
        ? selected.label
        : `${formatDate(start)} – ${formatDate(end)}`,
      start: start.toISOString(),
      end: end.toISOString(),
    };
  };

  const selectedInput = (name, context = document) => context.querySelector(`input[name="${name}"]:checked`);

  const emit = (name, detail = {}) => {
    window.dispatchEvent(new CustomEvent(`nexgear:${name}`, {
      detail: { ...detail, page },
    }));
  };

  class CheckoutEnhancer {
    constructor() {
      this.form = $("#checkout-form");
      this.submit = $("#checkout-submit");
      this.mobileSubmit = $("#checkout-mobile-bar button");
      this.savedToggle = $("#use-saved-address");
      this.summary = $(".checkout-summary");
      this.panels = $$(".checkout-panel");
      this.saveAddressInput = null;
      this.progress = null;
      this.continuity = null;
      this.saveTimer = 0;
      if (!this.form || !this.submit || !this.summary) return;
      this.init();
    }

    init() {
      this.createProgress();
      this.createSaveAddressChoice();
      this.createContinuity();
      this.restoreProfile();
      this.restorePreferences();
      this.refreshSavedAddressLabel();
      this.decorateShippingOptions();
      this.bindEvents();
      this.syncAll();
      document.body.dataset.personaCheckoutPhase = "continuity-ready";
      emit("checkout-continuity-ready", { valid: this.isReady() });
    }

    createProgress() {
      if ($("[data-persona-checkout-progress]")) {
        this.progress = $("[data-persona-checkout-progress]");
        return;
      }
      const element = document.createElement("section");
      element.className = "persona-checkout-progress";
      element.dataset.personaCheckoutProgress = "true";
      element.setAttribute("aria-label", "Kelengkapan checkout");
      element.innerHTML = `
        <div class="persona-checkout-progress__copy">
          <span>FAST CHECKOUT</span>
          <strong data-persona-progress-title>Lengkapi data sekali, gunakan kembali nanti.</strong>
          <small data-persona-progress-status aria-live="polite">Memeriksa kelengkapan data.</small>
        </div>
        <div class="persona-checkout-progress__steps">
          <span class="persona-checkout-progress__step" data-persona-step="contact">Kontak</span>
          <span class="persona-checkout-progress__step" data-persona-step="address">Alamat</span>
          <span class="persona-checkout-progress__step" data-persona-step="options">Kirim & Bayar</span>
        </div>`;
      this.form.prepend(element);
      this.progress = element;
    }

    createSaveAddressChoice() {
      const addressPanel = this.panels.find((panel) => panel.getAttribute("aria-labelledby") === "address-title");
      if (!addressPanel) return;
      const existing = $("#persona-save-address", addressPanel);
      if (existing) {
        this.saveAddressInput = existing;
        return;
      }
      const label = document.createElement("label");
      label.className = "persona-save-address";
      label.innerHTML = `
        <input id="persona-save-address" type="checkbox" checked>
        <span><strong>Simpan sebagai alamat utama</strong><small>Alamat dan kontak akan otomatis terisi pada checkout berikutnya di browser ini.</small></span>`;
      addressPanel.append(label);
      this.saveAddressInput = $("input", label);
    }

    createContinuity() {
      if ($("[data-persona-checkout-continuity]", this.summary)) {
        this.continuity = $("[data-persona-checkout-continuity]", this.summary);
        return;
      }
      const element = document.createElement("section");
      element.className = "persona-checkout-continuity";
      element.dataset.personaCheckoutContinuity = "true";
      element.setAttribute("aria-label", "Ringkasan pengiriman dan pembayaran");
      element.innerHTML = `
        <span>CHECKOUT SNAPSHOT</span>
        <div class="persona-checkout-continuity__grid">
          <div><span>Pengiriman</span><strong data-persona-shipping>Reguler</strong><small data-persona-eta>Estimasi 2–3 hari</small></div>
          <div><span>Pembayaran</span><strong data-persona-payment>Virtual Account BCA</strong><small>Metode dapat diubah pada halaman pembayaran.</small></div>
          <div><span>Alamat</span><strong data-persona-address>Belum lengkap</strong><small data-persona-address-state>Lengkapi alamat tujuan.</small></div>
          <div><span>Total konsisten</span><strong data-persona-total>Rp0</strong><small>Nilai ini diteruskan ke payment dan receipt.</small></div>
        </div>
        <span class="persona-checkout-save-state">Draft tersimpan otomatis di browser</span>
        <p class="persona-checkout-invalid-summary" data-persona-invalid-summary aria-live="polite"></p>`;
      const button = $("#checkout-submit", this.summary);
      button?.insertAdjacentElement("beforebegin", element);
      this.continuity = element;
    }

    restoreProfile() {
      const profile = parse(KEYS.profile, {});
      const authUser = parse("nexgear_user", {});
      const values = {
        customerName: profile.name || authUser.name || "",
        customerPhone: profile.phone || "",
        customerEmail: profile.email || authUser.email || "",
      };
      Object.entries(values).forEach(([name, value]) => {
        const input = this.form.elements.namedItem(name);
        if (input && !input.value && value) input.value = value;
      });
    }

    restorePreferences() {
      const preferences = parse(KEYS.preferences, {});
      const shipping = preferences.shipping
        ? this.form.querySelector(`input[name="shipping"][value="${CSS.escape(preferences.shipping)}"]`)
        : null;
      const payment = preferences.payment
        ? this.form.querySelector(`input[name="payment"][value="${CSS.escape(preferences.payment)}"]`)
        : null;
      if (shipping) shipping.checked = true;
      if (payment) payment.checked = true;
      if (typeof preferences.insurance === "boolean") {
        const insurance = $("#shipping-insurance");
        if (insurance) insurance.checked = preferences.insurance;
      }
      if (shipping || payment) {
        this.form.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }

    savedAddress() {
      return parse(KEYS.address, null);
    }

    refreshSavedAddressLabel() {
      const row = this.savedToggle?.closest(".saved-address-row");
      const summary = row?.querySelector(":scope > span");
      const saved = this.savedAddress();
      if (!summary) return;
      if (!saved) {
        summary.textContent = "Belum ada alamat tersimpan";
        return;
      }
      summary.textContent = [saved.addressLine, saved.city].filter(Boolean).join(", ");
    }

    applySavedAddress() {
      const saved = this.savedAddress();
      if (!saved || !this.savedToggle?.checked) return;
      const fields = {
        addressLine: saved.addressLine,
        province: saved.province,
        district: saved.district,
        postalCode: saved.postalCode,
        courierNote: saved.courierNote,
      };
      Object.entries(fields).forEach(([name, value]) => {
        const input = this.form.elements.namedItem(name);
        if (input && value != null) input.value = value;
      });
      const province = this.form.elements.namedItem("province");
      if (province && saved.province) {
        province.value = saved.province;
        province.dispatchEvent(new Event("change", { bubbles: true }));
        window.setTimeout(() => {
          const city = this.form.elements.namedItem("city");
          if (city && saved.city) {
            city.value = saved.city;
            city.dispatchEvent(new Event("change", { bubbles: true }));
          }
          this.syncAll();
        }, 0);
      }
    }

    decorateShippingOptions() {
      $$("input[name='shipping']", this.form).forEach((input) => {
        const choice = input.closest(".checkout-choice");
        const content = $(".checkout-choice__content", choice);
        if (!content || $(".persona-shipping-eta", content)) return;
        const eta = document.createElement("span");
        eta.className = "persona-shipping-eta";
        eta.dataset.personaShippingEta = input.value;
        eta.textContent = shippingWindow(input.value).label;
        content.append(eta);
      });
    }

    groupInputs(group) {
      const names = {
        contact: ["customerName", "customerPhone", "customerEmail"],
        address: ["addressLine", "province", "city", "district", "postalCode"],
        options: ["shipping", "payment"],
      }[group] || [];
      return names.map((name) => this.form.elements.namedItem(name)).filter(Boolean);
    }

    groupValid(group) {
      const inputs = this.groupInputs(group);
      const fieldsValid = inputs.every((input) => {
        if (input instanceof RadioNodeList) return Boolean(input.value);
        return input.validity?.valid !== false;
      });
      return group === "options" ? fieldsValid && Boolean($("#checkout-consent")?.checked) : fieldsValid;
    }

    isReady() {
      return ["contact", "address", "options"].every((group) => this.groupValid(group));
    }

    syncProgress() {
      const groups = ["contact", "address", "options"];
      let firstIncomplete = false;
      let completeCount = 0;
      groups.forEach((group) => {
        const valid = this.groupValid(group);
        if (valid) completeCount += 1;
        const step = $(`[data-persona-step="${group}"]`, this.progress);
        let state = "upcoming";
        if (valid) state = "complete";
        else if (!firstIncomplete) {
          state = "current";
          firstIncomplete = true;
        }
        if (step) step.dataset.state = state;
      });
      const status = $("[data-persona-progress-status]", this.progress);
      const title = $("[data-persona-progress-title]", this.progress);
      if (status) status.textContent = `${completeCount} dari 3 bagian lengkap.`;
      if (title) title.textContent = completeCount === 3
        ? "Data siap. Pesanan dapat dibuat."
        : "Lengkapi data sekali, gunakan kembali nanti.";

      this.panels.forEach((panel, index) => {
        const group = ["contact", "address", "options", "options"][index];
        const valid = this.groupValid(group);
        panel.dataset.personaState = valid ? "complete" : "attention";
        const statusBadge = $(".checkout-panel__status", panel);
        if (statusBadge) statusBadge.textContent = valid ? "Lengkap" : "Wajib";
      });
    }

    syncContinuity() {
      if (!this.continuity) return;
      const shipping = selectedInput("shipping", this.form);
      const payment = selectedInput("payment", this.form);
      const eta = shippingWindow(shipping?.value);
      const city = this.form.elements.namedItem("city")?.value || "";
      const province = this.form.elements.namedItem("province")?.value || "";
      const addressReady = this.groupValid("address");
      $("[data-persona-shipping]", this.continuity).textContent = shipping?.dataset.label || "Reguler";
      $("[data-persona-eta]", this.continuity).textContent = eta.label;
      $("[data-persona-payment]", this.continuity).textContent = payment?.dataset.label || "Virtual Account BCA";
      $("[data-persona-address]", this.continuity).textContent = addressReady ? city || province : "Belum lengkap";
      $("[data-persona-address-state]", this.continuity).textContent = addressReady
        ? [city, province].filter(Boolean).join(", ")
        : "Lengkapi alamat tujuan.";
      $("[data-persona-total]", this.continuity).textContent = $("#checkout-total")?.textContent || "Rp0";

      const missing = [];
      if (!this.groupValid("contact")) missing.push("kontak");
      if (!this.groupValid("address")) missing.push("alamat");
      if (!this.groupValid("options")) missing.push("persetujuan");
      const invalid = $("[data-persona-invalid-summary]", this.continuity);
      if (invalid) invalid.textContent = missing.length ? `Lengkapi ${missing.join(", ")} untuk melanjutkan.` : "";
    }

    syncSubmit() {
      const ready = this.isReady();
      const loading = this.submit.classList.contains("is-loading");
      this.submit.disabled = !ready || loading;
      if (this.mobileSubmit) this.mobileSubmit.disabled = !ready || loading;
      this.submit.setAttribute("aria-disabled", String(!ready || loading));
    }

    syncAll() {
      this.syncProgress();
      this.syncContinuity();
      this.syncSubmit();
      document.body.dataset.checkoutValidity = this.isReady() ? "ready" : "incomplete";
    }

    saveCustomerData() {
      const profile = {
        name: this.form.elements.namedItem("customerName")?.value.trim() || "",
        phone: this.form.elements.namedItem("customerPhone")?.value.trim() || "",
        email: this.form.elements.namedItem("customerEmail")?.value.trim() || "",
        updatedAt: new Date().toISOString(),
      };
      write(KEYS.profile, profile);

      if (this.saveAddressInput?.checked) {
        const address = {
          addressLine: this.form.elements.namedItem("addressLine")?.value.trim() || "",
          province: this.form.elements.namedItem("province")?.value || "",
          city: this.form.elements.namedItem("city")?.value || "",
          district: this.form.elements.namedItem("district")?.value.trim() || "",
          postalCode: this.form.elements.namedItem("postalCode")?.value.trim() || "",
          courierNote: this.form.elements.namedItem("courierNote")?.value.trim() || "",
          updatedAt: new Date().toISOString(),
        };
        write(KEYS.address, address);
      }

      const shipping = selectedInput("shipping", this.form);
      const payment = selectedInput("payment", this.form);
      write(KEYS.preferences, {
        shipping: shipping?.value || "regular",
        payment: payment?.value || "bca-va",
        insurance: Boolean($("#shipping-insurance")?.checked),
        updatedAt: new Date().toISOString(),
      });

      const draft = Object.fromEntries(new FormData(this.form));
      draft.province = this.form.elements.namedItem("province")?.value || "";
      draft.city = this.form.elements.namedItem("city")?.value || "";
      draft.insurance = Boolean($("#shipping-insurance")?.checked);
      draft.consent = Boolean($("#checkout-consent")?.checked);
      write(KEYS.draft, draft);
      this.refreshSavedAddressLabel();
    }

    augmentPendingOrder() {
      const order = parse(KEYS.pending, null);
      if (!order?.id) return;
      const shipping = selectedInput("shipping", this.form);
      const payment = selectedInput("payment", this.form);
      const eta = shippingWindow(shipping?.value, order.paidAt || order.createdAt || Date.now());
      order.fulfillment = {
        etaStart: eta.start,
        etaEnd: eta.end,
        etaLabel: eta.label,
        shippingCode: shipping?.value || "regular",
        shippingLabel: shipping?.dataset.label || "Reguler",
      };
      order.checkoutSnapshot = {
        subtotal: Number(order.subtotal) || 0,
        shippingFee: Number(order.shippingFee) || 0,
        insuranceFee: Number(order.insuranceFee) || 0,
        discount: Number(order.discount) || 0,
        total: Number(order.total) || 0,
        paymentCode: payment?.value || order.payment?.code || "bca-va",
        paymentLabel: payment?.dataset.label || order.payment?.label || "Virtual Account BCA",
        capturedAt: new Date().toISOString(),
      };
      order.updatedAt = new Date().toISOString();
      write(KEYS.pending, order);
      const orders = parse(KEYS.orders, []);
      const index = Array.isArray(orders) ? orders.findIndex((item) => item.id === order.id) : -1;
      if (index >= 0) orders[index] = order;
      else if (Array.isArray(orders)) orders.unshift(order);
      write(KEYS.orders, orders);
      write(KEYS.lastOrder, order.id);
      emit("checkout-snapshot", { orderId: order.id, total: order.total, eta: eta.label });
    }

    scheduleSave() {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = window.setTimeout(() => {
        if (this.groupValid("contact")) {
          const profile = {
            name: this.form.elements.namedItem("customerName")?.value.trim() || "",
            phone: this.form.elements.namedItem("customerPhone")?.value.trim() || "",
            email: this.form.elements.namedItem("customerEmail")?.value.trim() || "",
            updatedAt: new Date().toISOString(),
          };
          write(KEYS.profile, profile);
        }
      }, 280);
    }

    bindEvents() {
      this.form.addEventListener("input", () => {
        this.scheduleSave();
        requestAnimationFrame(() => this.syncAll());
      });
      this.form.addEventListener("change", () => {
        requestAnimationFrame(() => this.syncAll());
      });
      this.savedToggle?.addEventListener("change", () => {
        if (this.savedToggle.checked) window.setTimeout(() => this.applySavedAddress(), 0);
      });
      this.form.addEventListener("submit", () => {
        if (!this.isReady()) {
          this.syncAll();
          return;
        }
        this.saveCustomerData();
        window.setTimeout(() => this.augmentPendingOrder(), 0);
      });
      window.addEventListener("storage", (event) => {
        if ([KEYS.profile, KEYS.address, KEYS.preferences].includes(event.key)) {
          this.refreshSavedAddressLabel();
        }
      });
    }
  }

  class OrderContinuityEnhancer {
    constructor() {
      this.order = this.loadOrder();
      if (!this.order) return;
      this.init();
    }

    loadOrder() {
      const id = new URLSearchParams(location.search).get("order");
      const pending = parse(KEYS.pending, null);
      const orders = parse(KEYS.orders, []);
      return (Array.isArray(orders) ? orders.find((item) => item.id === id) : null)
        || ((!id || pending?.id === id) ? pending : null)
        || null;
    }

    eta() {
      if (this.order.fulfillment?.etaLabel) return this.order.fulfillment.etaLabel;
      return shippingWindow(this.order.shipping?.code, this.order.paidAt || this.order.createdAt).label;
    }

    createCard(container, before) {
      if (!container || $("[data-persona-order-continuity]", container)) return;
      const card = document.createElement("section");
      card.className = "persona-checkout-continuity";
      card.dataset.personaOrderContinuity = "true";
      card.setAttribute("aria-label", "Kontinuitas data pesanan");
      card.innerHTML = `
        <span>ORDER CONTINUITY</span>
        <div class="persona-checkout-continuity__grid">
          <div><span>Nomor pesanan</span><strong>${this.order.id}</strong><small>Digunakan pada payment, tracking, dan history.</small></div>
          <div><span>Total</span><strong>${formatMoney(this.order.total)}</strong><small>Sama dengan total checkout.</small></div>
          <div><span>Pengiriman</span><strong>${this.order.shipping?.label || "Reguler"}</strong><small>${this.eta()}</small></div>
          <div><span>Pembayaran</span><strong>${this.order.payment?.label || "Virtual Account BCA"}</strong><small>Metode tersimpan pada order.</small></div>
        </div>
        <span class="persona-checkout-save-state">Data pesanan tersinkron</span>`;
      if (before) before.insertAdjacentElement("beforebegin", card);
      else container.append(card);
    }

    persistPreference() {
      write(KEYS.preferences, {
        ...parse(KEYS.preferences, {}),
        payment: this.order.payment?.code || "bca-va",
        updatedAt: new Date().toISOString(),
      });
    }

    initPayment() {
      const summary = $(".payment-summary");
      this.createCard(summary, $(".payment-edit-order", summary));
      const edit = $(".payment-edit-order");
      if (edit) edit.href = `checkout.html?order=${encodeURIComponent(this.order.id)}`;
      const support = $(".payment-support-row a");
      if (support) support.href = `contact.html?order=${encodeURIComponent(this.order.id)}#support-form`;
      document.addEventListener("click", (event) => {
        const method = event.target.closest("[data-payment-method]");
        if (!method) return;
        window.setTimeout(() => {
          this.order = this.loadOrder() || this.order;
          this.persistPreference();
          $("[data-persona-order-continuity]", summary)?.remove();
          this.createCard(summary, $(".payment-edit-order", summary));
        }, 0);
      });
    }

    initSuccess() {
      const receipt = $(".success-receipt");
      this.createCard(receipt, $(".success-shop-again", receipt));
      const historyLink = $("a[href='transaction-history.html']");
      if (historyLink) historyLink.href = `transaction-history.html?order=${encodeURIComponent(this.order.id)}`;
      write(KEYS.lastOrder, this.order.id);
    }

    init() {
      document.body.dataset.personaCheckoutPhase = "continuity-ready";
      if (page === "payment.html") this.initPayment();
      if (page === "success.html") this.initSuccess();
      emit("order-continuity-ready", { orderId: this.order.id, total: this.order.total });
    }
  }

  const init = () => {
    if (page === "checkout.html") new CheckoutEnhancer();
    if (["payment.html", "success.html"].includes(page)) new OrderContinuityEnhancer();
    if (page === "cart.html") {
      document.body.dataset.personaCheckoutPhase = "cart-ready";
    }
  };

  window.addEventListener("load", init, { once: true });
  window.NexPersonaCheckoutFlow = Object.freeze({
    shippingWindow,
    refresh: init,
  });
})();
