(() => {
  "use strict";

  const searchForm = document.querySelector("[data-support-search]");
  if (!searchForm) return;

  searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchForm.querySelector("input")?.dispatchEvent(new Event("input", { bubbles: true }));
  });
})();
