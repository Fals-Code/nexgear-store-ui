#!/usr/bin/env python3
"""Apply deterministic fixes discovered by the browser-level UAS smoke test."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(relative: str, old: str, new: str) -> bool:
    path = ROOT / relative
    content = path.read_text(encoding="utf-8")
    if new in content:
        return False
    if old not in content:
        raise RuntimeError(f"Expected fragment was not found in {relative}")
    path.write_text(content.replace(old, new, 1), encoding="utf-8")
    return True


def main() -> None:
    changed: list[str] = []

    admin_loader = '''  const ensureQualityLayer = () => {
    if (!document.querySelector('link[data-quality-hardening]')) {
      const qualityCss = document.createElement("link");
      qualityCss.rel = "stylesheet";
      qualityCss.href = "styles/quality-hardening.css?v=1";
      qualityCss.dataset.qualityHardening = "true";
      document.head.appendChild(qualityCss);
    }

    if (!window.NexA11y && !document.querySelector('script[data-quality-hardening]')) {
      const qualityScript = document.createElement("script");
      qualityScript.src = "scripts/quality-hardening.js?v=1";
      qualityScript.dataset.qualityHardening = "true";
      document.head.appendChild(qualityScript);
    }
  };
  ensureQualityLayer();
'''
    if replace_once(
        "scripts/admin-suite.js",
        '  "use strict";\n',
        '  "use strict";\n' + admin_loader,
    ):
        changed.append("scripts/admin-suite.js")

    if replace_once(
        "scripts/quality-hardening.js",
        '    document.querySelectorAll("img").forEach(applyImageDefaults);',
        '''    document.querySelectorAll("img").forEach((image) => {
      applyImageDefaults(image);
      if (image.complete && image.naturalWidth === 0) replaceBrokenImage(image);
    });''',
    ):
        changed.append("scripts/quality-hardening.js")

    if replace_once(
        "scripts/quality-hardening.js",
        '''          if (node.matches("img")) applyImageDefaults(node);
          node.querySelectorAll?.("img").forEach(applyImageDefaults);''',
        '''          if (node.matches("img")) {
            applyImageDefaults(node);
            if (node.complete && node.naturalWidth === 0) replaceBrokenImage(node);
          }
          node.querySelectorAll?.("img").forEach((image) => {
            applyImageDefaults(image);
            if (image.complete && image.naturalWidth === 0) replaceBrokenImage(image);
          });''',
    ):
        if "scripts/quality-hardening.js" not in changed:
            changed.append("scripts/quality-hardening.js")

    if replace_once(
        "styles/checkout.css",
        '''.checkout-consent {
  display: grid;''',
        '''.checkout-consent {
  position: relative;
  display: grid;''',
    ):
        changed.append("styles/checkout.css")

    if replace_once(
        "styles/checkout.css",
        '''.checkout-consent input {
  position: absolute;
  opacity: 0;
}''',
        '''.checkout-consent input {
  position: absolute;
  top: 14px;
  left: 16px;
  z-index: 2;
  width: 20px;
  height: 20px;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}''',
    ):
        if "styles/checkout.css" not in changed:
            changed.append("styles/checkout.css")

    if replace_once(
        "styles/checkout.css",
        '''  border-radius: 6px;
  background: rgba(4, 5, 10, 0.72);
}''',
        '''  border-radius: 6px;
  background: rgba(4, 5, 10, 0.72);
  pointer-events: none;
}

.checkout-consent input:focus-visible + span {
  outline: 3px solid var(--color-primary);
  outline-offset: 3px;
}''',
    ):
        if "styles/checkout.css" not in changed:
            changed.append("styles/checkout.css")

    if replace_once(
        "tools/visual_smoke.mjs",
        '    await page.locator("#checkout-consent").check();',
        '    await page.locator(".checkout-consent").click();',
    ):
        changed.append("tools/visual_smoke.mjs")

    print("Updated:", ", ".join(changed) if changed else "nothing")


if __name__ == "__main__":
    main()
