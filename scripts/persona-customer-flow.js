(() => {
  "use strict";

  if (window.NexPersonaCustomerFlow) return;

  const AUTH_KEY = "nexgear_auth";
  const USER_KEY = "nexgear_user";

  const readUser = () => {
    try {
      const authenticated = localStorage.getItem(AUTH_KEY) === "true";
      const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
      return { authenticated, user };
    } catch {
      return { authenticated: false, user: null };
    }
  };

  const updateCustomerNavigation = () => {
    const { authenticated, user } = readUser();
    const accountButton = document.querySelector("[data-customer-account-button]");
    const accountCta = document.querySelector("[data-customer-account-cta]");
    const orderLink = document.querySelector("[data-customer-orders-link]");
    const profileLink = document.querySelector("[data-customer-profile-link]");
    const accountList = document.querySelector("[data-customer-account-list]");

    if (!accountButton || !accountCta || !accountList) return;

    const loginHref = "login.html";
    const profileHref = "profile.html";
    const orderHref = "transaction-history.html";

    accountButton.href = authenticated ? profileHref : loginHref;
    accountButton.setAttribute(
      "aria-label",
      authenticated ? "Buka panel customer" : "Masuk ke akun customer",
    );

    accountCta.href = authenticated ? profileHref : loginHref;
    accountCta.textContent = authenticated
      ? `Panel ${user?.name?.split(" ")[0] || "Customer"}`
      : "Masuk / Daftar";

    if (profileLink) profileLink.href = authenticated ? profileHref : loginHref;
    if (orderLink) orderLink.href = authenticated ? orderHref : loginHref;

    const existingLogout = accountList.querySelector("[data-customer-logout]");
    if (authenticated && !existingLogout) {
      const item = document.createElement("li");
      item.innerHTML = '<a href="index.html" class="account-dropdown-link dropdown-link" data-customer-logout><span>Keluar</span></a>';
      accountList.append(item);
    }

    if (!authenticated && existingLogout) existingLogout.closest("li")?.remove();
    document.body.dataset.customerAuth = authenticated ? "authenticated" : "guest";
  };

  const logout = () => {
    try {
      localStorage.removeItem(AUTH_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.removeItem("nexgear-login-source");
    } catch {
      // Navigasi keluar tetap dijalankan saat storage dibatasi browser.
    }

    window.dispatchEvent(new CustomEvent("nexgear:auth-change", {
      detail: { authenticated: false, user: null },
    }));

    window.location.href = "index.html";
  };

  document.addEventListener("click", (event) => {
    const logoutLink = event.target.closest("[data-customer-logout]");
    if (!logoutLink) return;
    event.preventDefault();
    logout();
  });

  document.addEventListener("nexgear:components-ready", updateCustomerNavigation);
  window.addEventListener("nexgear:auth-change", updateCustomerNavigation);
  window.addEventListener("storage", (event) => {
    if ([AUTH_KEY, USER_KEY].includes(event.key)) updateCustomerNavigation();
  });

  if (document.documentElement.classList.contains("global-components-ready")) {
    updateCustomerNavigation();
  }

  window.NexPersonaCustomerFlow = Object.freeze({
    refresh: updateCustomerNavigation,
    logout,
  });
})();
