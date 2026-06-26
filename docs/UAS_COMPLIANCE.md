# UAS Workshop UI Compliance Checklist

Dokumen ini menjadi checklist akademik untuk memastikan NEXGEAR selaras dengan brief UAS Workshop UI.

## Ringkasan Brief

- UI dibuat from scratch menggunakan HTML dan CSS.
- JavaScript menjadi nilai tambah untuk interaksi.
- Wajib tersedia versi desktop dan mobile.
- Minimal requirement mencakup landing page, arsip artikel, detail artikel, katalog produk, detail produk, keranjang, pembayaran, history transaksi, kelola artikel, kelola produk, kelola pengguna, kelola transaksi, dan dashboard.
- Bobot approval: compatibility 25%, flow 20%, layout & struktur laman 20%, color 15%, tipografi 15%, content & aset visual 5%.

## Mapping Halaman

| Requirement | File | Status |
| --- | --- | --- |
| Landing Page | `index.html` | Ready |
| Arsip Artikel | `blog.html` | Ready |
| Detail Artikel | `blog-post.html` | Ready |
| Katalog Produk | `catalog.html` | Ready |
| Detail Produk | `product-detail.html` | Ready |
| Keranjang | `cart.html` | Ready |
| Pembayaran | `checkout.html`, `payment.html` | Ready |
| History Transaksi | `transaction-history.html` | Ready |
| Kelola Artikel | `admin-articles.html` | Ready |
| Kelola Produk | `admin-products.html` | Ready |
| Kelola Pengguna | `admin-users.html` | Ready |
| Kelola Transaksi | `admin-transactions.html` | Ready |
| Dashboard | `admin-dashboard.html` | Ready |

## Perubahan Terbaru

1. Menambahkan `uas-compliance.html` sebagai peta audit visual.
2. Menambahkan `styles/uas-compliance.css` untuk layout responsive, glassmorphism, bento grid, dan fluid typography.
3. Menambahkan `scripts/uas-compliance.js` untuk count-up, state map, dan live announcement ringan.
4. Memperbarui `components/header.html` agar link UAS Brief muncul di seluruh halaman melalui global component.
5. Memperbarui `README.md` dengan mapping eksplisit ke requirement brief.

## Catatan UX

- Halaman audit sengaja dibuat sebagai entry point penilaian agar dosen tidak perlu membuka file satu per satu.
- Alur storefront dan admin dipisahkan agar mental model pengguna tetap jelas.
- Visual hierarchy menggunakan headline besar, kartu checklist, dan flow list untuk mempercepat scanning.
- Interaksi JavaScript bersifat progresif. Tanpa JavaScript, link dan konten tetap terbaca.
