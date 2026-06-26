#!/usr/bin/env python3
"""Make the payment controller handle paid-order navigation natively."""

from pathlib import Path

path = Path(__file__).resolve().parents[1] / "scripts/payment-page.js"
content = path.read_text(encoding="utf-8")
old = '  $("#payment-mobile-action").addEventListener("click", verify);'
new = '''  $("#payment-mobile-action").addEventListener("click", () => {
    if (order?.paymentStatus === "paid") {
      location.href = `success.html?order=${encodeURIComponent(order.id)}`;
      return;
    }
    verify();
  });'''

if new not in content:
    if old not in content:
        raise RuntimeError("Payment mobile action listener was not found")
    path.write_text(content.replace(old, new, 1), encoding="utf-8")
    print("Updated scripts/payment-page.js")
else:
    print("Native payment recovery is already applied")
