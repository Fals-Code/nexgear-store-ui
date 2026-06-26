(() => {
  "use strict";

  const menu = document.querySelector("#suite-menu");
  if (!menu || window.NexAdminActionMenu) return;

  const SELECTOR = "[data-menu]";
  const VIEWPORT_GAP = 12;
  const ANCHOR_GAP = 8;
  let activeTrigger = null;
  let rafId = 0;

  const announce = (message) => window.NexA11y?.announce?.(message);

  const clearPosition = () => {
    menu.style.removeProperty("top");
    menu.style.removeProperty("right");
    menu.style.removeProperty("bottom");
    menu.style.removeProperty("left");
    menu.style.removeProperty("visibility");
  };

  const close = ({ restoreFocus = false } = {}) => {
    if (menu.hidden) return;
    menu.hidden = true;
    menu.dataset.state = "closed";
    menu.removeAttribute("data-placement");
    activeTrigger?.setAttribute("aria-expanded", "false");
    if (restoreFocus) activeTrigger?.focus();
    activeTrigger = null;
    clearPosition();
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const position = () => {
    if (!activeTrigger || menu.hidden) return;

    const triggerRect = activeTrigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;

    const maxLeft = Math.max(VIEWPORT_GAP, viewportWidth - menuRect.width - VIEWPORT_GAP);
    const preferredLeft = triggerRect.right - menuRect.width;
    const left = clamp(preferredLeft, VIEWPORT_GAP, maxLeft);

    const roomBelow = viewportHeight - triggerRect.bottom - VIEWPORT_GAP;
    const roomAbove = triggerRect.top - VIEWPORT_GAP;
    const openAbove = roomBelow < menuRect.height + ANCHOR_GAP && roomAbove > roomBelow;
    const rawTop = openAbove
      ? triggerRect.top - menuRect.height - ANCHOR_GAP
      : triggerRect.bottom + ANCHOR_GAP;
    const maxTop = Math.max(VIEWPORT_GAP, viewportHeight - menuRect.height - VIEWPORT_GAP);
    const top = clamp(rawTop, VIEWPORT_GAP, maxTop);

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
    menu.style.right = "auto";
    menu.style.bottom = "auto";
    menu.dataset.placement = openAbove ? "top" : "bottom";
    menu.style.visibility = "visible";
  };

  const requestPosition = () => {
    window.cancelAnimationFrame(rafId);
    rafId = window.requestAnimationFrame(position);
  };

  const open = (trigger) => {
    if (!(trigger instanceof HTMLElement)) return;

    const sameTrigger = activeTrigger === trigger && !menu.hidden;
    close();
    if (sameTrigger) return;

    activeTrigger = trigger;
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-expanded", "true");

    if (menu.parentElement !== document.body) document.body.append(menu);
    menu.setAttribute("role", "menu");
    menu.querySelectorAll("button").forEach((button) => button.setAttribute("role", "menuitem"));
    menu.style.visibility = "hidden";
    menu.hidden = false;
    menu.dataset.state = "open";
    position();

    menu.querySelector("button:not([disabled])")?.focus({ preventScroll: true });
    announce("Menu aksi dibuka.");
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(SELECTOR);
    if (trigger) {
      event.preventDefault();
      event.stopImmediatePropagation();
      open(trigger);
      return;
    }

    if (event.target.closest("#suite-menu")) return;
    close();
  }, true);

  menu.addEventListener("click", (event) => {
    if (!event.target.closest("button")) return;
    window.requestAnimationFrame(() => close());
  });

  menu.addEventListener("keydown", (event) => {
    const items = Array.from(menu.querySelectorAll("button:not([disabled])"));
    if (!items.length) return;
    const current = Math.max(0, items.indexOf(document.activeElement));

    if (event.key === "Escape") {
      event.preventDefault();
      close({ restoreFocus: true });
      return;
    }

    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();

    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    items[next].focus();
  });

  window.addEventListener("resize", requestPosition, { passive: true });
  window.addEventListener("scroll", requestPosition, { passive: true, capture: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      event.preventDefault();
      close({ restoreFocus: true });
    }
  });

  window.NexAdminActionMenu = Object.freeze({ open, close, position });
})();