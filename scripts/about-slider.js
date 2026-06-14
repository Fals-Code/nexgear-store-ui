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
    const currentIndex = index;
    const currentImage = images[currentIndex];
    const currentText = texts[currentIndex];
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

    // Force the browser to register the start position before moving.
    slider.getBoundingClientRect();

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
      showSlide(i, i < index ? "prev" : "next");
      startAuto();
    });
  });

  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);
  slider.addEventListener("focusin", stopAuto);
  slider.addEventListener("focusout", startAuto);

  setStaticState(0);
  startAuto();
})();
