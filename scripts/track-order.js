(() => {
  "use strict";

  if (window.NexOrderTracking) return;

  const ORDERS = [
    {
      id: "NEX-88392019A",
      status: "shipping",
      statusTitle: "Dalam pengiriman",
      statusDescription: "Paket sudah meninggalkan hub sortir dan sedang menuju kota tujuan.",
      eta: "08 Jun 2026",
      countdown: "1–2 hari lagi",
      courier: "JNE Reguler",
      receipt: "88392019A123",
      recipient: "John Doe",
      address: "Jakarta Selatan, DKI Jakarta",
      payment: "Virtual Account BCA",
      total: "Rp1.599.000",
      route: { origin: "Surabaya", current: "Jakarta Gateway", destination: "Jakarta Selatan" },
      products: [
        {
          name: "Vortex VX Pro Mechanical",
          meta: "Mechanical Keyboard · Midnight Black · 1 item",
          image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=420&q=85",
        },
      ],
      events: [
        { title: "Berangkat dari hub Jakarta Gateway", detail: "Paket diteruskan ke fasilitas pengantaran terakhir.", location: "Jakarta Gateway", time: "07 Jun 2026 · 05.42 WIB", state: "current" },
        { title: "Tiba di pusat sortir", detail: "Paket selesai dipindai dan masuk antrean sortir wilayah tujuan.", location: "Jakarta Gateway", time: "06 Jun 2026 · 22.18 WIB", state: "complete" },
        { title: "Diserahkan kepada kurir", detail: "Paket telah diambil oleh JNE Reguler dari gudang NEXGEAR.", location: "Surabaya", time: "06 Jun 2026 · 16.40 WIB", state: "complete" },
        { title: "Pesanan diproses", detail: "Produk diperiksa, dikemas, dan label pengiriman dibuat.", location: "NEXGEAR Fulfillment", time: "06 Jun 2026 · 09.15 WIB", state: "complete" },
        { title: "Pembayaran dikonfirmasi", detail: "Pembayaran berhasil diverifikasi dan pesanan masuk antrean gudang.", location: "NEXGEAR System", time: "05 Jun 2026 · 14.30 WIB", state: "complete" },
      ],
    },
    {
      id: "NEX-88271018C",
      status: "waiting-payment",
      statusTitle: "Menunggu pembayaran",
      statusDescription: "Pesanan sudah dibuat. Selesaikan pembayaran agar stok segera diamankan.",
      eta: "Belum tersedia",
      countdown: "Dihitung setelah pembayaran",
      courier: "Belum ditentukan",
      receipt: "Belum tersedia",
      recipient: "Nadia Putri",
      address: "Bandung, Jawa Barat",
      payment: "Virtual Account Mandiri",
      total: "Rp4.299.000",
      route: { origin: "Surabaya", current: "Menunggu pembayaran", destination: "Bandung" },
      products: [
        {
          name: "Arctis Nova Pro Wireless",
          meta: "Wireless Headset · Black · 1 item",
          image: "https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&w=420&q=85",
        },
      ],
      events: [
        { title: "Pesanan dibuat", detail: "Nomor pembayaran sudah diterbitkan dan menunggu konfirmasi.", location: "NEXGEAR System", time: "03 Jun 2026 · 11.20 WIB", state: "current" },
      ],
    },
    {
      id: "NEX-88192072B",
      status: "processing",
      statusTitle: "Sedang diproses",
      statusDescription: "Tim gudang sedang memeriksa produk dan menyiapkan paket untuk pickup.",
      eta: "02 Jun 2026",
      countdown: "Estimasi 2–3 hari setelah dikirim",
      courier: "J&T Express",
      receipt: "Menunggu pickup",
      recipient: "Raka Fajar",
      address: "Yogyakarta, DI Yogyakarta",
      payment: "GoPay",
      total: "Rp2.398.000",
      route: { origin: "Surabaya", current: "NEXGEAR Fulfillment", destination: "Yogyakarta" },
      products: [
        {
          name: "HyperX Pulsefire Haste",
          meta: "Gaming Mouse · Black · 1 item",
          image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c9?auto=format&fit=crop&w=420&q=85",
        },
        {
          name: "Artisan Zero FX XL",
          meta: "Mousepad · Black · 1 item",
          image: "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=420&q=85",
        },
      ],
      events: [
        { title: "Packing sedang berlangsung", detail: "Produk lolos pemeriksaan awal dan masuk meja packing.", location: "NEXGEAR Fulfillment", time: "30 Mei 2026 · 10.12 WIB", state: "current" },
        { title: "Pembayaran dikonfirmasi", detail: "Pembayaran GoPay berhasil diterima.", location: "NEXGEAR System", time: "29 Mei 2026 · 18.05 WIB", state: "complete" },
      ],
    },
    {
      id: "NEX-77281920B",
      status: "delivered",
      statusTitle: "Pesanan diterima",
      statusDescription: "Paket telah diterima di alamat tujuan. Terima kasih sudah berbelanja di NEXGEAR.",
      eta: "Diterima 15 Mei 2026",
      countdown: "Pengiriman selesai",
      courier: "SiCepat REG",
      receipt: "SC77281920",
      recipient: "John Doe",
      address: "Jakarta Selatan, DKI Jakarta",
      payment: "Kartu Kredit",
      total: "Rp899.000",
      route: { origin: "Surabaya", current: "Diterima pelanggan", destination: "Jakarta Selatan" },
      products: [
        {
          name: "HyperX Pulsefire Haste",
          meta: "Gaming Mouse · Black · 1 item",
          image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c3c9c9?auto=format&fit=crop&w=420&q=85",
        },
      ],
      events: [
        { title: "Paket diterima", detail: "Paket diterima oleh penerima di alamat tujuan.", location: "Jakarta Selatan", time: "15 Mei 2026 · 13.08 WIB", state: "current" },
        { title: "Kurir menuju alamat", detail: "Paket dibawa kurir untuk pengantaran terakhir.", location: "Jakarta Selatan", time: "15 Mei 2026 · 08.16 WIB", state: "complete" },
        { title: "Berangkat dari hub", detail: "Paket diteruskan dari hub tujuan.", location: "Jakarta Gateway", time: "14 Mei 2026 · 22.10 WIB", state: "complete" },
        { title: "Diserahkan kepada kurir", detail: "Paket meninggalkan gudang NEXGEAR.", location: "Surabaya", time: "13 Mei 2026 · 16.32 WIB", state: "complete" },
        { title: "Pembayaran dikonfirmasi", detail: "Pembayaran kartu kredit berhasil diverifikasi.", location: "NEXGEAR System", time: "12 Mei 2026 · 11.42 WIB", state: "complete" },
      ],
    },
    {
      id: "NEX-68192011D",
      status: "refund",
      statusTitle: "Refund selesai",
      statusDescription: "Dana pengembalian sudah diproses ke metode pembayaran awal.",
      eta: "Selesai 25 Mar 2026",
      countdown: "Tidak ada pengiriman aktif",
      courier: "JNE Reguler",
      receipt: "JNE68192011",
      recipient: "Dimas Kurnia",
      address: "Semarang, Jawa Tengah",
      payment: "QRIS",
      total: "Rp1.100.000",
      route: { origin: "Surabaya", current: "Refund selesai", destination: "Semarang" },
      products: [
        {
          name: "Artisan Zero FX XL",
          meta: "Mousepad · Black · 1 item",
          image: "https://images.unsplash.com/photo-1629429408209-1f912961dbd8?auto=format&fit=crop&w=420&q=85",
        },
      ],
      events: [
        { title: "Refund selesai", detail: "Dana dikembalikan ke metode pembayaran awal.", location: "NEXGEAR Finance", time: "25 Mar 2026 · 14.20 WIB", state: "current" },
        { title: "Permintaan refund disetujui", detail: "Tim support menyetujui pengembalian dana.", location: "NEXGEAR Support", time: "23 Mar 2026 · 10.15 WIB", state: "complete" },
        { title: "Pesanan dikembalikan", detail: "Paket retur diterima dan diperiksa oleh gudang.", location: "NEXGEAR Fulfillment", time: "22 Mar 2026 · 17.08 WIB", state: "complete" },
      ],
    },
    {
      id: "NEX-55182771E",
      status: "cancelled",
      statusTitle: "Pesanan dibatalkan",
      statusDescription: "Pesanan tidak dilanjutkan dan tidak ada paket yang dikirim.",
      eta: "Tidak berlaku",
      countdown: "Pesanan berhenti",
      courier: "Belum ditentukan",
      receipt: "Tidak tersedia",
      recipient: "Alya Nirmala",
      address: "Malang, Jawa Timur",
      payment: "Virtual Account BNI",
      total: "Rp7.499.000",
      route: { origin: "Surabaya", current: "Pesanan dibatalkan", destination: "Malang" },
      products: [
        {
          name: "NEX Ultrawide 34 QHD",
          meta: "Gaming Monitor · Black · 1 item",
          image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=420&q=85",
        },
      ],
      events: [
        { title: "Pesanan dibatalkan", detail: "Batas pembayaran berakhir sebelum pembayaran dikonfirmasi.", location: "NEXGEAR System", time: "09 Jan 2026 · 00.05 WIB", state: "current" },
        { title: "Pesanan dibuat", detail: "Nomor pembayaran Virtual Account BNI diterbitkan.", location: "NEXGEAR System", time: "08 Jan 2026 · 15.34 WIB", state: "complete" },
      ],
    },
  ];

  const STATUS_STEPS = [
    { key: "payment", label: "Pembayaran", description: "Terverifikasi" },
    { key: "processing", label: "Diproses", description: "Gudang" },
    { key: "shipping", label: "Dikirim", description: "Kurir" },
    { key: "delivered", label: "Diterima", description: "Selesai" },
  ];

  const STATUS_INDEX = {
    "waiting-payment": 0,
    processing: 1,
    shipping: 2,
    delivered: 3,
  };

  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  class PrototypeOrderRepository {
    async find(orderNumber) {
      await new Promise((resolve) => window.setTimeout(resolve, 520));
      return ORDERS.find((order) => order.id === orderNumber) || null;
    }
  }

  class OrderTrackingController {
    constructor(root, repository) {
      this.root = root;
      this.repository = repository;
      this.form = $("[data-order-track]", root);
      this.input = $("[name='orderNumber']", root);
      this.formStatus = $("[data-track-form-status]", root);
      this.loading = $("[data-track-loading]", root);
      this.empty = $("[data-track-empty]", root);
      this.error = $("[data-track-error]", root);
      this.result = $("[data-track-result]", root);
      this.submit = $("button[type='submit']", this.form);
      this.requestId = 0;
      this.bindEvents();
      this.restoreFromUrl();
    }

    emit(name, detail = {}) {
      window.dispatchEvent(new CustomEvent(`nexgear:${name}`, {
        detail: { ...detail, page: "track-order" },
      }));
    }

    normalize(value) {
      return String(value || "").trim().toUpperCase();
    }

    validate(value) {
      return /^NEX-[A-Z0-9]{8,14}$/.test(value);
    }

    setState(state, message = "") {
      this.root.dataset.trackState = state;
      this.loading.hidden = state !== "loading";
      this.empty.hidden = state !== "not-found";
      this.error.hidden = state !== "error";
      this.result.hidden = state !== "success";
      this.submit.disabled = state === "loading";
      this.submit.setAttribute("aria-busy", String(state === "loading"));
      if (this.formStatus) this.formStatus.textContent = message;
    }

    bindEvents() {
      this.form?.addEventListener("submit", (event) => {
        event.preventDefault();
        this.track(this.input.value);
      });

      this.root.addEventListener("click", (event) => {
        const sample = event.target.closest("[data-track-sample]");
        if (sample) {
          this.input.value = sample.dataset.trackSample || "";
          this.track(this.input.value);
          return;
        }

        const retry = event.target.closest("[data-track-retry]");
        if (retry) {
          this.input.focus();
          this.form.requestSubmit();
          return;
        }

        const change = event.target.closest("[data-track-change]");
        if (change) {
          this.input.focus();
          this.input.select();
          this.root.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        const copy = event.target.closest("[data-copy-value]");
        if (copy) this.copyValue(copy);
      });

      this.input?.addEventListener("input", () => {
        this.input.value = this.normalize(this.input.value);
        this.input.setCustomValidity("");
        if (this.root.dataset.trackState === "error") this.setState("idle");
      });
    }

    async copyValue(button) {
      const selector = button.dataset.copyValue;
      const target = selector ? $(selector, this.root) : null;
      const value = target?.textContent?.trim();
      if (!value || value === "Belum tersedia" || value === "Tidak tersedia") return;

      try {
        await navigator.clipboard.writeText(value);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = value;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.append(textarea);
        textarea.select();
        document.execCommand("copy");
        textarea.remove();
      }

      const original = button.textContent;
      button.textContent = "Tersalin";
      button.dataset.state = "success";
      window.setTimeout(() => {
        button.textContent = original;
        button.dataset.state = "idle";
      }, 1400);
      this.emit("tracking-copy", { value });
    }

    syncUrl(orderNumber) {
      const url = new URL(window.location.href);
      url.searchParams.set("order", orderNumber);
      window.history.replaceState({}, "", url);
    }

    restoreFromUrl() {
      const orderNumber = new URLSearchParams(window.location.search).get("order");
      if (!orderNumber) return;
      this.input.value = this.normalize(orderNumber);
      this.track(this.input.value);
    }

    async track(rawOrderNumber) {
      const orderNumber = this.normalize(rawOrderNumber);
      this.input.value = orderNumber;

      if (!this.validate(orderNumber)) {
        this.input.setCustomValidity("Gunakan format nomor pesanan seperti NEX-88392019A.");
        this.input.reportValidity();
        this.setState("error", "Format nomor pesanan belum benar.");
        this.emit("tracking-error", { reason: "invalid-format", orderNumber });
        return;
      }

      const currentRequest = ++this.requestId;
      this.setState("loading", `Mencari status ${orderNumber}...`);
      this.emit("tracking-started", { orderNumber });

      try {
        const order = await this.repository.find(orderNumber);
        if (currentRequest !== this.requestId) return;

        if (!order) {
          this.setState("not-found", `Pesanan ${orderNumber} tidak ditemukan.`);
          $("[data-track-missing-number]", this.empty).textContent = orderNumber;
          this.emit("tracking-not-found", { orderNumber });
          this.empty.focus({ preventScroll: true });
          this.empty.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }

        this.render(order);
        this.syncUrl(orderNumber);
        this.setState("success", `Status terbaru ${orderNumber} berhasil dimuat.`);
        this.result.focus({ preventScroll: true });
        this.result.scrollIntoView({ behavior: "smooth", block: "start" });
        this.emit("tracking-success", { orderNumber, status: order.status });
      } catch (error) {
        if (currentRequest !== this.requestId) return;
        this.setState("error", "Status pesanan gagal dimuat. Coba kembali.");
        this.emit("tracking-error", { reason: "repository-error", orderNumber, message: error?.message });
      }
    }

    render(order) {
      this.root.dataset.shipmentStatus = order.status;
      $("[data-track-status-title]", this.root).textContent = order.statusTitle;
      $("[data-track-status-description]", this.root).textContent = order.statusDescription;
      $("[data-track-eta]", this.root).textContent = order.eta;
      $("[data-track-countdown]", this.root).textContent = order.countdown;
      $("[data-track-order-number]", this.root).textContent = order.id;
      $("[data-track-courier]", this.root).textContent = order.courier;
      $("[data-track-receipt]", this.root).textContent = order.receipt;
      $("[data-track-recipient]", this.root).textContent = order.recipient;
      $("[data-track-address]", this.root).textContent = order.address;
      $("[data-track-payment]", this.root).textContent = order.payment;
      $("[data-track-total]", this.root).textContent = order.total;
      $("[data-route-origin]", this.root).textContent = order.route.origin;
      $("[data-route-current]", this.root).textContent = order.route.current;
      $("[data-route-destination]", this.root).textContent = order.route.destination;

      const supportLink = $("[data-track-support]", this.root);
      if (supportLink) supportLink.href = `contact.html?order=${encodeURIComponent(order.id)}#support-form`;

      this.renderMilestones(order.status);
      this.renderEvents(order.events);
      this.renderProducts(order.products);
    }

    renderMilestones(status) {
      const container = $("[data-track-milestones]", this.root);
      if (!container) return;
      const terminal = status === "cancelled" || status === "refund";
      const activeIndex = STATUS_INDEX[status] ?? 0;

      container.innerHTML = STATUS_STEPS.map((step, index) => {
        let state = "upcoming";
        if (terminal) state = index === 0 ? "stopped" : "upcoming";
        else if (index < activeIndex || status === "delivered") state = "complete";
        else if (index === activeIndex) state = "current";

        const current = state === "current" ? ' aria-current="step"' : "";
        const icon = state === "complete" ? "✓" : String(index + 1).padStart(2, "0");
        return `<li class="tracking-progress__item" data-state="${state}"${current}><span>${icon}</span><div><strong>${step.label}</strong><small>${step.description}</small></div></li>`;
      }).join("");
    }

    renderEvents(events) {
      const container = $("[data-track-events]", this.root);
      if (!container) return;
      container.innerHTML = events.map((event) => `
        <li class="tracking-event" data-state="${escapeHtml(event.state)}">
          <span class="tracking-event__marker" aria-hidden="true"></span>
          <div class="tracking-event__content">
            <div><strong>${escapeHtml(event.title)}</strong><span>${escapeHtml(event.location)}</span></div>
            <time>${escapeHtml(event.time)}</time>
            <p>${escapeHtml(event.detail)}</p>
          </div>
        </li>`).join("");
    }

    renderProducts(products) {
      const container = $("[data-track-products]", this.root);
      if (!container) return;
      container.innerHTML = products.map((product) => `
        <article class="tracking-product">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
          <div><strong>${escapeHtml(product.name)}</strong><small>${escapeHtml(product.meta)}</small></div>
        </article>`).join("");
      $("[data-track-product-count]", this.root).textContent = `${products.length} produk`;
    }
  }

  const root = $(".page-track-order");
  if (!root) return;

  const controller = new OrderTrackingController(root, new PrototypeOrderRepository());
  window.NexOrderTracking = Object.freeze({
    track: (orderNumber) => controller.track(orderNumber),
    orders: ORDERS.map(({ id, status }) => ({ id, status })),
  });
})();
