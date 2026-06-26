from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAIN = ROOT / "scripts" / "main.js"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")


def closing_brace(source: str, opening: int) -> int:
    depth = 0
    quote = None
    escaped = line_comment = block_comment = False
    index = opening
    while index < len(source):
        char = source[index]
        nxt = source[index + 1] if index + 1 < len(source) else ""
        if line_comment:
            line_comment = char != "\n"
            index += 1
            continue
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
        if char == "/" and nxt == "/":
            line_comment = True
            index += 2
            continue
        if char == "/" and nxt == "*":
            block_comment = True
            index += 2
            continue
        if char in {'"', "'", "`"}:
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
    raise ValueError("Unmatched brace")


def extract(source: str, name: str) -> tuple[str, str]:
    match = re.search(rf"(?m)^\s{{2}}function\s+{re.escape(name)}\s*\(", source)
    if not match:
        raise ValueError(f"Function not found: {name}")
    opening = source.find("{", match.end())
    end = closing_brace(source, opening) + 1
    while end < len(source) and source[end] in " \t":
        end += 1
    if end < len(source) and source[end] == "\n":
        end += 1
    return source[match.start():end].strip(), source[:match.start()] + source[end:]


def module(namespace: str, functions: list[str], aliases: str = "") -> str:
    names = [re.search(r"function\s+(\w+)", item).group(1) for item in functions]
    calls = "\n".join(f"    safeInit({name});" for name in names)
    return f'''(() => {{
  "use strict";

  {aliases.strip()}

{"\n\n".join(functions)}

  let initialized = false;

  function safeInit(initializer) {{
    try {{
      if (typeof initializer === "function") initializer();
    }} catch (error) {{
      console.warn("NEXGEAR {namespace} warning:", error);
    }}
  }}

  function init() {{
    if (initialized) return;
    initialized = true;
{calls}
  }}

  window.{namespace} = Object.freeze({{ init }});
}})();'''


def refactor_main() -> None:
    source = MAIN.read_text(encoding="utf-8")
    if "window.NexNavigation?.init()" in source:
        return

    start = source.find("  function formatRupiah")
    navbar = source.find("  function initNavbar")
    if start < 0 or navbar < 0:
        raise ValueError("main.js utility section not recognized")

    aliases = '''  const formatRupiah = window.NexCurrency?.formatRupiah || window.formatRupiah;
  const Cart = window.NexCart;
  const Auth = window.NexAuth;
  const showToast = window.NexToast?.show || window.showToast;
  const showNexToast = window.NexToast?.showCompact || window.showNexToast;

'''
    source = source[:start] + aliases + source[navbar:]

    groups = {
        "navigation": ["initNavbar", "initMobileMenu", "setActiveNav", "initMiniCartDropdownRemove", "initCategoryPanel", "initCartEmptyGuidance"],
        "dialog": ["initTrustModal"],
        "catalog": ["initPriceFilter", "initGearFinder", "initCatalogEnhancements", "initSearch", "initAddToCart", "initCatalogActionFeedback", "initCatalogCardLinks", "initSketchRotations", "initFilterDrawer", "initCatalogFilterBar", "initCatalogFilterDropdowns"],
    }
    extracted = {group: [] for group in groups}
    for group, names in groups.items():
        for name in names:
            function, source = extract(source, name)
            extracted[group].append(function)

    new_initializers = '''    const modules = [
      () => window.NexNavigation?.init(),
      () => window.NexDialogs?.init(),
      () => window.NexCatalog?.init(),
      initReveal,
      initCountUp,
      initParallax,
      initLoginReveal,
      syncFooterRevealSpace,
      initPromoWindowReveal,
      initShowcaseFilters,
    ];'''
    source, count = re.subn(r"    const modules = \[\n.*?\n    \];", new_initializers, source, count=1, flags=re.DOTALL)
    if count != 1:
        raise ValueError("main.js initializer list not recognized")
    write(MAIN, source)

    write(ROOT / "scripts/components/navigation.js", module("NexNavigation", extracted["navigation"], "const Cart = window.NexCart;"))
    catalog_aliases = '''const formatRupiah = window.NexCurrency?.formatRupiah || window.formatRupiah;
  const Cart = window.NexCart;
  const showToast = window.NexToast?.show || window.showToast;
  const showNexToast = window.NexToast?.showCompact || window.showNexToast;'''
    write(ROOT / "scripts/pages/catalog.js", module("NexCatalog", extracted["catalog"], catalog_aliases))

    helpers = '''
  const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

  function createDialog(root, closeSelector = "[data-dialog-close]") {
    if (!root) return null;
    let returnFocus = null;
    const focusables = () => Array.from(root.querySelectorAll(FOCUSABLE)).filter((element) => !element.hidden && element.offsetParent !== null);
    function open(trigger = document.activeElement) {
      returnFocus = trigger instanceof HTMLElement ? trigger : null;
      root.hidden = false;
      root.dataset.state = "open";
      root.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => focusables()[0]?.focus());
    }
    function close() {
      root.dataset.state = "closed";
      root.setAttribute("aria-hidden", "true");
      root.hidden = true;
      document.body.style.overflow = "";
      returnFocus?.focus?.();
    }
    root.addEventListener("click", (event) => {
      if (event.target === root || event.target.closest(closeSelector)) close();
    });
    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") return close();
      if (event.key !== "Tab") return;
      const elements = focusables();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    return Object.freeze({ open, close });
  }

  window.NexDialog = Object.freeze({ create: createDialog });
'''
    dialog = module("NexDialogs", extracted["dialog"])
    dialog = dialog.replace('  "use strict";\n', '  "use strict";\n' + helpers, 1)
    write(ROOT / "scripts/components/dialog.js", dialog)


def inject_scripts() -> None:
    target = '<script src="scripts/main.js"></script>'
    block = '''<script src="scripts/core/storage.js"></script>
    <script src="scripts/core/events.js"></script>
    <script src="scripts/core/currency.js"></script>
    <script src="scripts/components/toast.js"></script>
    <script src="scripts/core/cart.js"></script>
    <script src="scripts/core/auth.js"></script>
    <script src="scripts/components/dialog.js"></script>
    <script src="scripts/components/navigation.js"></script>
    <script src="scripts/pages/catalog.js"></script>
    <script src="scripts/main.js"></script>'''
    for path in ROOT.glob("*.html"):
        html = path.read_text(encoding="utf-8")
        if target in html and "scripts/core/storage.js" not in html:
            write(path, html.replace(target, block))


def validate() -> None:
    source = MAIN.read_text(encoding="utf-8")
    forbidden = ["function initNavbar", "function initTrustModal", "function initPriceFilter", "const Cart = {", "const Auth = {"]
    leftovers = [token for token in forbidden if token in source]
    if leftovers:
        raise ValueError(f"main.js still owns extracted domains: {leftovers}")


if __name__ == "__main__":
    refactor_main()
    inject_scripts()
    validate()
    print("JavaScript modules extracted")
