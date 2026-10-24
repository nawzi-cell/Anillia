/**
 * Browser smoke test + responsive/console audit.
 *
 * Prerequisites:
 *   - `npm run dev` (or `npm start` after a build) on E2E_BASE_URL
 *   - a seeded database, with DEMO_PASSWORD and admin credentials in .env
 *
 * Run:
 *   node --env-file=.env tests/e2e/smoke.mjs
 *
 * Screenshots land in tests/e2e/artifacts/. The script exits non-zero when a
 * functional/layout check fails; console noise is reported but not fatal.
 */
import { chromium } from "playwright-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const OUT = path.resolve("tests/e2e/artifacts");
const CHROME =
  process.env.CHROME_PATH ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

const CUSTOMER_EMAIL = process.env.E2E_CUSTOMER_EMAIL || "customer@example.com";
const CUSTOMER_PASSWORD = process.env.DEMO_PASSWORD;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const failures = [];
const consoleErrors = [];
const expected401s = [];
const layouts = [];

function fail(check, detail) {
  failures.push({ check, detail });
}

async function screenshot(page, name) {
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage: true,
  });
}

async function visit(page, route, name, expectedText) {
  const response = await page.goto(`${BASE}${route}`, {
    waitUntil: "networkidle",
    timeout: 45_000,
  });
  if (!response || response.status() >= 400) {
    fail(`HTTP ${route}`, `status=${response?.status()}`);
    return;
  }
  if (expectedText) {
    const body = await page.locator("body").innerText();
    if (!body.toLowerCase().includes(expectedText.toLowerCase())) {
      fail(`Content ${route}`, `missing text "${expectedText}"`);
    }
  }
  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src)
      .slice(0, 5),
  );
  if (broken.length > 0) fail(`Images ${route}`, broken.join(", "));
  if (name) await screenshot(page, name);
}

async function login(page, email, password) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.startsWith("/login"), {
      timeout: 30_000,
    }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
}

async function main() {
  if (!CUSTOMER_PASSWORD) {
    console.log("SKIP: DEMO_PASSWORD is not set; customer flow not tested.");
  }
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({
    executablePath: CHROME,
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      locale: "en-PK",
      timezoneId: "Asia/Karachi",
    });
    const page = await context.newPage();
    page.on("console", (msg) => {
      if (msg.type() !== "error") return;
      // Logged-out sessions probe /api/auth/me, /api/cart and /api/wishlist;
      // a 401 from those probes is expected, not a UI failure.
      if (/status of 401/i.test(msg.text())) expected401s.push(msg.text());
      else consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(String(err)));

    // --- Responsive layout sweep -----------------------------------------
    for (const width of [375, 390, 430, 768, 1024, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
      const metrics = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      const overflow = metrics.scrollWidth - metrics.clientWidth;
      layouts.push({ route: "/", width, overflow });
      if (overflow > 1) {
        fail(`Horizontal overflow / @${width}`, `${overflow}px`);
      }
      if ([375, 768, 1440].includes(width)) {
        await screenshot(page, `home-${width}`);
      }
    }

    // --- Storefront pages ------------------------------------------------
    await page.setViewportSize({ width: 1440, height: 900 });
    await visit(page, "/", "home", "ANILLIÉA");
    await visit(page, "/shop", "shop", "shop");
    await visit(page, "/product/crinkle-georgette-hijab", "product", "Crinkle");
    await visit(page, "/journal", "journal");
    await visit(page, "/collections", "collections");
    await visit(page, "/contact", "contact");
    await visit(page, "/wishlist", "wishlist");

    // PDP at mobile width: no horizontal overflow.
    await page.setViewportSize({ width: 375, height: 900 });
    await page.goto(`${BASE}/product/crinkle-georgette-hijab`, {
      waitUntil: "networkidle",
    });
    const pdpOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    layouts.push({ route: "/product/:slug", width: 375, overflow: pdpOverflow });
    if (pdpOverflow > 1) {
      fail("Horizontal overflow /product @375", `${pdpOverflow}px`);
    }
    await screenshot(page, "product-375");

    // --- Customer journey: login persists across a reload ---------------
    if (CUSTOMER_PASSWORD) {
      await page.setViewportSize({ width: 1440, height: 900 });
      await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
      await page.reload({ waitUntil: "networkidle" });
      await page.goto(`${BASE}/account`, { waitUntil: "networkidle" });
      const accountBody = await page.locator("body").innerText();
      if (/sign in to your anilliéa account/i.test(accountBody)) {
        fail("Session persistence", "account page shows the logged-out login prompt");
      }
      await screenshot(page, "account");

      // Add an in-stock item to the cart through the UI.
      await page.goto(`${BASE}/product/crinkle-georgette-hijab`, {
        waitUntil: "networkidle",
      });
      const colour = page.getByRole("button", { name: /select colour taupe/i });
      if (await colour.count()) await colour.first().click();
      const size = page.getByRole("button", { name: /^one size$/i });
      if (await size.count()) await size.first().click();
      const add = page.getByRole("button", { name: /add to bag/i });
      if (!(await add.count())) {
        fail("Add to cart", "no Add to bag button found");
      } else {
        await add.first().click();
        await page.waitForTimeout(1_500);
        const cartLabel = await page
          .getByRole("button", { name: /cart, \d+ items?/i })
          .first()
          .getAttribute("aria-label")
          .catch(() => null);
        if (!cartLabel || /cart, 0 items/i.test(cartLabel)) {
          fail("Add to cart", `cart badge did not update (${cartLabel})`);
        }
        await page.goto(`${BASE}/cart`, { waitUntil: "networkidle" });
        const cartBody = await page.locator("body").innerText();
        if (!/crinkle georgette hijab/i.test(cartBody)) {
          fail("Cart page", "added product is not listed");
        }
        await screenshot(page, "cart");
        // Clean up so repeated runs do not accumulate quantity.
        await page.evaluate(async () => {
          const res = await fetch("/api/cart", {
            headers: { accept: "application/json" },
          });
          const json = await res.json().catch(() => null);
          for (const item of json?.data?.items ?? []) {
            await fetch(`/api/cart/items/${item.id}`, { method: "DELETE" });
          }
        });
      }
      await context.clearCookies();
    }

    // --- Admin journey ---------------------------------------------------
    if (ADMIN_EMAIL && ADMIN_PASSWORD) {
      const adminContext = await browser.newContext({
        viewport: { width: 1440, height: 900 },
      });
      const admin = await adminContext.newPage();
      const admin401Paths = [];
      admin.on("response", (res) => {
        if (res.status() === 401) {
          try {
            admin401Paths.push(new URL(res.url()).pathname);
          } catch {
            // Ignore malformed URLs.
          }
        }
      });
      admin.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(`[admin] ${msg.text()}`);
      });
      admin.on("pageerror", (err) => consoleErrors.push(`[admin] ${err}`));
      await login(admin, ADMIN_EMAIL, ADMIN_PASSWORD);
      await admin.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
      const adminBody = await admin.locator("body").innerText();
      if (!/dashboard/i.test(adminBody)) {
        fail("Admin dashboard", "dashboard content missing after admin login");
      }
      await screenshot(admin, "admin-dashboard");
      await visit(admin, "/admin/orders", "admin-orders", "orders");
      await visit(admin, "/admin/products", "admin-products", "products");
      await visit(admin, "/admin/inventory", "admin-inventory", "adjust quantity");
      if (admin401Paths.length > 0) {
        console.log(
          `Admin-context 401 response paths: ${[...new Set(admin401Paths)].join(", ")}`,
        );
      }
      await adminContext.close();
    } else {
      console.log("SKIP: admin credentials are not set; admin UI not tested.");
    }

    await context.close();
  } finally {
    await browser.close();
  }

  console.log("\nResponsive sweep:");
  for (const l of layouts) {
    console.log(`  ${l.route} @${l.width}px — overflow ${l.overflow}px`);
  }
  console.log(
    `\nConsole/page errors: ${consoleErrors.length} (plus ${expected401s.length} expected logged-out 401s)`,
  );
  for (const e of consoleErrors.slice(0, 15)) console.log(`  • ${e}`);
  if (failures.length > 0) {
    console.log(`\nFAILURES (${failures.length}):`);
    for (const f of failures) console.log(`  ✗ ${f.check}: ${f.detail}`);
    process.exitCode = 1;
  } else {
    console.log("\nAll browser checks passed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
