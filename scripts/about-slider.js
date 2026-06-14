(function () {
  "use strict";

  const slider = document.querySelector("[data-about-slider]");
  if (!slider) return;

  const images = Array.from(slider.querySelectorAll("[data-about-slide-image]"));
  const texts = Array.from(slider.querySelectorAll("[data-about-slide-text]"));
  const dots = Array.from(slider.querySelectorAll("[data-about-dot]"));
  const total = Math.min(images.length, texts.length, dots.length);
  if (!total) return;

  let index = 0;
  let timer = null;
  let isAnimating = false;
  const interval = 6500;
  const transitionMs = 760;
  const slideClasses = ["is-active", "is-before", "is-after"];

  function setDots() {
    dots.forEach((dot, i) => {
      const active = i === index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  function clearSlideClasses(items) {
    items.forEach((item) => item.classList.remove(...slideClasses));
  }

  function setStaticState(activeIndex) {
    clearSlideClasses(images);
    clearSlideClasses(texts);

    images.forEach((image, i) => {
      image.classList.add(i === activeIndex ? "is-active" : "is-after");
    });

    texts.forEach((text, i) => {
      text.classList.add(i === activeIndex ? "is-active" : "is-after");
    });

    index = activeIndex;
    setDots();
  }

  function showSlide(nextIndex, direction = "next") {
    const target = (nextIndex + total) % total;
    if (target === index || isAnimating) return;

    isAnimating = true;
    const movingNext = direction !== "prev";
    const currentImage = images[index];
    const currentText = texts[index];
    const targetImage = images[target];
    const targetText = texts[target];
    const enterClass = movingNext ? "is-after" : "is-before";
    const exitClass = movingNext ? "is-before" : "is-after";

    clearSlideClasses(images);
    clearSlideClasses(texts);

    currentImage?.classList.add("is-active");
    currentText?.classList.add("is-active");
    targetImage?.classList.add(enterClass);
    targetText?.classList.add(enterClass);

    // Force initial off-screen state before transition starts. Yes, browser choreography is fragile.
    void slider.offsetWidth;

    currentImage?.classList.remove("is-active");
    currentText?.classList.remove("is-active");
    currentImage?.classList.add(exitClass);
    currentText?.classList.add(exitClass);

    targetImage?.classList.remove(enterClass);
    targetText?.classList.remove(enterClass);
    targetImage?.classList.add("is-active");
    targetText?.classList.add("is-active");

    index = target;
    setDots();

    window.setTimeout(() => {
      setStaticState(index);
      isAnimating = false;
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

  slider.addEventListener("click", (event) => {
    const prevButton = event.target.closest("[data-about-prev]");
    const nextButton = event.target.closest("[data-about-next]");
    const dotButton = event.target.closest("[data-about-dot]");

    if (prevButton) {
      event.preventDefault();
      showSlide(index - 1, "prev");
      startAuto();
      return;
    }

    if (nextButton) {
      event.preventDefault();
      showSlide(index + 1, "next");
      startAuto();
      return;
    }

    if (dotButton) {
      event.preventDefault();
      const dotIndex = dots.indexOf(dotButton);
      if (dotIndex >= 0) {
        showSlide(dotIndex, dotIndex < index ? "prev" : "next");
        startAuto();
      }
    }
  });

  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);
  slider.addEventListener("focusin", stopAuto);
  slider.addEventListener("focusout", startAuto);

  setStaticState(0);
  startAuto();
})();
