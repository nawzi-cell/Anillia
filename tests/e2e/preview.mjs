import { chromium } from "playwright-core";
import path from "node:path";

const CHROME =
  process.env.CHROME_PATH ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const route = process.argv[2] || "/";
const width = Number(process.argv[3] || 1440);
const height = Number(process.argv[4] || 1000);
const name = process.argv[5] || `preview-${width}`;
const mode = process.argv[6] || "full";
const selector = process.argv[7] || "";

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({
  viewport: { width, height },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 45000 });
if (mode === "full") {
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.round(window.innerHeight * 0.6);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await sleep(200);
    }
    window.scrollTo(0, document.body.scrollHeight);
    await sleep(600);
    window.scrollTo(0, 0);
  });
  await page
    .waitForFunction(
      () => Array.from(document.images).every((img) => img.complete),
      { timeout: 30000 },
    )
    .catch(() => {});
  await page.waitForTimeout(2500);
}
if (selector) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
}
await page.waitForTimeout(1200);
const imageStats = await page.evaluate(() => {
  const imgs = Array.from(document.images);
  return {
    total: imgs.length,
    broken: imgs
      .filter((img) => img.complete && img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src),
    pending: imgs.filter((img) => !img.complete).map((img) => img.currentSrc || img.src),
  };
});
await page.screenshot({
  path: path.join("tests/e2e/artifacts", `${name}.png`),
  fullPage: mode === "full" && !selector,
});
console.log(
  JSON.stringify(
    {
      name,
      width,
      url: page.url(),
      scrollWidth: await page.evaluate(() => document.documentElement.scrollWidth),
      clientWidth: await page.evaluate(() => document.documentElement.clientWidth),
      images: imageStats,
      errors,
    },
    null,
    2,
  ),
);
await browser.close();
