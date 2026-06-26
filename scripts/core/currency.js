(() => {
  "use strict";

  const formatter = new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  });

  function formatRupiah(value) {
    return formatter.format(Number(value) || 0);
  }

  window.NexCurrency = Object.freeze({ formatRupiah });
  window.formatRupiah = formatRupiah;
})();