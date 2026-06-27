(() => {
  "use strict";

  const PROFILE_URL = "profile.html";

  const deriveName = (source) => {
    const localPart = String(source || "customer").split("@")[0];
    const words = localPart
      .split(/[._-]+/)
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1));

    return words.join(" ") || "Customer NEXGEAR";
  };

  const getFieldValue = (form, selector) => {
    const field = form.querySelector(selector);
    return String(field?.value || "").trim();
  };

  const persistDemoUser = (user, source) => {
    try {
      localStorage.setItem("nexgear_auth", "true");
      localStorage.setItem("nexgear_user", JSON.stringify(user));
      sessionStorage.setItem("nexgear-login-source", source);
      sessionStorage.setItem("nexgear-page-transition-mode", "open");
    } catch {
      // Navigasi ke profile tetap berjalan saat storage dibatasi browser.
    }
  };

  const goToProfile = () => {
    window.location.href = PROFILE_URL;
  };

  const bindLoginForm = () => {
    const form = document.querySelector(".login-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      if (!form.checkValidity()) return;

      event.preventDefault();

      const email = getFieldValue(form, "#email").toLowerCase();
      const user = {
        id: "CUS-DEMO-001",
        role: "customer",
        name: deriveName(email),
        email,
      };

      persistDemoUser(user, "customer-login");

      window.dispatchEvent(
        new CustomEvent("nexgear:auth-change", {
          detail: {
            authenticated: true,
            user,
          },
        }),
      );

      goToProfile();
    });
  };

  const bindRegisterForm = () => {
    const form = document.querySelector(".register-form");
    if (!form) return;

    form.addEventListener("submit", (event) => {
      if (!form.checkValidity()) return;

      event.preventDefault();

      const username = getFieldValue(form, "#username");
      const email = getFieldValue(form, "#register-email").toLowerCase();
      const user = {
        id: "CUS-DEMO-001",
        role: "customer",
        name: deriveName(username || email),
        email,
      };

      persistDemoUser(user, "customer-register");

      window.dispatchEvent(
        new CustomEvent("nexgear:auth-change", {
          detail: {
            authenticated: true,
            user,
          },
        }),
      );

      goToProfile();
    });
  };

  bindLoginForm();
  bindRegisterForm();
})();
