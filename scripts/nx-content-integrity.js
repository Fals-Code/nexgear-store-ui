(() => {
  "use strict";

  const page = window.location.pathname.split("/").pop() || "index.html";
  const ready = (callback) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback, { once: true });
    } else {
      callback();
    }
  };

  const addPrototypeNote = (text) => {
    const main = document.querySelector("main");
    if (!main || main.querySelector(".nx-content-integrity-note")) return;
    const note = document.createElement("p");
    note.className = "nx-prototype-disclosure nx-content-integrity-note";
    note.setAttribute("role", "note");
    note.textContent = text;
    main.prepend(note);
  };

  const cleanHelp = () => {
    if (page !== "help.html") return;

    addPrototypeNote(
      "Pusat bantuan ini mendemonstrasikan pola pencarian dan accordion. Kebijakan garansi, SLA respons, dan proses pembayaran nyata belum ditetapkan dalam prototipe.",
    );

    document.querySelector(".help-hero__pulse dl")?.remove();
    document
      .querySelectorAll('[data-help-query="garansi"], a[href="#faq-warranty"], #faq-warranty')
      .forEach((element) => element.remove());

    const paymentAnswer = document.querySelector("#answer-payment p");
    if (paymentAnswer) {
      paymentAnswer.textContent =
        "Periksa kembali status simulasi pada halaman transaksi. Gunakan formulir kontak bila state lokal tidak berubah setelah halaman dimuat ulang.";
    }

    const search = document.querySelector("#help-search");
    if (search) {
      search.placeholder = "Cari status pesanan, pembayaran, atau akun...";
    }
  };

  const cleanContact = () => {
    if (page !== "contact.html") return;

    addPrototypeNote(
      "Formulir ini merupakan simulasi frontend dan tidak mengirim tiket ke layanan dukungan nyata. Jangan masukkan data pribadi atau bukti pembayaran sungguhan.",
    );

    document
      .querySelectorAll('.contact-faq__list [data-category="warranty"]')
      .forEach((element) => element.remove());

    const paymentFaq = document.querySelector(
      '.contact-faq__list [data-category="payment"] p',
    );
    if (paymentFaq) {
      paymentFaq.textContent =
        "Periksa state transaksi lokal dan muat ulang halaman. Form kontak dapat digunakan untuk mendemonstrasikan alur pelaporan kendala.";
    }
  };

  const cleanCompliance = () => {
    if (page !== "uas-compliance.html") return;

    const qualityItem = [...document.querySelectorAll(".uas-flow-list li")].find(
      (item) => item.querySelector("span")?.textContent.trim() === "Kualitas",
    );
    if (qualityItem) {
      const copy = qualityItem.querySelector("strong");
      if (copy) {
        copy.textContent =
          "Spesifikasi, state transaksi, empty state, dan feedback interaksi ditampilkan tanpa klaim bisnis yang tidak memiliki sumber data.";
      }
    }

    const dashboardCard = document.querySelector(
      '.uas-page-card[href="admin-dashboard.html"] em',
    );
    if (dashboardCard) {
      dashboardCard.textContent = "Workspace operasional dan data prototipe lokal.";
    }
  };

  ready(() => {
    cleanHelp();
    cleanContact();
    cleanCompliance();
  });
})();
