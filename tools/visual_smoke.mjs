import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const baseUrl = process.env.BASE_URL || "http://127.0.0.1:5500";
const outputRoot = path.resolve("artifacts/uas-visual-smoke");

const requiredPages = [
  ["landing", "index.html"],
  ["article-archive", "blog.html"],
  ["article-detail", "blog-post.html"],
  ["catalog", "catalog.html"],
  ["product-detail", "product-detail.html"],
  ["cart", "cart.html"],
  ["payment", "payment.html?order=NEX-VISUAL001"],
  ["transaction-history", "transaction-history.html"],
  ["admin-articles", "admin-articles.html"],
  ["admin-products", "admin-products.html"],
  ["admin-users", "admin-users.html"],
  ["admin-transactions", "admin-transactions.html"],
  ["admin-dashboard", "admin-dashboard.html"],
];

const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

const demoCart = [
  {
    id: "vortex-vx-pro-mechanical",
    name: "Vortex VX Pro Mechanical",
    category: "Control",
    variant: "Linear Red Switch",
    price: 1850000,
    qty: 1,
    image: "lib/featured-keyboard.webp",
  },
  {
    id: "astro-a50-wireless-gen-4",
    name: "Astro A50 Wireless Gen 4",
    category: "Sound",
    variant: "Black",
    price: 4299000,
    qty: 1,
    image: "lib/featured-headset.webp",
  },
];

const demoOrder = {
  id: "NEX-VISUAL001",
  createdAt: new Date("2026-06-26T03:00:00.000Z").toISOString(),
  paymentDeadline: new Date(Date.now() + 86400000).toISOString(),
  status: "waiting",
  paymentStatus: "waiting",
  customer: {
    name: "Andy Pratama",
    phone: "081234567890",
    email: "andy@example.test",
  },
  address: {
    line: "Jl. Mulyorejo No. 10",
    province: "Jawa Timur",
    city: "Surabaya",
    district: "Mulyorejo",
    postalCode: "60115",
    courierNote: "Hubungi penerima sebelum tiba.",
  },
  shipping: { code: "regular", label: "Reguler", fee: 20000 },
  payment: { code: "bca-va", label: "Virtual Account BCA" },
  insurance: true,
  items: demoCart,
  promo: null,
  subtotal: 6149000,
  shippingFee: 0,
  insuranceFee: 15000,
  discount: 0,
  total: 6164000,
};

const seedStorage = ({ cart, order }) => {
  localStorage.setItem("nexgear_cart", JSON.stringify(cart));
  localStorage.setItem("nexgear_cart_initialized", "true");
  localStorage.setItem("nexgear_orders", JSON.stringify([order]));
  localStorage.setItem("nexgear_pending_order", JSON.stringify(order));
  localStorage.setItem(
    "nexgear_user",
    JSON.stringify({ name: "Andy Pratama", email: "andy@example.test" }),
  );
};

const waitForStablePage = async (page) => {
  await page.waitForLoadState("domcontentloaded");
  await page
    .waitForFunction(
      () =>
        document.readyState === "complete" ||
        document.documentElement.classList.contains("global-components-ready"),
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(900);
};

const collectMetrics = async (page) =>
  page.evaluate(() => {
    const main = document.querySelector("main");
    const brokenImages = Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src || image.alt || "unknown image");

    const documentWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body?.scrollWidth || 0,
    );

    return {
      title: document.title,
      mainCount: document.querySelectorAll("main").length,
      mainVisible: Boolean(
        main &&
          main.getBoundingClientRect().width > 0 &&
          main.getBoundingClientRect().height > 0,
      ),
      viewportWidth: window.innerWidth,
      documentWidth,
      overflowX: Math.max(0, documentWidth - window.innerWidth),
      brokenImages,
      hasSkipLink: Boolean(document.querySelector(".skip-link")),
      lang: document.documentElement.lang,
    };
  });

const runVisualAudit = async (browser) => {
  const results = [];

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    await context.addInitScript(seedStorage, { cart: demoCart, order: demoOrder });

    for (const [slug, relativeUrl] of requiredPages) {
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];

      page.on("console", (message) => {
        const text = message.text();
        const isHandledResourceFailure =
          message.type() === "error" && text.startsWith("Failed to load resource");
        if (message.type() === "error" && !isHandledResourceFailure) {
          consoleErrors.push(text);
        }
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const url = `${baseUrl}/${relativeUrl}`;
      let navigationError = "";
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        await waitForStablePage(page);
      } catch (error) {
        navigationError = error instanceof Error ? error.message : String(error);
      }

      const metrics = navigationError
        ? {
            title: "",
            mainCount: 0,
            mainVisible: false,
            viewportWidth: viewport.width,
            documentWidth: 0,
            overflowX: 0,
            brokenImages: [],
            hasSkipLink: false,
            lang: "",
          }
        : await collectMetrics(page);

      const screenshotDir = path.join(outputRoot, viewport.name);
      await fs.mkdir(screenshotDir, { recursive: true });
      const screenshot = path.join(screenshotDir, `${slug}.png`);
      if (!navigationError) {
        await page.screenshot({ path: screenshot, fullPage: true });
      }

      const failures = [];
      if (navigationError) failures.push(`Navigation failed: ${navigationError}`);
      if (metrics.mainCount !== 1) failures.push(`Expected one main element, found ${metrics.mainCount}`);
      if (!metrics.mainVisible) failures.push("Main content is not visible");
      if (metrics.overflowX > 4) failures.push(`Horizontal overflow: ${metrics.overflowX}px`);
      if (metrics.brokenImages.length) failures.push(`Broken images: ${metrics.brokenImages.join(", ")}`);
      if (!metrics.hasSkipLink) failures.push("Skip link is missing");
      if (metrics.lang !== "id") failures.push(`Document language is ${metrics.lang || "missing"}`);
      if (pageErrors.length) failures.push(`Page errors: ${pageErrors.join(" | ")}`);
      if (consoleErrors.length) failures.push(`Console errors: ${consoleErrors.join(" | ")}`);

      results.push({
        viewport: viewport.name,
        page: slug,
        url: relativeUrl,
        screenshot: path.relative(process.cwd(), screenshot),
        metrics,
        consoleErrors,
        pageErrors,
        failures,
        status: failures.length ? "FAIL" : "PASS",
      });

      await page.close();
    }

    await context.close();
  }

  return results;
};

const runCheckoutFlow = async (browser) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const failures = [];

  page.on("pageerror", (error) => failures.push(`Page error: ${error.message}`));

  try {
    await page.goto(`${baseUrl}/index.html`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.evaluate(seedStorage, { cart: demoCart, order: demoOrder });

    await page.goto(`${baseUrl}/checkout.html`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await waitForStablePage(page);

    await page.locator("#customer-name").fill("Andy Pratama");
    await page.locator("#customer-phone").fill("081234567890");
    await page.locator("#customer-email").fill("andy@example.test");
    await page.locator("#address-line").fill("Jl. Mulyorejo No. 10");
    await page.locator("#province").selectOption("Jawa Timur");
    await page.locator("#city").selectOption("Surabaya");
    await page.locator("#district").fill("Mulyorejo");
    await page.locator("#postal-code").fill("60115");
    await page.locator(".checkout-consent").click();

    await Promise.all([
      page.waitForURL(/payment\.html\?order=/, { timeout: 10000 }),
      page.locator("#checkout-submit").click(),
    ]);

    await waitForStablePage(page);
    await page.locator("[data-confirm]").first().click();
    await page.waitForURL(/success\.html\?order=/, { timeout: 10000 });
    await waitForStablePage(page);

    const successVisible = await page.locator("#success-layout").isVisible();
    if (!successVisible) failures.push("Success layout did not become visible");

    const paymentUrl = page.url().replace("success.html", "payment.html");
    await page.goto(paymentUrl, { waitUntil: "domcontentloaded" });
    await waitForStablePage(page);

    const recoveryButton = page.locator("#payment-mobile-action");
    if ((await recoveryButton.getAttribute("data-payment-complete")) !== "true") {
      failures.push("Paid payment recovery state was not restored after reload");
    } else {
      await Promise.all([
        page.waitForURL(/success\.html\?order=/, { timeout: 10000 }),
        recoveryButton.click(),
      ]);
    }
  } catch (error) {
    failures.push(error instanceof Error ? error.stack || error.message : String(error));
  }

  await context.close();
  return {
    name: "checkout-payment-success-recovery",
    status: failures.length ? "FAIL" : "PASS",
    failures,
  };
};

const createMarkdown = (results, flow) => {
  const lines = [
    "# UAS Visual Smoke Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "| Viewport | Page | Status | Overflow | Broken images |",
    "|---|---|---:|---:|---:|",
  ];

  for (const result of results) {
    lines.push(
      `| ${result.viewport} | ${result.page} | ${result.status} | ${result.metrics.overflowX}px | ${result.metrics.brokenImages.length} |`,
    );
  }

  lines.push("", "## Checkout flow", "", `Status: **${flow.status}**`);
  if (flow.failures.length) {
    lines.push("", ...flow.failures.map((failure) => `- ${failure}`));
  }

  const failed = results.filter((result) => result.failures.length);
  if (failed.length) {
    lines.push("", "## Failures", "");
    for (const result of failed) {
      lines.push(`### ${result.viewport} / ${result.page}`, "");
      lines.push(...result.failures.map((failure) => `- ${failure}`), "");
    }
  }

  return `${lines.join("\n")}\n`;
};

await fs.mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const results = await runVisualAudit(browser);
  const flow = await runCheckoutFlow(browser);
  const report = { generatedAt: new Date().toISOString(), results, flow };

  await fs.writeFile(
    path.join(outputRoot, "report.json"),
    JSON.stringify(report, null, 2),
    "utf-8",
  );
  await fs.writeFile(
    path.join(outputRoot, "report.md"),
    createMarkdown(results, flow),
    "utf-8",
  );

  const visualFailures = results.reduce(
    (count, result) => count + result.failures.length,
    0,
  );
  const totalFailures = visualFailures + flow.failures.length;
  console.log(createMarkdown(results, flow));
  if (totalFailures) process.exitCode = 1;
} finally {
  await browser.close();
}
