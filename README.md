# NEXGEAR - Premium Gaming Gear E-Commerce

NEXGEAR adalah prototipe frontend e-commerce premium untuk **UAS Workshop Desain UI**. Proyek menggunakan HTML semantik, CSS, dan Vanilla JavaScript tanpa framework runtime.

## Fokus UI/UX

Desain mengadopsi tema dark premium gaming dengan aksen cyan `#00E5FF`, hierarki visual tegas, whitespace terukur, layout responsif, serta alur transaksi yang dapat disimulasikan melalui `localStorage`.

## Daftar Halaman (23 Halaman)

### Storefront dan transaksi

1. `index.html` - landing page
2. `catalog.html` - katalog dan filter produk
3. `product-detail.html` - detail, galeri, spesifikasi, dan ulasan produk
4. `cart.html` - keranjang interaktif
5. `checkout.html` - data pelanggan, alamat, pengiriman, dan metode pembayaran
6. `payment.html` - simulasi instruksi dan verifikasi pembayaran
7. `success.html` - konfirmasi pesanan
8. `track-order.html` - pelacakan status pesanan
9. `transaction-history.html` - riwayat transaksi

### Konten dan akun

10. `blog.html` - arsip artikel
11. `blog-post.html` - detail artikel
12. `leave-review.html` - formulir ulasan
13. `login.html` - simulasi autentikasi
14. `profile.html` - profil pengguna
15. `about.html` - profil NEXGEAR
16. `contact.html` - kontak dukungan
17. `help.html` - pusat bantuan
18. `404.html` - halaman tautan tidak ditemukan

### Administrasi

19. `admin-dashboard.html` - ringkasan administrasi
20. `admin-articles.html` - pengelolaan artikel
21. `admin-products.html` - pengelolaan produk
22. `admin-users.html` - pengelolaan pengguna
23. `admin-transactions.html` - pengelolaan transaksi

## Cara Menjalankan

Header dan footer dimuat sebagai komponen dengan `fetch()`. Karena itu proyek perlu dijalankan melalui server lokal, bukan dengan membuka `index.html` langsung melalui protokol `file://`.

```bash
python -m http.server 5500
```

Buka `http://localhost:5500` melalui Chrome, Edge, atau Firefox.

## Arsitektur Frontend

Pembagian tanggung jawab JavaScript dan alur state dijelaskan pada [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Ringkasan struktur:

```text
scripts/
├── core/          # storage, events, currency, cart, auth
├── components/    # toast, dialog, navigation
├── pages/         # perilaku khusus katalog
├── *-page.js      # controller alur transaksi per halaman
└── main.js        # orchestrator fitur umum
```

CSS detail produk dikonsolidasikan menjadi:

```text
styles/
├── product.css
└── product-responsive.css
```

Source JavaScript untuk checkout, pembayaran, konfirmasi, dan administrasi disimpan dalam bentuk readable agar struktur fungsi, validasi, event listener, dan pemakaian `localStorage` dapat diaudit pada penilaian akademik.

---

**Dibuat untuk Tugas UAS Workshop Desain UI**  
Universitas Airlangga - D4 Teknik Informatika
