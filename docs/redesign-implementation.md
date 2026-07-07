# NEXGEAR Redesign Implementation

Direction: Stealth Laboratory.

Scope: product detail, cart, checkout, payment, success, tracking, transaction history, review, profile, about, contact, help, 404, five admin pages, and UAS compliance.

Design-locked HTML files remain unchanged: index, catalog, blog, blog detail, and login including registration.

New isolated layers:

- `styles/nx-redesign.css`
- `scripts/nx-redesign.js`
- `scripts/nx-content-integrity.js`
- `styles/admin-stealth-redesign.css`

The shared loader applies the storefront layer only to the exact approved page allowlist. Admin pages use the existing CRUD shell with an admin-only CSS layer. No framework or new runtime dependency was added.

The redesign removes unsupported ratings, verified-buyer totals, warranty duration, stock readiness, support SLA, and self-scored compliance claims. Admin seed records are visibly labeled as local prototype data.

Local smoke test:

```bash
python -m http.server 5500
```

Test transaction flow, admin CRUD, keyboard navigation, reduced motion, and widths 1440, 768, and 375 pixels. Recheck the design-locked pages for visual regression.
