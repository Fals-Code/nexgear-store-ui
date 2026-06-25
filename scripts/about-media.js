(function () {
  "use strict";

  const images = Array.from(document.querySelectorAll(".page-about img[data-fallback]"));

  images.forEach((image) => {
    image.addEventListener("error", () => {
      const fallback = image.dataset.fallback;
      const figure = image.closest("figure");

      if (!fallback || image.dataset.fallbackUsed === "true") {
        figure?.classList.add("is-image-missing");
        return;
      }

      image.dataset.fallbackUsed = "true";
      image.classList.add("is-image-fallback");
      image.src = fallback;
    });
  });
})();
