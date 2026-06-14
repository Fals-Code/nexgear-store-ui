(function () {
  var video = document.querySelector("[data-hero-video]");
  if (!video) return;

  var source = video.querySelector("source[data-src]");
  if (!source) return;

  var saveData = navigator.connection && navigator.connection.saveData;
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var smallScreen = window.matchMedia && window.matchMedia("(max-width: 760px)").matches;

  if (saveData || reducedMotion || smallScreen) {
    video.removeAttribute("autoplay");
    video.setAttribute("data-video-skipped", "true");
    return;
  }

  function loadHeroVideo() {
    if (video.dataset.loaded === "true") return;
    video.dataset.loaded = "true";
    source.src = source.dataset.src;
    video.load();

    var playPromise = video.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(function () {
        video.setAttribute("data-video-paused", "true");
      });
    }
  }

  function scheduleLoad() {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadHeroVideo, { timeout: 1600 });
      return;
    }
    window.setTimeout(loadHeroVideo, 900);
  }

  if (document.readyState === "complete") {
    scheduleLoad();
  } else {
    window.addEventListener("load", scheduleLoad, { once: true });
  }
})();
