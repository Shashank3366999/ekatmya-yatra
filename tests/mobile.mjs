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
/*
  The landing hero streams a 120-second video, so the network never goes idle
  there: waiting for "networkidle" on "/" times out at 30s. Wait for "load" and
  then settle by hand. Every other page still waits for idle.
*/
const LANDING_WAIT = { waitUntil: "load" };
const IDLE_WAIT = { waitUntil: "networkidle" };
const waitFor = (path) => (path === "/" || path.endsWith("//") ? LANDING_WAIT : IDLE_WAIT);
async function settle(p, path, ms = 1800) {
  if (waitFor(path) === LANDING_WAIT) await p.waitForTimeout(ms);
}

const pass = [], fail = [];
/** ok(condition, name, extra?) — condition first in this suite. */
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
await page.goto(`${B}/`, LANDING_WAIT);
await page.waitForTimeout(1800);

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

/* --------------------------------------------------------- the sign-in screen */
{
  await page.goto(`${B}/login`, { waitUntil: "load" });
  await page.waitForTimeout(1600);

  const l = await page.evaluate(() => {
    const bg = document.querySelector('img[src*="login-bg"]');
    const panel = document.querySelector(".glass-panel");
    const submit = document.querySelector('button[type="submit"]');
    const input = document.querySelector('input[type="email"]');
    const label = document.querySelector("label");

    /* Relative luminance, to check type against its own ground rather than by eye. */
    const lum = (c) => {
      const [r, g, b] = (c.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
      const f = (v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };

    /*
      The input's OWN computed background, not a guessed constant. An earlier
      version of this check compared the input's text colour against a
      hard-coded "rgb(40,40,44)" meant to approximate the panel behind it —
      which is what let a real bug through: HeroUI's focused and invalid field
      backgrounds come from tokens (--field-focus, by way of --field-hover /
      --field-border-*) that are separate from --field-background and were
      never overridden for the panel, so a focused, invalid email input
      rendered a white background under white text. Reading the element's
      actual `background-color` in each state is what catches that; a fixed
      guess cannot.
    */
    const bgOf = (el) => (el ? getComputedStyle(el).backgroundColor : null);
    return {
      hasPhoto: Boolean(bg) && bg.complete && bg.naturalWidth > 0,
      hasPanel: Boolean(panel),
      /* The primary action inverts to white-on-ink over a photograph. */
      submitBg: submit ? getComputedStyle(submit).backgroundColor : null,
      submitContrast: submit
        ? ratio(getComputedStyle(submit).backgroundColor, getComputedStyle(submit).color)
        : 0,
      labelContrast: label ? ratio(getComputedStyle(label).color, bgOf(panel)) : 0,
      inputContrast: input ? ratio(getComputedStyle(input).color, bgOf(input)) : 0,
      inputBg: bgOf(input),
      /* The reference is one screen: no scrolling to reach the button. */
      fitsOneScreen:
        document.documentElement.scrollHeight <= window.innerHeight + 2,
      noSideScroll: document.documentElement.scrollWidth <= window.innerWidth + 1,
      emblem: Boolean(document.querySelector('svg[aria-label="Ekatma Yatra"]')),
    };
  });

  ok(l.hasPhoto, "sign-in renders its background photograph");
  ok(l.hasPanel, "sign-in form sits on the glass panel");
  ok(l.emblem, "sign-in carries the Yatra emblem");
  ok(
    l.submitBg === "rgb(255, 255, 255)",
    "the primary action inverts to solid white over the photograph",
    String(l.submitBg),
  );
  /*
    These ratios are the reason the panel exists. The fields are HeroUI's and
    take their colours from CSS variables, so a light-theme token leaking in
    here would render white-on-white and pass every structural check.
  */
  ok(l.submitContrast >= 4.5, "primary action text is legible", l.submitContrast.toFixed(1));
  ok(l.labelContrast >= 4.5, "field labels are legible on the panel", l.labelContrast.toFixed(1));
  ok(l.inputContrast >= 4.5, "typed input is legible at rest", l.inputContrast.toFixed(1));
  ok(l.fitsOneScreen, "sign-in fits one phone screen without scrolling");
  ok(l.noSideScroll, "sign-in does not scroll sideways");

  /*
    Focused, and focused-while-invalid: the two states a hard-coded background
    guess could never catch, and the exact state a visitor hits by tapping the
    email field and then submitting it empty. Submit first, so data-invalid is
    already true when the field is refocused.
  */
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForTimeout(500);

  const email = page.locator('input[type="email"]');
  await email.click();
  await page.waitForTimeout(250);
  const focusedInvalid = await email.evaluate((el) => {
    const lum = (c) => {
      const [r, g, b] = (c.match(/[\d.]+/g) || [0, 0, 0]).slice(0, 3).map(Number);
      const f = (v) => {
        const x = v / 255;
        return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const cs = getComputedStyle(el);
    return {
      invalid: el.getAttribute("data-invalid") ?? el.getAttribute("aria-invalid"),
      bg: cs.backgroundColor,
      color: cs.color,
      contrast: ratio(cs.color, cs.backgroundColor),
    };
  });
  ok(
    focusedInvalid.invalid === "true" || focusedInvalid.invalid === true,
    "the email field actually reached the invalid state for this check",
    String(focusedInvalid.invalid),
  );
  ok(
    focusedInvalid.contrast >= 4.5,
    "typed input is legible while focused and invalid",
    `${focusedInvalid.contrast.toFixed(1)} — bg ${focusedInvalid.bg}, text ${focusedInvalid.color}`,
  );
}

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
  await page.goto(B + path, waitFor(path));
  await settle(page, path);
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
await landing.goto(`${B}/`, LANDING_WAIT);
await landing.waitForTimeout(1800);
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

/* ------------------------------------------------- the hero background */
const hero = await landing.evaluate(() => {
  const v = document.querySelector("video");
  const h1 = document.querySelector("h1");
  if (!v || !h1) return null;
  const vb = v.getBoundingClientRect();
  const hb = h1.getBoundingClientRect();
  return {
    src: (v.currentSrc || v.getAttribute("src") || "").split("/").pop(),
    hasPoster: Boolean(v.poster),
    muted: v.muted,
    inline: v.playsInline,
    coversHero: vb.width >= window.innerWidth - 2,
    headingAboveFold: hb.bottom <= window.innerHeight,
    // A scrim must sit between the film and the copy, or text is unreadable
    // over a moving image.
    scrims: document.querySelectorAll("header .bg-gradient-to-t, header .bg-gradient-to-r").length,
    // The film is wallpaper: no controls of ours, and none of the browser's.
    controls: v.controls || Boolean(document.querySelector('button[aria-label*="film"]')),
  };
});

if (hero) {
  /*
    Guards the measurement that mattered: pointing the hero at the full 86 MB
    film pulled 64 MB in eight seconds, because capping playback position does
    not stop the browser buffering ahead. The hero must use a trimmed file, and
    at this viewport specifically the phone rendition rather than the desktop
    one — the <source media> query is the only thing separating 3.2 MB from
    5.3 MB on a phone, and a wrong breakpoint fails silently.
  */
  ok(
    hero.src === "intro-sm.mp4",
    "hero uses the phone rendition of the two-minute intro",
    hero.src,
  );
  ok(hero.hasPoster, "hero video has a poster so first paint is an image");
  ok(hero.muted && hero.inline, "hero video is muted and plays inline");
  ok(hero.coversHero, "hero video spans the viewport width");
  ok(hero.scrims >= 2, "scrims sit between the film and the copy", `${hero.scrims}`);
  ok(!hero.controls, "the background film carries no controls");
  ok(hero.headingAboveFold, "hero heading is above the fold");
}

/* The 86 MB film is no longer shipped at all — only its opening two minutes. */
const filmBytes = await landing.evaluate(() =>
  performance
    .getEntriesByType("resource")
    .filter((r) => r.name.includes("ekatma-dham-journey"))
    .reduce((a, r) => a + (r.transferSize || 0), 0),
);
ok(filmBytes === 0, "the 86 MB film is not downloaded on page load", `${filmBytes} bytes`);
ok(
  !(await landing.content()).includes("ekatma-dham-journey"),
  "the landing page does not reference the full film",
);

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
