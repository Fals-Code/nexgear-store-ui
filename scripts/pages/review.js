(() => {
  "use strict";

  const form = document.querySelector("[data-review-form]");
  if (!form) return;

  const ratingFieldset = form.querySelector(".rating-group");
  const ratingStatus = form.querySelector("#rating-status");
  const radios = ratingFieldset
    ? Array.from(ratingFieldset.querySelectorAll('input[type="radio"][name="rating"]'))
    : [];

  const syncVisualState = () => {
    if (!radios.length) return;

    const active = radios.find((radio) => radio.checked) || radios[0];
    const activeValue = Number((active && active.value) || "1");

    radios.forEach((radio) => {
      const label = form.querySelector('label[for="' + radio.id + '"]');
      if (!label) return;

      const ratingValue = Number(radio.value || "0");
      label.classList.toggle("active", ratingValue <= activeValue);
    });

    if (ratingStatus) {
      ratingStatus.textContent = "Rating " + activeValue + " bintang dipilih.";
    }
  };

  radios.forEach((radio) => {
    radio.addEventListener("change", syncVisualState);
  });

  syncVisualState();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.location.href = "product-detail.html";
  });
})();
