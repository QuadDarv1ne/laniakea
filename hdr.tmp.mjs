import { chromium } from "playwright";

const URL = "http://localhost:3000/";

async function open(browser, opts) {
  const ctx = await browser.newContext(opts);
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], {
    origin: new URL(URL).origin,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  return { ctx, page, errors };
}

const geom = (page) =>
  page.evaluate(() => {
    const h = document.querySelector("header");
    const r = h.getBoundingClientRect();
    const kids = [...h.querySelectorAll(":scope > div")].map((d) => {
      const b = d.getBoundingClientRect();
      return { top: Math.round(b.top), right: Math.round(b.right), w: Math.round(b.width) };
    });
    return {
      docScrollW: document.documentElement.scrollWidth,
      innerW: window.innerWidth,
      header: { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height) },
      kids,
    };
  });

async function browser() {
  try {
    return await chromium.launch({
      args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
    });
  } catch {
    return await chromium.launch({ channel: "chrome" });
  }
}

const b = await browser();

/* ---------- desktop ---------- */
{
  const { ctx, page, errors } = await open(b, { viewport: { width: 1440, height: 900 } });
  console.log("DESKTOP geom", JSON.stringify(await geom(page)));
  const counts = await page.evaluate(() => {
    const byTitle = (t) => document.querySelectorAll(`header button[title="${t}"]`).length;
    return {
      snapshot: byTitle("Сохранить PNG (горячая клавиша: S)"),
      share: byTitle("Скопировать ссылку на этот вид"),
      ambient: byTitle("Включить космический эмбиент (звук космоса)"),
      tour: byTitle("Сбросить вид и выключить тур"),
      headerButtons: document.querySelectorAll("header button").length,
    };
  });
  console.log("DESKTOP buttons", JSON.stringify(counts));

  // share -> clipboard
  await page.getByTitle("Скопировать ссылку на этот вид").click();
  await page.waitForTimeout(400);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch((e) => "ERR:" + e.message));
  console.log("DESKTOP clipboard has cx:", String(clip).includes("cx="), "| len", String(clip).length);

  // screenshot toast
  await page.getByTitle("Сохранить PNG (горячая клавиша: S)").click();
  await page.waitForTimeout(500);
  const toast = await page.locator("text=Снимок сделан").count();
  console.log("DESKTOP screenshot toast count:", toast);
  await page.screenshot({ path: "h1-desktop.png" });

  // info card hidden by default -> open via menu? check collapsed state on mobile only
  console.log("DESKTOP pageerrors:", errors.length ? JSON.stringify(errors.slice(0, 3)) : "none");
  await ctx.close();
}

/* ---------- mobile ---------- */
{
  const { ctx, page, errors } = await open(b, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 3,
  });
  console.log("MOBILE geom", JSON.stringify(await geom(page)));
  const vis = await page.evaluate(() => {
    const t = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return "missing";
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 ? `${Math.round(r.width)}x${Math.round(r.height)}@${Math.round(r.top)}` : "hidden";
    };
    return {
      share: t('header button[title="Скопировать ссылку на этот вид"]'),
      snapshot: t('header button[title="Сохранить PNG (горячая клавиша: S)"]'),
      infoCard: t("#info-card"),
      ruler: t("#scale-ruler"),
    };
  });
  console.log("MOBILE visible", JSON.stringify(vis));

  // collapsed info card should be closed by default (localStorage cleared by new context)
  await page.evaluate(() => localStorage.setItem("laniakea_onboarding_v1", "1"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2000);
  const cardState = await page.evaluate(() => {
    const c = document.querySelector("#info-card");
    if (!c) return "missing";
    const r = c.getBoundingClientRect();
    return { w: Math.round(r.width), right: Math.round(r.right), innerW: window.innerWidth, open: c.getAttribute("aria-expanded") };
  });
  console.log("MOBILE info-card default", JSON.stringify(cardState));

  // open it via toggle
  const toggle = page.locator("#info-card-toggle");
  if (await toggle.count()) {
    await toggle.click();
    await page.waitForTimeout(400);
    console.log(
      "MOBILE info-card opened",
      JSON.stringify(
        await page.evaluate(() => {
          const c = document.querySelector("#info-card");
          const r = c.getBoundingClientRect();
          return { w: Math.round(r.width), right: Math.round(r.right), innerW: window.innerWidth };
        }),
      ),
    );
  }

  // share tap
  await page.getByTitle("Скопировать ссылку на этот вид").click();
  await page.waitForTimeout(400);
  console.log("MOBILE share toast:", await page.locator("text=Ссылка скопирована").count());
  await page.screenshot({ path: "h2-mobile.png" });
  console.log("MOBILE pageerrors:", errors.length ? JSON.stringify(errors.slice(0, 3)) : "none");
  await ctx.close();
}

await b.close();
console.log("DONE");
