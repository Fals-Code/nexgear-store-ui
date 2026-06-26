from pathlib import Path

root = Path(__file__).resolve().parents[1]


def patch(relative, old, new):
    path = root / relative
    text = path.read_text(encoding="utf-8")
    if new in text:
        return False
    if old not in text:
        raise RuntimeError(f"Missing expected fragment in {relative}")
    path.write_text(text.replace(old, new, 1), encoding="utf-8")
    return True


changed = []

if patch(
    "scripts/page-transition.js",
    "    catalogInitialLoad: 1440,\n    catalogSoftLoad: 840,",
    "    catalogInitialLoad: 720,\n    catalogSoftLoad: 360,",
):
    changed.append("scripts/page-transition.js")

if patch(
    "scripts/page-transition.js",
    "  function showCatalogLoading(duration) {\n    if (!isCatalogPage()) return;\n    createCatalogWireframe();\n    setCatalogLoading(true);",
    "  function showCatalogLoading(duration) {\n    if (!isCatalogPage()) return;\n    createCatalogWireframe();\n    if (reduceMotion.matches) {\n      setCatalogLoading(false);\n      return;\n    }\n    setCatalogLoading(true);",
):
    if "scripts/page-transition.js" not in changed:
        changed.append("scripts/page-transition.js")

if patch(
    "styles/transition.css",
    "body.catalog-data-loading .catalog-product-grid,\nbody.catalog-data-loading .catalog-grid {\n  opacity: 0.18;\n  filter: blur(1px);\n  pointer-events: none;\n}",
    "body.catalog-data-loading .catalog-product-grid,\nbody.catalog-data-loading .catalog-grid {\n  visibility: hidden;\n  max-height: 0;\n  overflow: hidden;\n  pointer-events: none;\n}",
):
    changed.append("styles/transition.css")

if patch(
    "tools/visual_smoke.mjs",
    "  await page.evaluate(() => document.fonts?.ready).catch(() => {});\n  await page.waitForTimeout(900);",
    "  await page.evaluate(() => document.fonts?.ready).catch(() => {});\n  await page\n    .waitForFunction(\n      () => !document.body?.classList.contains(\"catalog-data-loading\"),\n      null,\n      { timeout: 5000 },\n    )\n    .catch(() => {});\n  await page.waitForTimeout(300);",
):
    changed.append("tools/visual_smoke.mjs")

catalog = root / "catalog.html"
text = catalog.read_text(encoding="utf-8")
duplicate = '  <script src="scripts/page-transition.js"></script>\n'
if duplicate in text:
    catalog.write_text(text.replace(duplicate, "", 1), encoding="utf-8")
    changed.append("catalog.html")

print("Updated:", ", ".join(changed) if changed else "nothing")
