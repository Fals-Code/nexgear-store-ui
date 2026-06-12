(function () {
  "use strict";

  const AUTH_PAGES = new Set([
    "login.html",
    "register.html",
    "registration.html",
    "signup.html",
  ]);

  const currentPage = window.location.pathname.split("/").pop() || "index.html";

  function resolveComponentUrl(fileName) {
    const scriptUrl = document.currentScript?.src;
    if (scriptUrl) {
      return new URL(`../components/${fileName}`, scriptUrl).href;
    }

    return `components/${fileName}`;
  }

  async function fetchComponent(fileName) {
    const response = await fetch(resolveComponentUrl(fileName), {
      cache: "no-cache",
    });

    if (!response.ok) {
      throw new Error(
        `Gagal memuat ${fileName}: ${response.status} ${response.statusText}`,
      );
    }

    return response.text();
  }

  function replacePlaceholder(id, html) {
    const placeholder = document.getElementById(id);
    if (!placeholder) return;

    const template = document.createElement("template");
    template.innerHTML = html.trim();

    if (!template.content.childNodes.length) {
      throw new Error(`Komponen ${id} tidak memiliki konten.`);
    }

    placeholder.replaceWith(template.content.cloneNode(true));
  }

  async function loadGlobalComponents() {
    if (AUTH_PAGES.has(currentPage)) return;

    const [headerHtml, footerHtml] = await Promise.all([
      fetchComponent("header.html"),
      fetchComponent("footer.html"),
    ]);

    replacePlaceholder("global-header", headerHtml);
    replacePlaceholder("global-footer", footerHtml);

    document.documentElement.classList.add("global-components-ready");
    document.dispatchEvent(
      new CustomEvent("nexgear:components-ready", {
        detail: { header: true, footer: true },
      }),
    );
  }

  const ready = AUTH_PAGES.has(currentPage)
    ? Promise.resolve()
    : loadGlobalComponents().catch((error) => {
        console.error("NEXGEAR global components:", error);
        document.documentElement.classList.add("global-components-error");
        throw error;
      });

  window.NexGlobalComponents = Object.freeze({ ready });
})();
