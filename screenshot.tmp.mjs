// Temporary verification: screenshot at mobile + desktop, check header overflow.
import { chromium } from "@playwright/test";

const url = process.env.SHOT_URL ?? "http://localhost:3000";
const browser = await chromium.launch();

for (const [name, width, height] of [
  ["mobile", 390, 844],
  ["desktop", 1600, 900],
]) {
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`[error] ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}`));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(7000);

  // Measure header overflow: scrollWidth vs clientWidth of the header's button row
  const overflow = await page.evaluate(() => {
    const header = document.querySelector("header");
    const row = header?.querySelector("div.pointer-events-auto.flex.items-center.gap-1\\.5");
    const el = row ?? header;
    return {
      docScroll: document.documentElement.scrollWidth,
      docClient: document.documentElement.clientWidth,
      rowScroll: el ? el.scrollWidth : -1,
      rowClient: el ? el.clientWidth : -1,
    };
  });
  await page.screenshot({ path: `shot-${name}.png` });
  await page.close();
  console.log(
    `${name} (${width}px): docScroll=${overflow.docScroll} docClient=${overflow.docClient} ` +
      `rowScroll=${overflow.rowScroll} rowClient=${overflow.rowClient} ` +
      `horizOverflow=${overflow.docScroll > overflow.docClient}`,
  );
  if (errors.length) console.log("  errors:", errors.join(" | "));
}

await browser.close();