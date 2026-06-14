(function () {
  "use strict";

  const slider = document.querySelector("[data-about-slider]");
  if (!slider) return;

  const images = Array.from(slider.querySelectorAll("[data-about-slide-image]"));
  const texts = Array.from(slider.querySelectorAll("[data-about-slide-text]"));
  const dots = Array.from(slider.querySelectorAll("[data-about-dot]"));
  const prev = slider.querySelector("[data-about-prev]");
  const next = slider.querySelector("[data-about-next]");
  const total = Math.min(images.length, texts.length, dots.length);
  if (!total) return;

  let index = 0;
  let timer = null;
  const interval = 6500;

  function showSlide(nextIndex) {
    index = (nextIndex + total) % total;

    images.forEach((image, i) => {
      image.classList.toggle("is-active", i === index);
    });

    texts.forEach((text, i) => {
      text.classList.toggle("is-active", i === index);
    });

    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function stopAuto() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function startAuto() {
    stopAuto();
    timer = window.setInterval(() => showSlide(index + 1), interval);
  }

  prev?.addEventListener("click", () => {
    showSlide(index - 1);
    startAuto();
  });

  next?.addEventListener("click", () => {
    showSlide(index + 1);
    startAuto();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      showSlide(i);
      startAuto();
    });
  });

  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);
  slider.addEventListener("focusin", stopAuto);
  slider.addEventListener("focusout", startAuto);

  showSlide(0);
  startAuto();
})();
