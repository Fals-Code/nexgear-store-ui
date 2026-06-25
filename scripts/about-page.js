(function () {
  "use strict";

  const main = document.querySelector(".about-main");
  if (!main) return;

  const beliefs = [
    ["Context is more useful than hype.", "Kebutuhan pengguna menentukan apakah sebuah fitur benar-benar berguna."],
    ["Specifications need interpretation.", "Angka harus diterjemahkan menjadi dampak terhadap pengalaman."],
    ["A product must fit the entire setup.", "Ukuran, koneksi, ruang, software, dan workflow ikut menentukan."],
    ["Long-term comfort matters.", "Kenyamanan, dukungan, perawatan, dan daya tahan tetap dihitung."],
    ["Every recommendation needs a reason.", "Pengguna perlu mengetahui kapan produk cocok dan kapan alternatif lebih masuk akal."],
  ];

  const evidence = [
    ["Context", "Game, workflow, mobilitas, anggaran, durasi penggunaan."],
    ["Feel", "Ergonomi, feedback, kontrol, kenyamanan sesi panjang."],
    ["Performance", "Latency, stabilitas, respons, thermal, konsistensi."],
    ["Compatibility", "Ukuran, koneksi, software, platform, ekosistem."],
    ["Ownership", "Garansi, maintenance, durability, dukungan."],
  ];

  const refusals = [
    "Kami tidak merekomendasikan produk hanya karena baru.",
    "Kami tidak menganggap angka lebih tinggi selalu lebih baik.",
    "Kami tidak menyembunyikan trade-off yang penting.",
    "Kami tidak menganggap semua gamer membutuhkan hardware premium.",
    "Kami tidak menyebut setiap benda ber-LED sebagai kebutuhan esensial.",
  ];

  const scopes = [
    ["CONTROL", "Input, response, ergonomics", "Mouse, keyboard, controller, mousepad", "control"],
    ["SOUND", "Communication, awareness, immersion", "Headset, microphone, speaker", "sound"],
    ["MACHINE", "Performance, stability, workflow", "Laptop, monitor, component", "machine"],
  ];

  const sections = [
    ["identity", "00", "Identity"],
    ["origin", "01", "Origin"],
    ["belief", "02", "What we believe"],
    ["method", "03", "How we curate"],
    ["refuse", "04", "What we refuse"],
    ["scope", "05", "Current scope"],
  ];

  main.innerHTML = `
    <div class="about-progress" aria-hidden="true"><span></span></div>
    <header class="about-record">
      <div class="container about-record__grid">
        <div>
          <span>NEXGEAR / BRAND DOSSIER 001</span>
          <h1>Independent gaming gear curation.</h1>
          <div class="about-record__subline">
            <span><b>4 MIN</b> estimated reading</span>
            <span><b>REV. 05/2026</b> current edition</span>
            <span><b>ID</b> NXG-ABOUT-001</span>
          </div>
        </div>
        <dl>
          <div><dt>TYPE</dt><dd>Curated commerce</dd></div>
          <div><dt>FOCUS</dt><dd>Gaming hardware</dd></div>
          <div><dt>APPROACH</dt><dd>Context before specification</dd></div>
          <div><dt>STATUS</dt><dd>Digital-first platform</dd></div>
        </dl>
      </div>
    </header>

    <div class="container about-dossier">
      <nav class="about-chapters" aria-label="Bab halaman Tentang">
        <span>CONTENTS</span>
        ${sections.map((item, index) => `<a href="#${item[0]}" class="${index === 0 ? "is-active" : ""}"><b>${item[1]}</b>${item[2]}</a>`).join("")}
        <div class="about-chapters__progress"><span>READING</span><strong>00%</strong></div>
      </nav>

      <article class="about-document">
        <section id="identity" class="about-chapter" data-about-section data-index="00">
          <span>00 / IDENTITY</span>
          <div class="about-chapter-intro">
            <div>
              <h2>We help people choose gear with <em>context.</em></h2>
              <p class="lead">NEXGEAR adalah platform kurasi gaming gear yang membantu pengguna memahami hubungan antara produk, kebutuhan, dan keseluruhan setup.</p>
            </div>
            <aside>Produk tidak berdiri sendiri. Ia selalu berinteraksi dengan pengguna, ruang, kebiasaan, software, perangkat lain, dan anggaran.</aside>
          </div>
          <p>Kami tidak memulai dari produk dengan angka tertinggi, melainkan dari siapa yang memakainya, untuk aktivitas apa, dan kompromi apa yang masih masuk akal.</p>
          <aside class="about-definition"><b>DEFINITION / 001</b><p><strong>Kurasi</strong> berarti memilih, membandingkan, dan menjelaskan. Bukan sekadar membuat katalog semakin panjang.</p></aside>
        </section>

        <section id="origin" class="about-chapter" data-about-section data-index="01">
          <span>01 / ORIGIN</span>
          <h2>The problem was never a lack of options. It was a lack of clarity.</h2>
          <div class="about-copy-grid"><p>Spesifikasi mudah ditemukan, sedangkan konteks penggunaan dan kecocokan setup jauh lebih jarang dijelaskan.</p><p>NEXGEAR menghubungkan produk dengan pengguna, ruang, perangkat lain, kebiasaan, dan anggaran.</p></div>
          <figure class="about-field-image"><img src="https://images.unsplash.com/photo-1598550476439-6847785fcea6?auto=format&fit=crop&w=1500&q=86" alt="Gaming setup dengan monitor dan peripheral"><figcaption><b>FIELD NOTE 01</b><p>A setup is a system, not a collection of impressive objects.</p></figcaption></figure>
        </section>

        <section id="belief" class="about-chapter" data-about-section data-index="02">
          <span>02 / WHAT WE BELIEVE</span>
          <h2>Five statements that guide every recommendation.</h2>
          <div class="about-manifesto-list">${beliefs.map((item, index) => `<details ${index === 0 ? "open" : ""}><summary><b>${String(index + 1).padStart(2, "0")}</b><strong>${item[0]}</strong><i>+</i></summary><p>${item[1]}</p></details>`).join("")}</div>
        </section>

        <section id="method" class="about-chapter" data-about-section data-index="03">
          <span>03 / HOW WE CURATE</span>
          <h2>Evidence before enthusiasm.</h2>
          <p class="lead">Setiap produk dibaca melalui beberapa dimensi yang saling berkaitan. Tidak ada satu angka sakti yang otomatis mengubah benda menjadi rekomendasi.</p>
          <div class="about-evidence-table"><div><b>Dimension</b><b>What we examine</b></div>${evidence.map((item) => `<div><strong>${item[0]}</strong><span>${item[1]}</span></div>`).join("")}</div>
          <aside class="about-case-note"><b>CASE / CONTROL DEVICE</b><h3>High polling rate</h3><p>Berguna ketika sistem, display, game, dan penggunanya dapat memanfaatkan respons tersebut. Pada konteks lain, manfaatnya bisa lebih kecil dari klaim pemasarannya.</p></aside>
        </section>

        <section id="refuse" class="about-chapter" data-about-section data-index="04">
          <span>04 / WHAT WE REFUSE</span>
          <h2>Boundaries are part of the brand.</h2>
          <div class="about-refusal-list">${refusals.map((item, index) => `<p><b>${String(index + 1).padStart(2, "0")}</b>${item}</p>`).join("")}</div>
        </section>

        <section id="scope" class="about-chapter" data-about-section data-index="05">
          <span>05 / CURRENT SCOPE</span>
          <h2>Three areas, one connected setup.</h2>
          <div class="about-scope-index">${scopes.map((item, index) => `<a href="catalog.html?category=${item[3]}"><span>${String(index + 1).padStart(2, "0")} / ${item[0]}</span><div><strong>${item[1]}</strong><small>${item[2]}</small></div><b>VIEW INDEX →</b></a>`).join("")}</div>
        </section>

        <footer class="about-document__footer"><p>NEXGEAR exists to make hardware decisions clearer.</p><nav><a href="catalog.html">Explore catalog →</a><a href="blog.html">Read journal →</a><a href="contact.html">Contact team →</a></nav></footer>
      </article>

      <aside class="about-notes">
        <div><span>DOCUMENT</span><strong>Brand dossier</strong></div>
        <div><span>REVISION</span><strong>05 / 2026</strong></div>
        <div><span>TERMINOLOGY</span><p><b>Setup fit</b> adalah kesesuaian produk dengan perangkat, ruang, kebiasaan, dan tujuan pengguna.</p></div>
        <div><span>STATUS</span><strong class="about-notes__status">Current</strong></div>
        <blockquote>A better setup starts with a clearer reason.</blockquote>
      </aside>
    </div>
    <div class="about-toast" role="status" aria-live="polite">Section updated</div>`;

  const links = Array.from(document.querySelectorAll(".about-chapters a"));
  const targets = Array.from(document.querySelectorAll("[data-about-section]"));
  const progressBar = document.querySelector(".about-progress span");
  const progressLabel = document.querySelector(".about-chapters__progress strong");
  const toast = document.querySelector(".about-toast");

  const setActive = (id) => {
    links.forEach((link) => link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`));
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: "-22% 0px -62%", threshold: 0 });
    targets.forEach((target) => observer.observe(target));
  }

  links.forEach((link) => {
    link.addEventListener("click", () => {
      setActive(link.getAttribute("href").slice(1));
    });
  });

  document.querySelectorAll(".about-manifesto-list details").forEach((detail) => {
    detail.addEventListener("toggle", () => {
      if (!detail.open) return;
      document.querySelectorAll(".about-manifesto-list details").forEach((other) => {
        if (other !== detail) other.open = false;
      });
    });
  });

  const updateProgress = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const percent = Math.round(ratio * 100);
    progressBar.style.width = `${percent}%`;
    progressLabel.textContent = `${String(percent).padStart(2, "0")}%`;
  };

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateProgress();
      ticking = false;
    });
  }, { passive: true });

  document.querySelectorAll(".about-scope-index a").forEach((link) => {
    link.addEventListener("mouseenter", () => {
      toast.textContent = `Open ${link.querySelector("span").textContent.replace(/^\d+\s\/\s/, "")} index`;
      toast.classList.add("is-visible");
    });
    link.addEventListener("mouseleave", () => toast.classList.remove("is-visible"));
  });

  updateProgress();
})();
