(() => {
  "use strict";

  const form = document.querySelector("[data-review-form]");
  if (!form) return;

  const ratingFieldset = form.querySelector(".rating-group");
  const ratingStatus = form.querySelector("#rating-status");
  const radios = ratingFieldset
    ? Array.from(ratingFieldset.querySelectorAll('input[type="radio"][name="rating"]'))
    : [];

  const syncRatingStatus = () => {
    if (!radios.length || !ratingStatus) return;

    const selected = radios.find((radio) => radio.checked) || radios[0];
    const selectedValue = Number((selected && selected.value) || "1");
    ratingStatus.textContent = "Rating " + selectedValue + " bintang dipilih.";
  };

  radios.forEach((radio) => {
    radio.addEventListener("change", syncRatingStatus);
  });

  syncRatingStatus();

  form.addEventListener("submit", (event) => {
    if (!form.checkValidity()) return;

    event.preventDefault();
    if (ratingStatus) {
      ratingStatus.textContent = "Ulasan Anda berhasil dikirim. Kembali ke detail produk.";
    }

    form.reset();
    syncRatingStatus();

    window.setTimeout(() => {
      window.location.href = "product-detail.html";
    }, 600);
  });
})();