(function () {
  "use strict";

  const revealItems = Array.from(document.querySelectorAll("[data-about-reveal]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  revealItems.forEach((item) => {
    const delay = Number(item.dataset.aboutDelay) || 0;
    item.style.setProperty("--about-delay", `${delay}ms`);
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -42px" },
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  const visual = document.querySelector(".about-opening__visual");
  if (visual && !reduceMotion) {
    visual.addEventListener("pointermove", (event) => {
      const rect = visual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      visual.style.transform = `perspective(1000px) rotateY(${x * 2.5}deg) rotateX(${y * -2.5}deg)`;
    });

    visual.addEventListener("pointerleave", () => {
      visual.style.transform = "";
    });
  }

  document.querySelectorAll("[data-about-band]").forEach((band) => {
    band.addEventListener("pointerenter", () => band.classList.add("is-active"));
    band.addEventListener("pointerleave", () => band.classList.remove("is-active"));
  });
})();
