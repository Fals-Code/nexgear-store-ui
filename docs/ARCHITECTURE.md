# Frontend Architecture

Refactor ini memecah tanggung jawab yang sebelumnya terkumpul di `scripts/main.js`.

## Struktur runtime

```text
scripts/
├── core/
│   ├── storage.js
│   ├── events.js
│   ├── currency.js
│   ├── cart.js
│   └── auth.js
├── components/
│   ├── toast.js
│   ├── dialog.js
│   └── navigation.js
├── pages/
│   └── catalog.js
├── cart-page.js
├── checkout-page.js
├── payment-page.js
├── success-page.js
├── admin-suite.js
└── main.js
```

## Alur state

- `NexStorage` menjadi satu pintu pembacaan dan penulisan JSON ke `localStorage`.
- `NexEvents` menerbitkan perubahan state melalui `CustomEvent`.
- `NexCart` menyimpan item, memperbarui badge, lalu menerbitkan `nexgear:cart-change`.
- `NexAuth` menyimpan status login dan menerbitkan `nexgear:auth-change`.
- `NexNavigation`, `NexDialogs`, dan `NexCatalog` menangani DOM untuk domain masing-masing.
- `main.js` menjadi orchestrator untuk fitur umum yang belum perlu dipisah pada lingkup UAS.

## CSS halaman produk

Halaman detail produk hanya memuat dua file:

- `styles/product.css` untuk layout, gallery, pembelian, review, dan related products.
- `styles/product-responsive.css` untuk seluruh media query.

File tambalan lama digabung, blok rule identik dieliminasi, lalu file sumber tambalan dihapus.

## Source akademik

`checkout-page.js`, `payment-page.js`, `success-page.js`, dan `admin-suite.js` disimpan sebagai source readable. Minification tidak digunakan karena ukuran proyek statis tidak memerlukannya dan source perlu mudah diaudit saat penilaian.