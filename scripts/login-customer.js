(() => {
  "use strict";

  const form = document.querySelector(".login-form");
  if (!form) return;

  const deriveName = (email) => {
    const localPart = String(email || "customer").split("@")[0];
    const words = localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

    return words.join(" ") || "Customer NEXGEAR";
  };

  form.addEventListener("submit", (event) => {
    if (!form.checkValidity()) return;

    event.preventDefault();
    event.stopPropagation();

    const email = String(form.elements.email?.value || "").trim().toLowerCase();
    const user = {
      id: "CUS-DEMO-001",
      role: "customer",
      name: deriveName(email),
      email,
    };

    try {
      localStorage.setItem("nexgear_auth", "true");
      localStorage.setItem("nexgear_user", JSON.stringify(user));
      sessionStorage.setItem("nexgear-login-source", "customer-login");
      sessionStorage.setItem("nexgear-page-transition-mode", "open");
    } catch {
      // Navigasi ke panel customer tetap berjalan saat storage dibatasi browser.
    }

    window.dispatchEvent(new CustomEvent("nexgear:auth-change", {
      detail: {
        authenticated: true,
        user,
      },
    }));

    window.location.href = "profile.html";
  });
})();
