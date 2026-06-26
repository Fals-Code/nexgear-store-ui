#!/usr/bin/env python3
"""Static quality gate for the NEXGEAR Workshop UI UAS project."""

from __future__ import annotations

import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]

REQUIRED_PAGES = {
    "index.html": "Landing page",
    "blog.html": "Arsip artikel",
    "blog-post.html": "Detail artikel",
    "catalog.html": "Katalog produk",
    "product-detail.html": "Detail produk",
    "cart.html": "Keranjang",
    "payment.html": "Pembayaran",
    "transaction-history.html": "History transaksi",
    "admin-articles.html": "Kelola artikel",
    "admin-products.html": "Kelola produk",
    "admin-users.html": "Kelola pengguna",
    "admin-transactions.html": "Kelola transaksi",
    "admin-dashboard.html": "Dashboard",
}

EXTERNAL_SCHEMES = {
    "http",
    "https",
    "mailto",
    "tel",
    "data",
    "javascript",
}

RESOURCE_ATTRIBUTES = {
    "a": ("href",),
    "form": ("action",),
    "img": ("src",),
    "link": ("href",),
    "script": ("src",),
    "source": ("src",),
    "video": ("src", "poster"),
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang = ""
        self.has_viewport = False
        self.main_count = 0
        self.title_depth = 0
        self.title_text: list[str] = []
        self.references: list[tuple[str, str, int]] = []
        self.images_without_alt: list[int] = []
        self.duplicate_ids: list[tuple[str, int]] = []
        self._ids: set[str] = set()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = {name: value or "" for name, value in attrs}
        line, _ = self.getpos()

        if tag == "html":
            self.lang = attributes.get("lang", "").strip()
        elif tag == "meta" and attributes.get("name", "").lower() == "viewport":
            self.has_viewport = "width=device-width" in attributes.get("content", "").lower()
        elif tag == "main":
            self.main_count += 1
        elif tag == "title":
            self.title_depth += 1
        elif tag == "img" and "alt" not in attributes:
            self.images_without_alt.append(line)

        element_id = attributes.get("id", "").strip()
        if element_id:
            if element_id in self._ids:
                self.duplicate_ids.append((element_id, line))
            self._ids.add(element_id)

        for attribute in RESOURCE_ATTRIBUTES.get(tag, ()):
            value = attributes.get(attribute, "").strip()
            if value:
                self.references.append((attribute, value, line))

    def handle_endtag(self, tag: str) -> None:
        if tag == "title" and self.title_depth:
            self.title_depth -= 1

    def handle_data(self, data: str) -> None:
        if self.title_depth:
            self.title_text.append(data)


def is_external(reference: str) -> bool:
    if reference.startswith(("#", "//")):
        return True
    return urlsplit(reference).scheme.lower() in EXTERNAL_SCHEMES


def resolve_reference(page: Path, reference: str) -> Path | None:
    if not reference or is_external(reference):
        return None

    parsed = urlsplit(reference)
    raw_path = unquote(parsed.path).strip()
    if not raw_path or raw_path == "/":
        return None

    candidate = ROOT / raw_path.lstrip("/") if raw_path.startswith("/") else page.parent / raw_path
    return candidate.resolve()


def validate_page(page: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    parser = PageParser()

    try:
        parser.feed(page.read_text(encoding="utf-8"))
    except UnicodeDecodeError as exc:
        return [f"{page.name}: bukan UTF-8 ({exc})"], warnings

    if parser.lang.lower() != "id":
        errors.append(f"{page.name}: elemen <html> harus menggunakan lang=\"id\"")
    if not parser.has_viewport:
        errors.append(f"{page.name}: meta viewport responsif tidak ditemukan")
    if parser.main_count != 1:
        errors.append(f"{page.name}: harus memiliki tepat satu elemen <main>, ditemukan {parser.main_count}")

    title = " ".join("".join(parser.title_text).split())
    if not title:
        errors.append(f"{page.name}: judul dokumen <title> kosong")

    for line in parser.images_without_alt:
        errors.append(f"{page.name}:{line}: elemen <img> tidak memiliki atribut alt")

    for element_id, line in parser.duplicate_ids:
        errors.append(f"{page.name}:{line}: id duplikat \"{element_id}\"")

    for attribute, reference, line in parser.references:
        target = resolve_reference(page, reference)
        if target is None:
            continue
        try:
            target.relative_to(ROOT.resolve())
        except ValueError:
            warnings.append(f"{page.name}:{line}: referensi {attribute} keluar dari root: {reference}")
            continue
        if not target.exists():
            errors.append(f"{page.name}:{line}: referensi lokal tidak ditemukan: {reference}")

    return errors, warnings


def validate_project_files() -> list[str]:
    errors: list[str] = []

    for filename, label in REQUIRED_PAGES.items():
        if not (ROOT / filename).is_file():
            errors.append(f"Kriteria minimum belum terpenuhi: {label} ({filename}) tidak ditemukan")

    required_quality_files = (
        "styles/quality-hardening.css",
        "scripts/quality-hardening.js",
        "assets/image-fallback.svg",
    )
    for relative_path in required_quality_files:
        if not (ROOT / relative_path).is_file():
            errors.append(f"Quality baseline tidak ditemukan: {relative_path}")

    global_components = ROOT / "scripts/global-components.js"
    if global_components.is_file():
        content = global_components.read_text(encoding="utf-8")
        if "quality-hardening.css" not in content or "quality-hardening.js" not in content:
            errors.append("scripts/global-components.js belum memuat quality hardening global")

    css_files = list((ROOT / "styles").glob("*.css"))
    css_content = "\n".join(path.read_text(encoding="utf-8", errors="replace") for path in css_files)
    if "prefers-reduced-motion" not in css_content:
        errors.append("Tidak ada dukungan prefers-reduced-motion pada stylesheet")

    return errors


def main() -> int:
    errors = validate_project_files()
    warnings: list[str] = []
    html_files = sorted(ROOT.glob("*.html"))

    if not html_files:
        errors.append("Tidak ada file HTML pada root proyek")

    for page in html_files:
        page_errors, page_warnings = validate_page(page)
        errors.extend(page_errors)
        warnings.extend(page_warnings)

    print(f"Validated {len(html_files)} HTML pages and {len(REQUIRED_PAGES)} required UAS pages.")

    if warnings:
        print("\nWarnings:")
        for warning in warnings:
            print(f"  - {warning}")

    if errors:
        print("\nErrors:")
        for error in errors:
            print(f"  - {error}")
        print(f"\nUAS quality gate failed with {len(errors)} error(s).")
        return 1

    print("UAS quality gate passed: required pages, document structure, accessibility basics, and local references are valid.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
