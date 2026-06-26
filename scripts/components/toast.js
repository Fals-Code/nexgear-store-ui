(() => {
  "use strict";

  let compactTimer = 0;

  function show(message, duration = 2500) {
    const toast = document.createElement("div");
    toast.className = "toast-notification";
    toast.setAttribute("role", "status");
    toast.setAttribute("aria-live", "polite");
    toast.textContent = String(message);
    document.body.appendChild(toast);

    window.setTimeout(() => {
      toast.style.animation = "toastOut 0.3s forwards";
      window.setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  function showCompact(message, duration = 1800) {
    let toast = document.querySelector(".nex-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "nex-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    toast.textContent = String(message);
    toast.classList.add("is-visible");
    window.clearTimeout(compactTimer);
    compactTimer = window.setTimeout(
      () => toast.classList.remove("is-visible"),
      duration,
    );
  }

  window.NexToast = Object.freeze({ show, showCompact });
  window.showToast = show;
  window.showNexToast = showCompact;
})();
