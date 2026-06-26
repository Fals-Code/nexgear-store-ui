(() => {
  "use strict";

  const KEY = "nexgear_auth";
  const USER_KEY = "nexgear_user";
  const storage = window.NexStorage;
  const events = window.NexEvents;

  const Auth = {
    KEY,

    get isLoggedIn() {
      return localStorage.getItem(KEY) === "true";
    },

    get user() {
      return storage?.read(USER_KEY, null) || null;
    },

    login(user = null) {
      localStorage.setItem(KEY, "true");
      if (user && storage) storage.write(USER_KEY, user);
      this.updateUI();
      events?.emit("nexgear:auth-change", {
        authenticated: true,
        user: this.user,
      });
    },

    logout() {
      localStorage.removeItem(KEY);
      storage?.remove(USER_KEY);
      this.updateUI();
      events?.emit("nexgear:auth-change", {
        authenticated: false,
        user: null,
      });
    },

    updateUI() {
      document.querySelectorAll(".nav-actions").forEach((container) => {
        const authButton = container.querySelector(
          'a[href="login.html"], a[href="profile.html"]',
        );
        if (!authButton) return;

        if (this.isLoggedIn) {
          authButton.href = "profile.html";
          authButton.innerHTML =
            '<span class="icon icon-sm"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span> Profil';
        } else {
          authButton.href = "login.html";
          authButton.innerHTML =
            '<span class="icon icon-sm"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg></span> Masuk';
        }
      });
    },
  };

  window.NexAuth = Object.freeze(Auth);
})();
