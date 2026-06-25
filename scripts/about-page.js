(function () {
  "use strict";

  const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
  const progress = document.querySelector(".about-progress span");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  revealItems.forEach((item) => {
    const delay = Number(item.dataset.delay) || 0;
    item.style.setProperty("--reveal-delay", `${delay}ms`);
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
      { threshold: 0.13, rootMargin: "0px 0px -48px" },
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  const updateProgress = () => {
    if (!progress) return;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
    progress.style.width = `${Math.round(ratio * 100)}%`;
  };

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateProgress();
        ticking = false;
      });
    },
    { passive: true },
  );

  document.querySelectorAll('.about-editorial__bar a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const target = document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
  });

  if (!reduceMotion) {
    const mainVisual = document.querySelector(".about-hero__main img");
    const journeyVisual = document.querySelector(".about-journey__image img");

    window.addEventListener(
      "scroll",
      () => {
        const offset = Math.min(24, window.scrollY * 0.025);
        if (mainVisual) mainVisual.style.transform = `translateY(${offset}px) scale(1.02)`;

        if (journeyVisual) {
          const rect = journeyVisual.getBoundingClientRect();
          const local = Math.max(-18, Math.min(18, (window.innerHeight / 2 - rect.top) * 0.025));
          journeyVisual.style.transform = `translateY(${local}px)`;
        }
      },
      { passive: true },
    );
  }

  updateProgress();
})();
