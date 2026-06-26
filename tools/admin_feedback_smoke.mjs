import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5500";
const outputRoot = path.resolve("artifacts/uas-visual-smoke/admin-feedback");

const cases = [
  {
    page: "admin-products.html",
    name: "products-archive",
    trigger: "[data-menu]",
    action: '[data-action="archive"]',
    toast: "#suite-toast",
    expected: /arsip/i,
  },
  {
    page: "admin-users.html",
    name: "users-block",
    trigger: "[data-menu]",
    action: '[data-action="block"]',
    toast: "#suite-toast",
    expected: /diblokir/i,
  },
  {
    page: "admin-transactions.html",
    name: "transactions-advance",
    trigger: "[data-menu]",
    action: '[data-action="advance"]',
    toast: "#suite-toast",
    expected: /status transaksi/i,
  },
  {
    page: "admin-articles.html",
    name: "articles-duplicate",
    trigger: "[data-row-menu]",
    action: '[data-menu-action="duplicate"]',
    toast: "#admin-toast",
    expected: /diduplikasi/i,
  },
];

const results = [];
await fs.mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  for (const testCase of cases) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    const failures = [];
    const pageErrors = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    try {
      await page.goto(`${baseUrl}/${testCase.page}`, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });
      await page.waitForFunction(() => Boolean(window.NexAdminFeedback), null, {
        timeout: 8000,
      });
      await page.locator(testCase.trigger).first().click();
      const action = page.locator(testCase.action).first();
      await action.waitFor({ state: "visible", timeout: 5000 });
      await page.waitForFunction(
        (selector) => {
          const element = document.querySelector(selector);
          if (!element) return false;
          const rect = element.getBoundingClientRect();
          return rect.width > 0
            && rect.height > 0
            && rect.top >= 0
            && rect.left >= 0
            && rect.bottom <= window.innerHeight
            && rect.right <= window.innerWidth;
        },
        testCase.action,
        { timeout: 5000 },
      );
      await action.click({ timeout: 5000 });

      const toast = page.locator(testCase.toast);
      await toast.waitFor({ state: "visible", timeout: 5000 });
      await page.waitForFunction(
        (selector) => {
          const element = document.querySelector(selector);
          if (!element?.classList.contains("is-visible")) return false;
          return Number.parseFloat(getComputedStyle(element).opacity || "0") >= 0.9;
        },
        testCase.toast,
        { timeout: 5000 },
      );

      const feedback = await toast.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          text: element.textContent?.replace(/\s+/g, " ").trim() || "",
          position: style.position,
          opacity: Number.parseFloat(style.opacity || "0"),
          zIndex: Number.parseInt(style.zIndex || "0", 10),
          tone: element.getAttribute("data-tone"),
          role: element.getAttribute("role"),
        };
      });

      if (!testCase.expected.test(feedback.text)) {
        failures.push(`Toast text mismatch: ${feedback.text}`);
      }
      if (feedback.position !== "fixed") {
        failures.push(`Toast position is ${feedback.position}, expected fixed`);
      }
      if (feedback.opacity < 0.9) {
        failures.push(`Toast opacity is ${feedback.opacity}`);
      }
      if (feedback.zIndex < 1000) {
        failures.push(`Toast z-index is ${feedback.zIndex}`);
      }
      if (!feedback.tone) failures.push("Toast tone is missing");
      if (!feedback.role) failures.push("Toast role is missing");

      await page.screenshot({
        path: path.join(outputRoot, `${testCase.name}.png`),
        fullPage: false,
      });
    } catch (error) {
      failures.push(error instanceof Error ? error.stack || error.message : String(error));
    }

    failures.push(...pageErrors.map((error) => `Page error: ${error}`));
    results.push({
      name: testCase.name,
      page: testCase.page,
      status: failures.length ? "FAIL" : "PASS",
      failures,
    });

    await context.close();
  }

  const exportContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const exportPage = await exportContext.newPage();
  const exportFailures = [];

  try {
    await exportPage.goto(`${baseUrl}/admin-users.html`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await exportPage.waitForFunction(() => Boolean(window.NexAdminFeedback), null, {
      timeout: 8000,
    });

    const exportButton = exportPage.getByRole("button", { name: /export pengguna/i });
    const [download] = await Promise.all([
      exportPage.waitForEvent("download", { timeout: 5000 }),
      exportButton.click(),
    ]);

    if (!download.suggestedFilename().endsWith(".csv")) {
      exportFailures.push(`Unexpected export filename: ${download.suggestedFilename()}`);
    }

    const toast = exportPage.locator("#suite-toast");
    await toast.waitFor({ state: "visible", timeout: 5000 });
    const text = (await toast.textContent())?.replace(/\s+/g, " ").trim() || "";
    if (!/export selesai/i.test(text)) {
      exportFailures.push(`Export feedback missing: ${text}`);
    }
  } catch (error) {
    exportFailures.push(error instanceof Error ? error.stack || error.message : String(error));
  }

  results.push({
    name: "users-export-csv",
    page: "admin-users.html",
    status: exportFailures.length ? "FAIL" : "PASS",
    failures: exportFailures,
  });
  await exportContext.close();

  const report = {
    generatedAt: new Date().toISOString(),
    results,
  };
  await fs.writeFile(
    path.join(outputRoot, "report.json"),
    JSON.stringify(report, null, 2),
    "utf-8",
  );

  const markdown = [
    "# Admin CRUD Feedback Smoke Report",
    "",
    "| Test | Page | Status |",
    "|---|---|---:|",
    ...results.map((result) => `| ${result.name} | ${result.page} | ${result.status} |`),
    "",
    ...results.flatMap((result) =>
      result.failures.length
        ? [`## ${result.name}`, "", ...result.failures.map((failure) => `- ${failure}`), ""]
        : [],
    ),
  ].join("\n");
  await fs.writeFile(path.join(outputRoot, "report.md"), `${markdown}\n`, "utf-8");
  console.log(markdown);

  if (results.some((result) => result.failures.length)) process.exitCode = 1;
} finally {
  await browser.close();
}
