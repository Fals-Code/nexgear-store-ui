from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STYLES = ROOT / "styles"


def write(path: Path, content: str) -> None:
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def closing_brace(source: str, opening: int) -> int:
    depth = 0
    quote = None
    escaped = block_comment = False
    index = opening
    while index < len(source):
        char = source[index]
        nxt = source[index + 1] if index + 1 < len(source) else ""
        if block_comment:
            if char == "*" and nxt == "/":
                block_comment = False
                index += 2
            else:
                index += 1
            continue
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            index += 1
            continue
        if char == "/" and nxt == "*":
            block_comment = True
            index += 2
            continue
        if char in {'"', "'"}:
            quote = char
            index += 1
            continue
        if char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return index
        index += 1
    raise ValueError("Unmatched CSS brace")


def split_media(css: str) -> tuple[str, list[str]]:
    base: list[str] = []
    media: list[str] = []
    cursor = 0
    while True:
        match = re.search(r"(?m)^@media\b", css[cursor:])
        if not match:
            base.append(css[cursor:])
            break
        start = cursor + match.start()
        opening = css.find("{", start)
        closing = closing_brace(css, opening)
        base.append(css[cursor:start])
        media.append(css[start:closing + 1].strip())
        cursor = closing + 1
    return "".join(base), media


def dedupe_exact_rules(css: str) -> str:
    seen: set[str] = set()
    pattern = re.compile(r"([^{}]+\{[^{}]*\})", re.DOTALL)

    def keep(match: re.Match[str]) -> str:
        block = match.group(1)
        normalized = re.sub(r"/\*.*?\*/|\s+", "", block, flags=re.DOTALL)
        if normalized in seen:
            return ""
        seen.add(normalized)
        return block

    return pattern.sub(keep, css)


def consolidate() -> None:
    responsive = STYLES / "product-responsive.css"
    patches = [
        ("Reviews", STYLES / "product-review.css"),
        ("Media badge", STYLES / "product-media-badge.css"),
        ("Related catalog", STYLES / "product-related-catalog-clean.css"),
    ]
    if responsive.exists() and not any(path.exists() for _, path in patches):
        return

    sources = [("Base layout", STYLES / "product.css"), *patches]
    base_sections: list[str] = []
    responsive_sections: list[str] = []

    for label, path in sources:
        css = path.read_text(encoding="utf-8")
        base, media = split_media(css)
        base_sections.append(f"/* Section: {label} */\n{base.strip()}")
        if media:
            responsive_sections.append(
                f"/* Section: {label} */\n" + "\n\n".join(media)
            )

    write(
        STYLES / "product.css",
        dedupe_exact_rules(
            "/* NEXGEAR product detail: consolidated source */\n\n"
            + "\n\n".join(base_sections)
        ),
    )
    write(
        responsive,
        dedupe_exact_rules(
            "/* NEXGEAR product detail: responsive rules */\n\n"
            + "\n\n".join(responsive_sections)
        ),
    )

    for _, path in patches:
        path.unlink()

    html_path = ROOT / "product-detail.html"
    html = html_path.read_text(encoding="utf-8")
    html = re.sub(
        r'\s*<link rel="stylesheet" href="styles/(?:product-review|product-media-badge|product-related-catalog-clean)\.css[^\"]*"\s*/?>',
        "",
        html,
    )
    if "product-responsive.css" not in html:
        html = html.replace(
            '<link rel="stylesheet" href="styles/product.css" />',
            '<link rel="stylesheet" href="styles/product.css" />\n    <link rel="stylesheet" href="styles/product-responsive.css" />',
        )
    write(html_path, html)


def validate() -> None:
    html = (ROOT / "product-detail.html").read_text(encoding="utf-8")
    old = (
        "product-review.css",
        "product-media-badge.css",
        "product-related-catalog-clean.css",
    )
    if any(name in html for name in old):
        raise ValueError("Patch stylesheets are still referenced")
    if not (STYLES / "product-responsive.css").exists():
        raise FileNotFoundError("styles/product-responsive.css")


if __name__ == "__main__":
    consolidate()
    validate()
    print("Product CSS consolidated")
