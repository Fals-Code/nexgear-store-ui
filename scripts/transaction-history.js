(function () {
  "use strict";

  const list = document.getElementById("history-list");
  if (!list) return;

  const cards = Array.from(list.querySelectorAll(".transaction-card"));
  const tabs = Array.from(document.querySelectorAll(".history-tab"));
  const searchInput = document.getElementById("history-search-input");
  const periodSelect = document.getElementById("history-period");
  const sortSelect = document.getElementById("history-sort");
  const visibleCount = document.getElementById("history-visible-count");
  const emptyState = document.getElementById("history-empty");
  const resetButton = document.getElementById("history-reset");
  const loadMoreButton = document.getElementById("history-load-more");
  const pageSize = 4;

  let selectedStatus = "all";
  let expandedList = false;

  function normalize(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getPeriodStart(days) {
    if (days === "all") return null;
    const numericDays = Number(days);
    if (!Number.isFinite(numericDays)) return null;

    const newestOrderDate = Math.max(
      ...cards.map((card) => new Date(`${card.dataset.date}T23:59:59`).getTime()),
    );

    return newestOrderDate - numericDays * 24 * 60 * 60 * 1000;
  }

  function matchesFilters(card) {
    const statusMatches = selectedStatus === "all" || card.dataset.status === selectedStatus;
    const query = normalize(searchInput.value);
    const searchMatches = !query || normalize(card.dataset.search).includes(query);
    const periodStart = getPeriodStart(periodSelect.value);
    const cardDate = new Date(`${card.dataset.date}T12:00:00`).getTime();
    const periodMatches = periodStart === null || cardDate >= periodStart;

    return statusMatches && searchMatches && periodMatches;
  }

  function sortCards() {
    const mode = sortSelect.value;
    const sorted = [...cards].sort((a, b) => {
      if (mode === "oldest") {
        return new Date(a.dataset.date) - new Date(b.dataset.date);
      }

      if (mode === "highest") {
        return Number(b.dataset.total) - Number(a.dataset.total);
      }

      return new Date(b.dataset.date) - new Date(a.dataset.date);
    });

    sorted.forEach((card) => list.appendChild(card));
  }

  function closeCardDetail(card) {
    const toggle = card.querySelector(".transaction-detail-toggle");
    if (!toggle) return;

    const panel = document.getElementById(toggle.getAttribute("aria-controls"));
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Lihat Detail";
    if (panel) panel.hidden = true;
  }

  function hydrateTrackingLinks() {
    cards.forEach((card) => {
      const orderNumber = card.querySelector(".transaction-card__header h2")?.textContent?.trim();
      const trackLink = card.querySelector('a[href^="track-order.html"]');
      if (!orderNumber || !trackLink) return;
      trackLink.href = `track-order.html?order=${encodeURIComponent(orderNumber)}`;
      trackLink.setAttribute("aria-label", `Lacak pesanan ${orderNumber}`);
    });
  }

  function render() {
    sortCards();

    const matchingCards = cards.filter(matchesFilters);
    const visibleCards = expandedList ? matchingCards : matchingCards.slice(0, pageSize);

    cards.forEach((card) => {
      const shouldShow = visibleCards.includes(card);
      card.hidden = !shouldShow;
      if (!shouldShow) closeCardDetail(card);
    });

    visibleCount.textContent = String(visibleCards.length);
    emptyState.hidden = matchingCards.length !== 0;
    loadMoreButton.hidden = matchingCards.length <= pageSize || expandedList;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      });

      selectedStatus = tab.dataset.status || "all";
      expandedList = false;
      render();
    });
  });

  searchInput.addEventListener("input", () => {
    expandedList = false;
    render();
  });

  periodSelect.addEventListener("change", () => {
    expandedList = false;
    render();
  });

  sortSelect.addEventListener("change", render);

  list.addEventListener("click", (event) => {
    const toggle = event.target.closest(".transaction-detail-toggle");
    if (toggle) {
      const card = toggle.closest(".transaction-card");
      const panelId = toggle.getAttribute("aria-controls");
      const panel = document.getElementById(panelId);
      const willOpen = toggle.getAttribute("aria-expanded") !== "true";

      cards.forEach((item) => {
        if (item !== card) closeCardDetail(item);
      });

      toggle.setAttribute("aria-expanded", String(willOpen));
      toggle.textContent = willOpen ? "Tutup Detail" : "Lihat Detail";
      if (panel) panel.hidden = !willOpen;
      return;
    }

    const cancelButton = event.target.closest("[data-cancel-order]");
    if (!cancelButton) return;

    const card = cancelButton.closest(".transaction-card");
    const orderNumber = card.querySelector(".transaction-card__header h2")?.textContent || "pesanan ini";
    const confirmed = window.confirm(`Batalkan ${orderNumber}? Tindakan ini hanya simulasi pada prototype.`);
    if (!confirmed) return;

    card.dataset.status = "cancelled";
    const badge = card.querySelector(".transaction-status");
    badge.className = "transaction-status status-cancelled";
    badge.innerHTML = '<i aria-hidden="true"></i>Dibatalkan';

    const paymentValue = card.querySelector(".transaction-payment div:first-child dd");
    if (paymentValue) paymentValue.textContent = "Dibatalkan";

    cancelButton.remove();
    const payButton = card.querySelector('a[href="checkout.html"]');
    if (payButton) {
      payButton.href = "catalog.html";
      payButton.textContent = "Cari Produk Serupa";
    }

    selectedStatus = "all";
    tabs.forEach((tab) => {
      const active = tab.dataset.status === "all";
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    render();
  });

  resetButton.addEventListener("click", () => {
    selectedStatus = "all";
    expandedList = false;
    searchInput.value = "";
    periodSelect.value = "all";
    sortSelect.value = "newest";

    tabs.forEach((tab) => {
      const active = tab.dataset.status === "all";
      tab.classList.toggle("active", active);
      tab.setAttribute("aria-selected", String(active));
    });

    render();
    searchInput.focus();
  });

  loadMoreButton.addEventListener("click", () => {
    expandedList = true;
    render();

    const firstPreviouslyHidden = cards.filter(matchesFilters)[pageSize];
    if (firstPreviouslyHidden) {
      firstPreviouslyHidden.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  hydrateTrackingLinks();
  render();
})();
