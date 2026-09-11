/**
 * Responsive audit.
 *
 * Checks the things that actually break when a layout is only designed at one
 * width: horizontal overflow, elements wider than the viewport, navigation
 * swapping correctly between the bottom bar and the header, the admin sidebar
 * becoming a drawer, tap-target sizes on a phone, and multi-column layouts
 * genuinely going side by side on a laptop.
 *
 *   pnpm build && PORT=3200 pnpm start
 *   pnpm test:responsive
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

const WIDTHS = [
  { w: 390, h: 844, name: "phone" },
  { w: 768, h: 1024, name: "tablet" },
  { w: 1024, h: 900, name: "laptop-sm" },
  { w: 1440, h: 950, name: "laptop" },
  { w: 1920, h: 1080, name: "desktop" },
];

const pass = [], fail = [];
/** ok(condition, name, extra?) — condition first in this suite. */
const ok = (c, n, extra = "") => (c ? pass : fail).push(n + (extra ? ` — ${extra}` : ""));

const browser = await chromium.launch({ channel: "chrome" });

async function login(ctx, email) {
  const p = await ctx.newPage();
  await p.goto(`${B}/login`, { waitUntil: "networkidle" });
  await p.getByLabel("Email address").fill(email);
  await p.getByLabel("Password").fill("Yatra@2026");
  await p.getByRole("button", { name: /sign in/i }).click();
  await p.waitForTimeout(2600);
  return p;
}

/** Horizontal overflow + any element sticking out past the viewport. */
async function checkOverflow(p, label, width) {
  const r = await p.evaluate((vw) => {
    const doc = document.documentElement;
    const overflow = doc.scrollWidth - doc.clientWidth;
    const wide = [];
    for (const el of document.querySelectorAll("body *")) {
      const b = el.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      const style = getComputedStyle(el);
      if (style.position === "fixed") continue;
      // Allow deliberate horizontal scrollers (tables, code, map rails).
      // Skip anything inside a deliberate scroller or a clipping container:
      // both contain their children, so a wide child is not a layout bug.
      let contained = false;
      for (let a = el; a && a !== document.body; a = a.parentElement) {
        const s = getComputedStyle(a);
        if (["auto", "scroll", "hidden", "clip"].includes(s.overflowX)) { contained = true; break; }
      }
      if (contained) continue;
      if (b.right > vw + 2 || b.left < -2) {
        wide.push(`${el.tagName.toLowerCase()}.${(el.className || "").toString().slice(0, 40)}`);
      }
    }
    return { overflow, wide: wide.slice(0, 3) };
  }, width);

  ok(r.overflow <= 1, `${label} @${width}: no horizontal scroll`, `overflow=${r.overflow}px`);
  ok(r.wide.length === 0, `${label} @${width}: nothing past the viewport`, r.wide.join(" | "));
}

const visible = (p, sel) =>
  p.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return false;
    const b = el.getBoundingClientRect();
    return b.width > 0 && b.height > 0 && getComputedStyle(el).display !== "none";
  }, sel);

/* ------------------------------------------- user + organiser app navigation */
for (const { w, h, name } of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await login(ctx, "survey.kerala@ekatmadham.com");
  const desktop = w >= 1024;

  for (const [path, label] of [["/home", "home"], ["/yatra", "yatra"], ["/events", "events"], ["/journey", "journey"], ["/o", "o-dash"], ["/o/survey/new", "o-form"]]) {
    await p.goto(B + path, waitFor(path));
    await settle(p, path);
    await p.waitForTimeout(500);
    await checkOverflow(p, label, w);
  }

  /*
    The User and Organiser apps keep the phone layout at every screen size —
    the brief asks for exactly this ("keep the mobile screen for volunteer app
    and user app, but keep the admin app more on web"). So instead of a
    breakpoint swap, assert the app shell: bottom tabs always, one column
    always, and the column capped so it never sprawls on a laptop.
  */
  await p.goto(`${B}/home`, { waitUntil: "networkidle" });
  await p.waitForTimeout(400);

  const shell = await p.evaluate(() => {
    const nav = [...document.querySelectorAll('nav[aria-label="Primary"]')].find(
      (n) => getComputedStyle(n).position === "sticky",
    );
    const main = document.querySelector("main");
    return {
      navs: document.querySelectorAll('nav[aria-label="Primary"]').length,
      tabsVisible: nav ? nav.getBoundingClientRect().height > 0 : false,
      tabsAtBottom: nav
        ? Math.abs(nav.getBoundingClientRect().bottom - window.innerHeight) < 2
        : false,
      columnWidth: main ? Math.round(main.getBoundingClientRect().width) : 0,
      centred: main
        ? Math.abs(
            main.getBoundingClientRect().left -
              (window.innerWidth - main.getBoundingClientRect().width) / 2,
          ) < 3
        : false,
    };
  });

  ok(shell.navs === 1, `${name}: exactly one primary nav`, `${shell.navs}`);
  ok(shell.tabsVisible, `${name}: bottom tabs present`);
  ok(shell.tabsAtBottom, `${name}: bottom tabs pinned to the viewport`);
  ok(
    shell.columnWidth <= 481,
    `${name}: app column stays phone-width`,
    `${shell.columnWidth}px`,
  );
  if (w > 640) {
    ok(shell.centred, `${name}: app column is centred on a wide screen`);
  }

  // One column at every width — no desktop-only grid inside the app column.
  const cols = await p.evaluate(() => {
    const h2s = [...document.querySelectorAll("h2")];
    const route = h2s.find((x) => x.textContent.trim() === "The route");
    const events = h2s.find((x) => x.textContent.trim() === "Upcoming events");
    if (!route || !events) return null;
    return Math.abs(
      route.getBoundingClientRect().top - events.getBoundingClientRect().top,
    );
  });
  if (cols !== null) {
    ok(cols > 12, `${name}: home stays single column`, `Δy=${Math.round(cols)}`);
  }

  // The Yatra page stacks map above itinerary at every width.
  await p.goto(`${B}/yatra`, { waitUntil: "networkidle" });
  await p.waitForTimeout(500);
  const maps = await p.evaluate(
    () => document.querySelectorAll("svg[aria-label*='Map of India']").length,
  );
  ok(maps === 1, `${name}: yatra renders exactly one map`, `${maps}`);

  const stacked = await p.evaluate(() => {
    const svg = document.querySelector("svg[aria-label*='Map of India']");
    const h2 = [...document.querySelectorAll("h2")].find(
      (x) => x.textContent.trim() === "Itinerary",
    );
    if (!svg || !h2) return null;
    return h2.getBoundingClientRect().top - svg.getBoundingClientRect().bottom;
  });
  if (stacked !== null) {
    ok(stacked > -40, `${name}: yatra stacks map above itinerary`);
  }

  // Phone: tap targets and marker hit areas
  if (w === 390) {
    const small = await p.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll('nav[aria-label="Primary"] a, button[type="submit"]')) {
        const b = el.getBoundingClientRect();
        if (b.height > 0 && b.height < 40) {
          const what = (el.textContent || "").trim().slice(0, 22) || el.getAttribute("aria-label") || el.tagName;
          bad.push(`"${what}"=${Math.round(b.height)}px`);
        }
      }
      return bad.slice(0, 4);
    });
    ok(small.length === 0, "phone: nav and submit targets >= 40px tall", small.join(", "));

    /*
      Markers are only ~4px across at phone width, so the map resolves a tap to
      the nearest stop via an overlay rather than giving each marker a big
      invisible circle (those overlapped and swallowed neighbours). Test the
      behaviour: tapping 8px off a marker must still select it.
    */
    const target = await p.evaluate(() => {
      const g = document.querySelector('svg g[role="button"]');
      if (!g) return null;
      const b = g.getBoundingClientRect();
      return { x: b.left + b.width / 2, y: b.top + b.height / 2, name: g.getAttribute("aria-label") };
    });
    if (target) {
      await p.mouse.click(target.x + 8, target.y + 8);
      await p.waitForTimeout(500);
      const picked = await p.evaluate(() => document.querySelector(".map-tip")?.textContent ?? "");
      // Assert that a stop was selected, not which one: two genuine stops can
      // sit a few viewBox units apart (Kalady and Chottanikkara are ~26 km),
      // so the true nearest may be the neighbour. Selecting *something*
      // sensible is the property that matters.
      ok(
        picked.trim().length > 0,
        "phone: tapping near a marker selects a stop",
        `tapped near "${target.name}" -> "${picked.slice(0, 30)}"`,
      );
    }
  }

  await ctx.close();
}

/* --------------------------------------------------------- admin navigation */
for (const { w, h, name } of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await login(ctx, "admin@ekatmadham.com");
  const desktop = w >= 1024;

  for (const [path, label] of [["/admin", "admin"], ["/admin/surveys", "inbox"], ["/admin/users", "users"], ["/admin/organizers", "orgs"], ["/admin/route", "route"], ["/admin/reports", "reports"], ["/admin/automations", "autom"], ["/admin/announcements", "annc"]]) {
    await p.goto(B + path, waitFor(path));
    await settle(p, path);
    await p.waitForTimeout(500);
    await checkOverflow(p, label, w);
  }

  await p.goto(`${B}/admin`, { waitUntil: "networkidle" });
  const sidebar = await visible(p, "aside");
  const burger = await p.getByRole("button", { name: "Open navigation" }).count();
  const burgerVisible = burger > 0 && (await p.getByRole("button", { name: "Open navigation" }).first().isVisible());

  ok(desktop ? sidebar : !sidebar, `${name}: admin sidebar ${desktop ? "shown" : "hidden"}`);
  ok(desktop ? !burgerVisible : burgerVisible, `${name}: admin ${desktop ? "no hamburger" : "hamburger shown"}`);

  // Drawer must expose every section on a phone
  if (!desktop) {
    await p.getByRole("button", { name: "Open navigation" }).first().click();
    await p.waitForTimeout(400);
    const links = await p.evaluate(() =>
      [...document.querySelectorAll('nav[aria-label="Admin sections"] a')]
        .filter((a) => a.getBoundingClientRect().height > 0).length,
    );
    ok(links === 8, `${name}: drawer lists all 8 sections`, `${links}`);
    await p.keyboard.press("Escape");
    await p.waitForTimeout(300);
    const stillOpen = await p.evaluate(() => !!document.querySelector('nav[aria-label="Admin sections"]')?.getBoundingClientRect().height);
    ok(!stillOpen, `${name}: drawer closes on Escape`);
  }

  // Users: table on desktop, cards on phone
  await p.goto(`${B}/admin/users`, { waitUntil: "networkidle" });
  const tableShown = await p.evaluate(() => !!document.querySelector("table")?.getBoundingClientRect().height);
  ok(desktop ? tableShown : !tableShown, `${name}: users ${desktop ? "table" : "cards"}`);

  await ctx.close();
}

/* ------------------------------------------------------------ public pages */
for (const { w, h, name } of WIDTHS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  for (const [path, label] of [["/", "landing"], ["/login", "login"], ["/register", "register"], ["/register/organizer", "reg-org"]]) {
    await p.goto(B + path, waitFor(path));
    await settle(p, path);
    await p.waitForTimeout(500);
    await checkOverflow(p, label, w);
  }
  await ctx.close();
}

await browser.close();

console.log(`\n=== responsive audit: ${pass.length} passed, ${fail.length} failed ===`);
if (fail.length) {
  console.log("\nFAILURES:");
  for (const f of fail) console.log("  ✗ " + f);
} else {
  console.log("all clear");
}
process.exit(fail.length ? 1 : 0);
