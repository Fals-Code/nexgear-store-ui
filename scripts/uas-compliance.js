(function () {
  "use strict";

  const root = document.querySelector(".page-uas-compliance");
  if (!root) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function animateScore() {
    const score = document.querySelector("[data-count-up]");
    if (!score || prefersReducedMotion) return;

    const target = Number.parseInt(score.getAttribute("data-count-up") || "100", 10);
    const duration = 900;
    const startedAt = performance.now();

    function tick(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      score.textContent = `${Math.round(target * eased)}%`;

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      }
    }

    window.requestAnimationFrame(tick);
  }

  function setPageMapState() {
    const cards = document.querySelectorAll("[data-page-map] .uas-page-card");
    cards.forEach((card, index) => {
      card.dataset.state = "ready";
      card.style.setProperty("--stagger", `${index * 35}ms`);
    });
  }

  function announceReady() {
    const live = document.createElement("p");
    live.className = "sr-only";
    live.setAttribute("aria-live", "polite");
    live.textContent = "Peta kesesuaian UAS NEXGEAR siap dicek.";
    document.body.appendChild(live);
  }

  document.addEventListener("DOMContentLoaded", () => {
    animateScore();
    setPageMapState();
    announceReady();
  });
})();
