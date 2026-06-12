#!/usr/bin/env python3
"""One-time migration of duplicated NEXGEAR header/footer markup.

Source of truth:
- topbar + navbar: index.html #navbar
- footer: index.html .site-footer

All root HTML pages are migrated except authentication pages.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_FILE = ROOT / "index.html"
COMPONENTS_DIR = ROOT / "components"
MAIN_JS = ROOT / "scripts" / "main.js"
LOADER_TAG = '<script src="scripts/global-components.js"></script>'

EXCLUDED_AUTH_PAGES = {
    "login.html",
    "register.html",
    "registration.html",
    "signup.html",
}

HEADER_PATTERN = re.compile(
    r"(?:<!--\s*GLOBAL HEADER\s*-->\s*)?"
    r"(<header\b[^>]*(?:id=[\"']navbar[\"']|class=[\"'][^\"']*\bnex-header\b[^\"']*[\"'])[^>]*>.*?</header>)",
    re.IGNORECASE | re.DOTALL,
)

FOOTER_PATTERN = re.compile(
    r"(?:<!--\s*GLOBAL FOOTER\s*-->\s*)?"
    r"(<footer\b[^>]*class=[\"'][^\"']*\bsite-footer\b[^\"']*[\"'][^>]*>.*?</footer>)",
    re.IGNORECASE | re.DOTALL,
)

MAIN_SCRIPT_PATTERN = re.compile(
    r"(?P<tag><script\b[^>]*src=[\"']scripts/main\.js[\"'][^>]*>\s*</script>)",
    re.IGNORECASE,
)

OLD_INIT_BLOCK = '''  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
'''

NEW_INIT_BLOCK = '''  function startAfterGlobalComponents() {
    const componentsReady = window.NexGlobalComponents?.ready;

    if (componentsReady && typeof componentsReady.then === "function") {
      componentsReady
        .then(() => init())
        .catch((error) => {
          console.warn("NEXGEAR components fallback:", error);
          init();
        });
      return;
    }

    init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startAfterGlobalComponents);
  } else {
    startAfterGlobalComponents();
  }
'''


def extract_component(source: str, pattern: re.Pattern[str], label: str) -> str:
    match = pattern.search(source)
    if not match:
        raise RuntimeError(f"Tidak dapat menemukan {label} di index.html")
    return match.group(1).strip() + "\n"


def migrate_html(path: Path) -> tuple[bool, bool, bool]:
    source = path.read_text(encoding="utf-8")
    original = source

    header_replaced = False
    footer_replaced = False
    loader_added = False

    if 'id="global-header"' not in source:
        source, count = HEADER_PATTERN.subn(
            '<!-- GLOBAL HEADER COMPONENT -->\n    <div id="global-header"></div>',
            source,
            count=1,
        )
        header_replaced = count == 1

    if 'id="global-footer"' not in source:
        source, count = FOOTER_PATTERN.subn(
            '<!-- GLOBAL FOOTER COMPONENT -->\n    <div id="global-footer"></div>',
            source,
            count=1,
        )
        footer_replaced = count == 1

    if LOADER_TAG not in source:
        source, count = MAIN_SCRIPT_PATTERN.subn(
            f"{LOADER_TAG}\n    \\g<tag>",
            source,
            count=1,
        )
        loader_added = count == 1

    if source != original:
        path.write_text(source, encoding="utf-8")

    return header_replaced, footer_replaced, loader_added


def update_main_js() -> bool:
    source = MAIN_JS.read_text(encoding="utf-8")

    if "function startAfterGlobalComponents()" in source:
        return False

    if OLD_INIT_BLOCK not in source:
        raise RuntimeError("Blok inisialisasi scripts/main.js tidak dikenali.")

    MAIN_JS.write_text(
        source.replace(OLD_INIT_BLOCK, NEW_INIT_BLOCK, 1),
        encoding="utf-8",
    )
    return True


def main() -> None:
    index_source = INDEX_FILE.read_text(encoding="utf-8")
    header = extract_component(index_source, HEADER_PATTERN, "header #navbar")
    footer = extract_component(index_source, FOOTER_PATTERN, "footer .site-footer")

    COMPONENTS_DIR.mkdir(parents=True, exist_ok=True)
    (COMPONENTS_DIR / "header.html").write_text(header, encoding="utf-8")
    (COMPONENTS_DIR / "footer.html").write_text(footer, encoding="utf-8")

    migrated: list[str] = []
    skipped: list[str] = []
    warnings: list[str] = []

    for html_file in sorted(ROOT.glob("*.html")):
        if html_file.name.lower() in EXCLUDED_AUTH_PAGES:
            skipped.append(html_file.name)
            continue

        header_changed, footer_changed, loader_added = migrate_html(html_file)
        migrated.append(html_file.name)

        final_source = html_file.read_text(encoding="utf-8")
        if 'id="global-header"' not in final_source:
            warnings.append(f"{html_file.name}: placeholder header tidak ditemukan")
        if 'id="global-footer"' not in final_source:
            warnings.append(f"{html_file.name}: placeholder footer tidak ditemukan")
        if LOADER_TAG not in final_source:
            warnings.append(f"{html_file.name}: loader tidak ditemukan")

        print(
            f"{html_file.name}: header={header_changed}, "
            f"footer={footer_changed}, loader={loader_added}"
        )

    main_js_changed = update_main_js()

    print(f"Migrated ({len(migrated)}): {', '.join(migrated)}")
    print(f"Skipped auth ({len(skipped)}): {', '.join(skipped) or '-'}")
    print(f"main.js updated: {main_js_changed}")

    if warnings:
        raise RuntimeError("\n".join(warnings))


if __name__ == "__main__":
    main()
