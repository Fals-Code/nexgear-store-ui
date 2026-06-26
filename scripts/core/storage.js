(() => {
  "use strict";

  function read(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (error) {
      console.warn(`NEXGEAR storage read failed for ${key}:`, error);
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`NEXGEAR storage write failed for ${key}:`, error);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`NEXGEAR storage remove failed for ${key}:`, error);
      return false;
    }
  }

  window.NexStorage = Object.freeze({ read, write, remove });
})();
