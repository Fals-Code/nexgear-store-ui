(() => {
  "use strict";

  if (window.NexAdminActionMenu) return;

  const menu = document.querySelector("#suite-menu, #article-row-menu");
  if (!menu) return;

  const triggerSelector = menu.id === "suite-menu"
    ? "[data-menu]"
    : "[data-row-menu], [data-grid-menu]";
  const viewportGap = 12;
  const anchorGap = 8;
  let activeTrigger = null;
  let rafId = 0;
  let keyboardOpening = false;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const clearPosition = () => {
    menu.style.removeProperty("top");
    menu.style.removeProperty("right");
    menu.style.removeProperty("bottom");
    menu.style.removeProperty("left");
    menu.style.removeProperty("visibility");
    menu.removeAttribute("data-placement");
    menu.dataset.state = "closed";
  };

  const position = () => {
    if (!activeTrigger || menu.hidden || !document.contains(activeTrigger)) {
      clearPosition();
      return;
    }

    if (menu.parentElement !== document.body) document.body.append(menu);

    const triggerRect = activeTrigger.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const maxLeft = Math.max(viewportGap, viewportWidth - menuRect.width - viewportGap);
    const left = clamp(triggerRect.right - menuRect.width, viewportGap, maxLeft);
    const roomBelow = viewportHeight - triggerRect.bottom - viewportGap;
    const roomAbove = triggerRect.top - viewportGap;
    const openAbove = roomBelow < menuRect.height + anchorGap && roomAbove > roomBelow;
    const rawTop = openAbove
      ? triggerRect.top - menuRect.height - anchorGap
      : triggerRect.bottom + anchorGap;
    const maxTop = Math.max(viewportGap, viewportHeight - menuRect.height - viewportGap);
    const top = clamp(rawTop, viewportGap, maxTop);

    menu.style.top = `${Math.round(top)}px`;
    menu.style.left = `${Math.round(left)}px`;
    menu.style.right = "auto";
    menu.style.bottom = "auto";
    menu.style.visibility = "visible";
    menu.dataset.placement = openAbove ? "top" : "bottom";
    menu.dataset.state = "open";
    menu.setAttribute("role", "menu");
    menu.querySelectorAll("button").forEach((button) => button.setAttribute("role", "menuitem"));

    if (keyboardOpening) {
      keyboardOpening = false;
      menu.querySelector("button:not([disabled])")?.focus({ preventScroll: true });
    }
  };

  const requestPosition = () => {
    window.cancelAnimationFrame(rafId);
    rafId = window.requestAnimationFrame(() => window.requestAnimationFrame(position));
  };

  document.addEventListener("pointerdown", (event) => {
    const trigger = event.target.closest(triggerSelector);
    if (!trigger) return;
    activeTrigger = trigger;
    menu.style.visibility = "hidden";
  }, true);

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest(triggerSelector);
    if (trigger) {
      activeTrigger = trigger;
      trigger.setAttribute("aria-haspopup", "menu");
      requestPosition();
      return;
    }

    if (!event.target.closest(`#${menu.id}`)) {
      window.requestAnimationFrame(() => {
        if (menu.hidden) clearPosition();
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    const trigger = event.target.closest?.(triggerSelector);
    if (trigger && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
      activeTrigger = trigger;
      keyboardOpening = event.key === "ArrowDown";
      if (event.key === "ArrowDown") {
        event.preventDefault();
        trigger.click();
      }
      requestPosition();
      return;
    }

    if (event.key === "Escape" && !menu.hidden) {
      const returnTarget = activeTrigger;
      window.setTimeout(() => returnTarget?.focus?.(), 0);
    }
  });

  menu.addEventListener("keydown", (event) => {
    const items = Array.from(menu.querySelectorAll("button:not([disabled])"));
    if (!items.length) return;
    const current = Math.max(0, items.indexOf(document.activeElement));

    if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    event.preventDefault();

    let next = current;
    if (event.key === "ArrowDown") next = (current + 1) % items.length;
    if (event.key === "ArrowUp") next = (current - 1 + items.length) % items.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = items.length - 1;
    items[next].focus();
  });

  new MutationObserver(() => {
    if (menu.hidden) {
      activeTrigger?.setAttribute("aria-expanded", "false");
      clearPosition();
      return;
    }
    requestPosition();
  }).observe(menu, { attributes: true, attributeFilter: ["hidden"] });

  window.addEventListener("resize", requestPosition, { passive: true });
  window.addEventListener("scroll", requestPosition, { passive: true, capture: true });

  window.NexAdminActionMenu = Object.freeze({ position: requestPosition });
})();