# Roadmap Perbaikan Persona dan User Story UAS

## Dasar Brief

Persona utama adalah Andy, 29 tahun, mahasiswa yang tinggal di kos Surabaya Timur, memiliki literasi teknologi cukup baik, aktif online sekitar 2-3 jam per hari, serta menilai pengalaman berdasarkan user-friendly, vibes, kualitas, dan color. Prinsip perilakunya diringkas oleh kutipan: "Kalau ada yang cepat, ngapain ribet."

## User Story Utama

> Sebagai Andy, mahasiswa dengan waktu online terbatas, saya ingin menemukan gear gaming berkualitas, memahami manfaat produk, melakukan pembelian, dan memantau pesanan dengan langkah sesingkat mungkin agar saya tidak membuang waktu pada proses yang rumit.

## Prinsip Desain Turunan

1. Jalur utama harus terlihat tanpa membuka banyak menu.
2. Informasi kualitas dan kepercayaan harus muncul sebelum keputusan pembelian.
3. Aksi primer harus konsisten dari katalog sampai pembayaran.
4. Desktop dan mobile harus memiliki fungsi yang setara.
5. Area customer dan area admin tidak boleh bercampur dalam navigasi pembeli.
6. Status transaksi dan dukungan harus dapat diakses kembali dengan cepat.

## Fase 1 - Fast Path dan Navigasi Customer

Status: Selesai.

Implementasi:
- Tautan akademik dan admin dihapus dari navigasi storefront.
- Catalog, Track Order, Help, Pesanan Saya, dan Customer Panel tersedia melalui jalur langsung.
- Account dropdown menyesuaikan status login prototype.
- Logout membersihkan session prototype.

Acceptance criteria:
- Customer tidak melihat menu admin pada header storefront.
- Pengguna login diarahkan ke panel customer.
- Pesanan Saya menuju riwayat transaksi.
- Track Order dan Help dapat dicapai langsung dari header.
- Logout membersihkan session prototype.

## Fase 2 - Keputusan Produk Cepat dan Berbasis Kualitas

Status: Selesai.

Implementasi:
- Katalog memiliki fast pick berdasarkan setup ringkas, hemat, sound, dan performa tinggi.
- Setiap kartu produk menampilkan rating, jumlah ulasan, garansi, stok, dan value signal.
- Setiap kartu memiliki Lihat Detail dan Beli Sekarang.
- Product detail menampilkan evidence ringkas sebelum area pembelian.
- Tambah ke Keranjang, Beli Sekarang, wishlist, dan compare memiliki state serta feedback.
- Mobile memiliki sticky buy bar agar CTA tetap terlihat.
- Runtime regression guard memeriksa quality signal, CTA, accessibility state, dan horizontal overflow.

Acceptance criteria:
- Produk dapat ditemukan maksimal melalui dua interaksi dari landing page.
- Product detail memiliki CTA Tambah ke Keranjang dan Beli Sekarang.
- Informasi kualitas utama terlihat sebelum pengguna melakukan scroll panjang.
- Wishlist dan compare memiliki state `aria-pressed` dan persistence prototype.
- Beli Sekarang menyimpan produk dan membuka checkout.

## Fase 3 - Checkout Tanpa Ribet

Status: Selesai.

Implementasi:
- Data nama, telepon, email, alamat, pilihan kurir, metode pembayaran, dan proteksi dapat digunakan kembali.
- Alamat utama serta preferensi checkout disimpan pada localStorage prototype.
- Checkout memiliki progress kelengkapan kontak, alamat, serta pengiriman dan pembayaran.
- Tombol Buat Pesanan hanya aktif saat data minimum valid.
- Setiap metode pengiriman menampilkan ETA sebelum pesanan dibuat.
- Snapshot order menyimpan subtotal, pengiriman, proteksi, diskon, total, pembayaran, dan ETA.
- Payment dan success menampilkan continuity card dari sumber order yang sama.
- Riwayat transaksi merender pesanan yang dibuat melalui checkout beserta total dan tindakan sesuai status.
- Runtime regression guard memeriksa total, snapshot, persisted order, overflow, dan state submit.

Acceptance criteria:
- Pengguna dapat menyelesaikan checkout tanpa mengisi ulang data yang sudah tersimpan.
- Tombol lanjut hanya aktif saat data minimum valid.
- Total pembayaran menggunakan sumber order yang sama pada checkout, payment, success, dan history.
- Kurir, ETA, metode pembayaran, serta alamat tetap konsisten sepanjang alur.
- Pesanan yang dibuat melalui checkout muncul pada history.

## Fase 4 - Customer Hub dan After-Sales

Status: Menunggu implementasi.

Target:
- Menyesuaikan profile dengan data login dan transaksi aktual prototype.
- Menghubungkan dashboard customer ke history, tracking, wishlist, alamat, dan review.
- Menampilkan tindakan relevan berdasarkan status pesanan.
- Menyediakan recovery saat pesanan tidak ditemukan.

Acceptance criteria:
- Data nama dan email customer mengikuti session login.
- Setiap order memiliki tindakan yang sesuai status.
- Track order dapat dibuka langsung melalui query nomor pesanan.

## Fase 5 - Compatibility, Accessibility, dan Bukti UAS

Status: Menunggu implementasi final.

Target:
- Regression test pada 390px, 768px, 1366px, dan 1440px.
- Audit keyboard, focus state, aria-live, contrast, dan reduced motion.
- Memastikan tidak ada console error, asset 404, atau horizontal overflow.
- Mendokumentasikan persona, user story, use case, screenshot, dan hasil pengujian pada laporan.

Acceptance criteria:
- Seluruh 13 halaman wajib lulus flow utama.
- Storefront dan admin dapat digunakan pada desktop dan mobile.
- Halaman uas-compliance memuat bukti persona, user story, dan pemetaan keputusan desain.
- Laporan akhir menyertakan bukti pengujian, repo, demo live, logbook, dan video.
