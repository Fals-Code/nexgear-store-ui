(() => {
  "use strict";

  const target = new EventTarget();

  function on(type, listener, options) {
    target.addEventListener(type, listener, options);
    return () => target.removeEventListener(type, listener, options);
  }

  function emit(type, detail = {}) {
    const event = new CustomEvent(type, { detail });
    target.dispatchEvent(event);
    document.dispatchEvent(new CustomEvent(type, { detail }));
  }

  window.NexEvents = Object.freeze({ on, emit });
})();
