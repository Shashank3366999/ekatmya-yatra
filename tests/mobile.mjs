/**
 * Mobile-first audit.
 *
 * The phone is the primary surface — most Shankardoots will use this one-handed
 * in the field — so these are the properties that make it feel like an app
 * rather than a shrunken website:
 *
 *   pnpm test:mobile
 */
import { chromium } from "playwright";

const B = process.env.BASE_URL ?? "http://localhost:3200";
const pass = [], fail = [];
const ok = (c, n, extra = "") => (c ? pass : fail).push(n + (extra ? ` — ${extra}` : ""));

const browser = await chromium.launch({ channel: "chrome" });
// A small, common Android viewport with a touch screen.
const ctx = await browser.newContext({
  viewport: { width: 360, height: 740 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
});
const page = await ctx.newPage();

/* ------------------------------------------------------ installable app */
await page.goto(`${B}/`, { waitUntil: "networkidle" });

const manifest = await page.evaluate(async () => {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return null;
  const r = await fetch(link.getAttribute("href"));
  return r.ok ? r.json() : null;
});
ok(Boolean(manifest), "a web app manifest is served");
ok(manifest?.display === "standalone", "opens standalone when installed", manifest?.display);
ok((manifest?.icons ?? []).some((i) => i.sizes === "192x192"), "has a 192px icon");
ok((manifest?.icons ?? []).some((i) => i.sizes === "512x512"), "has a 512px icon");
ok(
  (manifest?.icons ?? []).some((i) => i.purpose === "maskable"),
  "has a maskable icon for Android",
);
ok((manifest?.shortcuts ?? []).length > 0, "declares home-screen shortcuts");

const meta = await page.evaluate(() => ({
  apple: !!document.querySelector('link[rel="apple-touch-icon"]'),
  theme: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
  fit: /viewport-fit=cover/.test(
    document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? "",
  ),
}));
ok(meta.apple, "links an apple-touch-icon");
ok(Boolean(meta.theme), "sets a theme colour for the browser chrome", meta.theme);
ok(meta.fit, "uses viewport-fit=cover so it can draw under the notch");

/* ------------------------------------------------------- touch behaviour */
const touch = await page.evaluate(() => {
  const cs = getComputedStyle(document.body);
  const a = document.querySelector("a");
  return {
    highlight: cs.webkitTapHighlightColor,
    noSideScroll: document.documentElement.scrollWidth <= window.innerWidth + 1,
    action: a ? getComputedStyle(a).touchAction : null,
  };
});
ok(
  /rgba\(0, 0, 0, 0\)|transparent/.test(touch.highlight),
  "no grey tap-flash on touch",
  touch.highlight,
);
ok(touch.noSideScroll, "landing does not scroll sideways");
ok(touch.action === "manipulation", "links avoid the 300ms tap delay", String(touch.action));

/* ----------------------------------------------- one-handed reachability */
async function login(email) {
  await page.goto(`${B}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill("Yatra@2026");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForTimeout(2600);
}
await login("survey.kerala@ekatmadham.com");

for (const [path, label] of [
  ["/o", "organiser dashboard"],
  ["/o/survey/new", "survey form"],
  ["/home", "user home"],
  ["/yatra", "yatra"],
]) {
  await page.goto(B + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  const r = await page.evaluate(() => {
    /*
      Two navs share this label — the desktop header row (display:none here)
      and the bottom tab bar. Pick the sticky one, not whichever comes first.
    */
    const nav = [...document.querySelectorAll('nav[aria-label="Primary"]')].find(
      (n) => getComputedStyle(n).position === "sticky",
    );
    const navBox = nav?.getBoundingClientRect();
    const small = [];
    for (const el of document.querySelectorAll(
      'a, button, [role="button"], input[type="checkbox"], input[type="radio"]',
    )) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      // Radios/checkboxes are visually hidden behind a label; measure the label.
      if (el.tagName === "INPUT") continue;
      /*
        Map markers are a few pixels across by design: the map resolves a tap to
        the nearest stop through an overlay rather than sizing each marker up,
        which made neighbours unhittable. responsive.mjs tests that behaviour.
      */
      if (el.ownerSVGElement || el.namespaceURI === "http://www.w3.org/2000/svg") continue;
      if (b.height < 36) small.push(`${(el.textContent || el.ariaLabel || "").trim().slice(0, 16)}=${Math.round(b.height)}`);
    }
    return {
      navPinnedToBottom: navBox ? navBox.bottom >= window.innerHeight - 2 : false,
      small: small.slice(0, 4),
      sideScroll: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  ok(r.navPinnedToBottom, `${label}: tab bar sits in thumb reach`);
  ok(r.small.length === 0, `${label}: every control at least 36px tall`, r.small.join(", "));
  ok(r.sideScroll <= 1, `${label}: no sideways scroll`, `${r.sideScroll}px`);
}

/* ------------------------------------------- the form works by thumb */
await page.goto(`${B}/o/survey/new`, { waitUntil: "networkidle" });
await page.getByLabel("Name of the place").fill("Thumb test temple");
await page.getByRole("button", { name: "Next", exact: true }).tap();
await page.waitForTimeout(400);
const onStep2 = await page.getByLabel("Significance to the Yatra").isVisible();
ok(onStep2, "survey form advances on a real tap");

const inputFont = await page.evaluate(() => {
  const i = document.querySelector("textarea, input");
  return i ? parseFloat(getComputedStyle(i).fontSize) : 0;
});
// Under 16px, iOS Safari zooms the page when a field is focused.
ok(inputFont >= 16, "inputs are >=16px so iOS does not zoom on focus", `${inputFont}px`);

/* ------------------------------------------- decoration must scale down */
/*
  A signed-in visitor is redirected off the landing page, so this needs its own
  context. The earlier version reused the logged-in page and silently checked
  the organiser dashboard instead — two assertions never ran.
*/
const publicCtx = await browser.newContext({
  viewport: { width: 360, height: 740 },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 2,
});
const landing = await publicCtx.newPage();
await landing.goto(`${B}/`, { waitUntil: "networkidle" });
await landing.waitForTimeout(1100);
ok(new URL(landing.url()).pathname === "/", "landing page is reachable when signed out");

const deco = await landing.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll("svg")) {
    const b = el.getBoundingClientRect();
    if (b.width === 0) continue;
    // Purely decorative artwork only; icons are small by definition.
    if (!el.hasAttribute("aria-hidden") || b.width < 60) continue;
    out.push({
      cls: String(el.className.baseVal || "").slice(0, 24),
      ratio: +(b.width / window.innerWidth).toFixed(2),
    });
  }
  return out;
});
const tooBig = deco.filter((d) => d.ratio > 1);
ok(
  tooBig.length === 0,
  "decorative artwork never exceeds the screen width",
  tooBig.map((d) => `${d.cls}=${d.ratio}x`).join(", "),
);

const heroFit = await landing.evaluate(() => {
  const img = document.querySelector('img[alt*="Statue of Oneness"]');
  const h1 = document.querySelector("h1");
  if (!img || !h1) return null;
  const ib = img.getBoundingClientRect();
  const hb = h1.getBoundingClientRect();
  return {
    // On a phone the statue gets its own band; copy must not sit over it.
    overlap: Math.max(0, Math.min(ib.bottom, hb.bottom) - Math.max(ib.top, hb.top)),
    headingAboveFold: hb.bottom <= window.innerHeight,
  };
});
if (heroFit) {
  ok(
    heroFit.overlap === 0,
    "hero copy does not sit on top of the statue on a phone",
    `${Math.round(heroFit.overlap)}px overlap`,
  );
  ok(heroFit.headingAboveFold, "hero heading is above the fold");
}

await publicCtx.close();
await browser.close();

console.log(`\n=== mobile audit: ${pass.length} passed, ${fail.length} failed ===`);
if (fail.length) {
  console.log("\nFAILURES:");
  for (const f of fail) console.log("  ✗ " + f);
} else {
  console.log("all clear");
}
process.exit(fail.length ? 1 : 0);
