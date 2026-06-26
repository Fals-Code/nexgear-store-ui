#!/usr/bin/env python3
"""Verify the visible paid-order recovery CTA instead of the mobile-only control."""

from pathlib import Path

path = Path(__file__).resolve().parents[1] / "tools/visual_smoke.mjs"
content = path.read_text(encoding="utf-8")
old = '''    const recoveryButton = page.locator("#payment-mobile-action");
    if ((await recoveryButton.getAttribute("data-payment-complete")) !== "true") {
      failures.push("Paid payment recovery state was not restored after reload");
    } else {
      await Promise.all([
        page.waitForURL(/success\\.html\\?order=/, {
          timeout: 15000,
          waitUntil: "domcontentloaded",
        }),
        recoveryButton.click(),
      ]);
    }'''
new = '''    const recoveryLink = page.locator(
      '.quality-payment-complete a[href^="success.html?order="]',
    );
    if (!(await recoveryLink.isVisible())) {
      failures.push("Paid payment recovery CTA was not restored after reload");
    } else {
      await Promise.all([
        page.waitForURL(/success\\.html\\?order=/, {
          timeout: 15000,
          waitUntil: "domcontentloaded",
        }),
        recoveryLink.click(),
      ]);
    }'''

if new not in content:
    if old not in content:
        raise RuntimeError("Paid recovery test block was not found")
    path.write_text(content.replace(old, new, 1), encoding="utf-8")
    print("Updated tools/visual_smoke.mjs")
else:
    print("Paid recovery CTA test is already applied")
