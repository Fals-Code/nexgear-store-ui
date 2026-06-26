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

  form.addEventListener("submit", () => {
    if (!form.checkValidity()) return;

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
    } catch {
      // Navigasi ke panel customer tetap berjalan saat storage dibatasi browser.
    }

    window.dispatchEvent(new CustomEvent("nexgear:auth-change", {
      detail: {
        authenticated: true,
        user,
      },
    }));
  });
})();
