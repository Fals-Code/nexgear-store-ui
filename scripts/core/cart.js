(() => {
  "use strict";

  const KEY = "nexgear_cart";
  const storage = window.NexStorage;
  const events = window.NexEvents;

  const Cart = {
    KEY,

    get items() {
      const items = storage?.read(KEY, []);
      return Array.isArray(items) ? items : [];
    },

    save(items) {
      const normalized = Array.isArray(items) ? items : [];
      if (storage) storage.write(KEY, normalized);
      else localStorage.setItem(KEY, JSON.stringify(normalized));

      this.updateBadge();
      events?.emit("nexgear:cart-change", {
        items: normalized,
        count: this.count,
        total: this.total,
      });
    },

    add(product) {
      const items = this.items;
      const { silent, ...cartProduct } = product || {};
      const variant = cartProduct.variant ? ` - ${cartProduct.variant}` : "";
      const finalName = `${cartProduct.name || "Produk"}${variant}`;
      const existing = items.find((item) => item.name === finalName);
      const quantity = Math.max(1, Number(cartProduct.qty) || 1);

      if (existing) existing.qty = (Number(existing.qty) || 1) + quantity;
      else items.push({ ...cartProduct, name: finalName, qty: quantity });

      this.save(items);
      if (!silent)
        window.NexToast?.show(`${finalName} ditambahkan ke keranjang!`);
    },

    remove(name) {
      this.save(this.items.filter((item) => item.name !== name));
      window.renderMiniCartGlobal?.();
    },

    updateQty(name, delta) {
      const items = this.items;
      const item = items.find((entry) => entry.name === name);
      if (!item) return;

      item.qty = Math.max(1, (Number(item.qty) || 1) + Number(delta || 0));
      this.save(items);
    },

    clear() {
      this.save([]);
    },

    get total() {
      return this.items.reduce(
        (sum, item) =>
          sum + (Number(item.price) || 0) * (Number(item.qty) || 1),
        0,
      );
    },

    get count() {
      return this.items.reduce((sum, item) => sum + (Number(item.qty) || 1), 0);
    },

    updateBadge() {
      const count = this.count;
      document.querySelectorAll(".cart-badge").forEach((badge) => {
        badge.textContent = count > 0 ? String(count) : "";
        badge.dataset.count = String(count);
      });
      window.updateCartEmptyGuidance?.();
    },
  };

  window.NexCart = Object.freeze(Cart);
})();
