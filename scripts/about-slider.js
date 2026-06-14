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
  const transitionMs = 900;
  const directionClasses = [
    "is-entering-left",
    "is-entering-right",
    "is-exiting-left",
    "is-exiting-right",
  ];

  function cleanMotionClasses(elements) {
    elements.forEach((element) => element.classList.remove(...directionClasses));
  }

  function setDots() {
    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function showSlide(nextIndex, direction = "next", animate = true) {
    const target = (nextIndex + total) % total;
    if (target === index && animate) return;

    const currentIndex = index;
    const currentImage = images[currentIndex];
    const currentText = texts[currentIndex];
    const targetImage = images[target];
    const targetText = texts[target];
    const movingNext = direction !== "prev";

    cleanMotionClasses(images);
    cleanMotionClasses(texts);

    if (!animate) {
      images.forEach((image, i) => image.classList.toggle("is-active", i === target));
      texts.forEach((text, i) => text.classList.toggle("is-active", i === target));
      index = target;
      setDots();
      return;
    }

    currentImage?.classList.remove("is-active");
    currentText?.classList.remove("is-active");
    currentImage?.classList.add(movingNext ? "is-exiting-left" : "is-exiting-right");
    currentText?.classList.add(movingNext ? "is-exiting-left" : "is-exiting-right");

    targetImage?.classList.add(movingNext ? "is-entering-right" : "is-entering-left");
    targetText?.classList.add(movingNext ? "is-entering-right" : "is-entering-left");

    window.requestAnimationFrame(() => {
      targetImage?.classList.add("is-active");
      targetText?.classList.add("is-active");
      targetImage?.classList.remove(movingNext ? "is-entering-right" : "is-entering-left");
      targetText?.classList.remove(movingNext ? "is-entering-right" : "is-entering-left");
    });

    index = target;
    setDots();

    window.setTimeout(() => {
      currentImage?.classList.remove("is-exiting-left", "is-exiting-right");
      currentText?.classList.remove("is-exiting-left", "is-exiting-right");
    }, transitionMs);
  }

  function stopAuto() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }

  function startAuto() {
    stopAuto();
    timer = window.setInterval(() => showSlide(index + 1, "next"), interval);
  }

  prev?.addEventListener("click", () => {
    showSlide(index - 1, "prev");
    startAuto();
  });

  next?.addEventListener("click", () => {
    showSlide(index + 1, "next");
    startAuto();
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      const direction = i < index ? "prev" : "next";
      showSlide(i, direction);
      startAuto();
    });
  });

  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);
  slider.addEventListener("focusin", stopAuto);
  slider.addEventListener("focusout", startAuto);

  showSlide(0, "next", false);
  startAuto();
})();
