#!/usr/bin/env python3
"""Relax the recovery navigation wait to DOM readiness instead of external asset load."""

from pathlib import Path

path = Path(__file__).resolve().parents[1] / "tools/visual_smoke.mjs"
content = path.read_text(encoding="utf-8")
old = '''      await Promise.all([
        page.waitForURL(/success\\.html\\?order=/, { timeout: 10000 }),
        recoveryButton.click(),
      ]);'''
new = '''      await Promise.all([
        page.waitForURL(/success\\.html\\?order=/, {
          timeout: 15000,
          waitUntil: "domcontentloaded",
        }),
        recoveryButton.click(),
      ]);'''

if new not in content:
    if old not in content:
        raise RuntimeError("Recovery navigation block was not found")
    path.write_text(content.replace(old, new, 1), encoding="utf-8")
    print("Updated tools/visual_smoke.mjs")
else:
    print("Recovery wait fix is already applied")
