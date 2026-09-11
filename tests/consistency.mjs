/**
 * Cross-page consistency.
 *
 * Catches the class of bug where the same quantity is computed two different
 * ways and the two disagree — e.g. the landing page once showed "22" for Stops
 * while its own map card said "21 stops", because one counted every place on
 * the route and the other only the sequenced itinerary.
 *
 *   pnpm build && PORT=3200 pnpm start
 *   pnpm test:consistency
 */
import { chromium } from "playwright";

const B = process.env.BASE_URL ?? "http://localhost:3200";
const pass = [], fail = [];
const ok = (c, n, extra = "") => (c ? pass : fail).push(n + (extra ? ` — ${extra}` : ""));
const eq = (a, b, n) => ok(a === b && a !== null, n, `${a} vs ${b}`);

const browser = await chromium.launch({ channel: "chrome" });
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


/** Read a stat tile / definition-list figure by its label. */
const STAT = (label) => {
  const wanted = label.toLowerCase();
  for (const el of document.querySelectorAll("p, dt, span")) {
    if ((el.textContent || "").trim().toLowerCase() !== wanted) continue;
    let node = el;
    for (let i = 0; i < 4 && node; i++) {
      node = node.parentElement;
      if (!node) break;
      const v = node.querySelector(".tabular-nums");
      if (v) {
        const n = parseInt((v.textContent || "").replace(/[^0-9]/g, ""), 10);
        if (!Number.isNaN(n)) return n;
      }
    }
  }
  return null;
};

const bodyNum = (re) => {
  const m = document.body.innerText.match(re);
  return m ? parseInt(m[1], 10) : null;
};

async function page(ctx, path) {
  const p = ctx.__page ?? (ctx.__page = await ctx.newPage());
  await p.goto(B + path, waitFor(path));
  await settle(p, path);
  await p.waitForTimeout(700);
  return p;
}

async function login(ctx, email) {
  const p = await page(ctx, "/login");
  await p.getByLabel("Email address").fill(email);
  await p.getByLabel("Password").fill("Yatra@2026");
  await p.getByRole("button", { name: /sign in/i }).click();
  await p.waitForTimeout(2600);
}

const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });

/* ------------------------------------------------- public landing page */
{
  const p = await page(ctx, "/");
  const statStops = await p.evaluate(STAT, "Stops");
  const badgeStops = await p.evaluate(bodyNum, /(\d+)\s+stops/i);
  eq(statStops, badgeStops, "landing: Stops figure matches the map card badge");
  ok(statStops > 0, "landing: stop count is non-zero", `${statStops}`);
  global.landingStops = statStops;

  // Every sequenced stop is a photo card on the journey timeline. The row is a
  // horizontal scroller, so its later cards only load once scrolled into view —
  // walk it before counting, or lazy loading reads as a broken image.
  //
  // Note when testing this check by deleting a file from public/places: the
  // Next image optimizer keeps optimised copies in .next/cache/images and will
  // happily keep serving one whose source is gone. Clear that directory too.
  await p.evaluate(async () => {
    document.querySelector(".snap-row")?.scrollIntoView({ block: "center" });
    const row = document.querySelector(".snap-row");
    if (!row) return;
    for (let x = 0; x <= row.scrollWidth; x += 400) {
      row.scrollTo({ left: x });
      await new Promise((r) => setTimeout(r, 150));
    }
  });
  await p.waitForTimeout(2500);
  const cards = await p.evaluate(() => {
    const articles = [...document.querySelectorAll(".snap-row article")];
    const imgs = articles.flatMap((a) => [...a.querySelectorAll("img")]);
    return {
      articles: articles.length,
      imgs: imgs.length,
      loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
      broken: imgs.filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.alt),
    };
  });
  eq(cards.articles, statStops, "landing: timeline cards match the stop count");
  eq(cards.imgs, statStops, "landing: every timeline card carries a photo");
  eq(cards.loaded, cards.imgs, "landing: every timeline photo loads");
  ok(cards.broken.length === 0, "landing: no broken timeline photos", cards.broken.join(", "));
}
const landingStops = global.landingStops;

/* --------------------------------------------- the Nyas's own facts and links */
{
  const p = await page(ctx, "/");
  const r = await p.evaluate(() => {
    const text = document.body.innerText;
    const figures = [...document.querySelectorAll("dd")]
      .map((d) => parseInt((d.textContent || "").replace(/[^0-9]/g, ""), 10))
      .filter((n) => !Number.isNaN(n));
    return {
      figures,
      /* Every outbound link must be safe and must actually go to the Nyas. */
      outbound: [...document.querySelectorAll('a[href^="http"]')]
        .filter((a) => !a.href.includes("localhost"))
        .map((a) => ({ host: new URL(a.href).host, blank: a.target === "_blank", rel: a.rel })),
      hasAddress: /Shyamla Hills/.test(text) && /462003/.test(text),
      hasPhone: Boolean(document.querySelector('a[href="tel:+917554928869"]')),
    };
  });

  /*
    108 / 54 / 27 are the statue, its pedestal and the lotus base, stated
    identically on the Nyas's home page and its Statue of Oneness page. They are
    someone else's facts printed on our site, so they are pinned here — a typo
    in a number nobody on the team would notice is exactly the kind of error
    this suite exists for.
  */
  for (const n of [108, 54, 27]) {
    ok(r.figures.includes(n), `landing states the Nyas figure ${n}`, r.figures.join(", "));
  }
  ok(r.outbound.length > 0, "landing links out to the Nyas", `${r.outbound.length} links`);
  ok(
    r.outbound.every((l) => /(^|\.)oneness\.org\.in$|twitter\.com|facebook\.com|instagram\.com|youtube\.com/.test(l.host)),
    "every outbound link goes to the Nyas or its own channels",
    [...new Set(r.outbound.map((l) => l.host))].join(", "),
  );
  ok(
    r.outbound.every((l) => !l.blank || /noreferrer|noopener/.test(l.rel)),
    "every new-tab link carries rel=noreferrer",
  );
  ok(r.hasAddress, "footer carries the Nyas's postal address");
  ok(r.hasPhone, "footer carries the Nyas's telephone number");
}

/* ------------------------------------------------------- user surfaces */
await login(ctx, "survey.kerala@ekatmadham.com");
{
  const p = await page(ctx, "/home");
  const statStops = await p.evaluate(STAT, "Stops");
  const heroStops = await p.evaluate(bodyNum, /·\s*(\d+)\s+stops/i);
  eq(statStops, heroStops, "home: Stops figure matches the hero line");
  eq(statStops, landingStops, "home stop count matches the landing page");
}
{
  const p = await page(ctx, "/yatra");
  // Numbered itinerary entries are the sequenced stops; "?" entries are not.
  const counts = await p.evaluate(() => {
    const badges = [...document.querySelectorAll("ol li span")]
      .map((s) => (s.textContent || "").trim())
      .filter((t) => /^(\d+|\?)$/.test(t));
    return {
      numbered: badges.filter((t) => t !== "?").length,
      pending: badges.filter((t) => t === "?").length,
    };
  });
  eq(counts.numbered, landingStops, "yatra: numbered itinerary entries match the stop count");
  global.yatraPending = counts.pending;

  // Each sequenced stop also carries its photo as an itinerary thumbnail.
  await p.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  await p.waitForTimeout(2000);
  const thumbs = await p.evaluate(() => {
    const imgs = [...document.querySelectorAll("ol li img")];
    return {
      total: imgs.length,
      loaded: imgs.filter((i) => i.complete && i.naturalWidth > 0).length,
    };
  });
  eq(thumbs.total, landingStops, "yatra: itinerary thumbnails match the stop count");
  eq(thumbs.loaded, thumbs.total, "yatra: every itinerary thumbnail loads");
}

/* -------------------------------------------------- organiser surfaces */
{
  const p = await page(ctx, "/o");
  const inView = await p.evaluate(STAT, "Surveys in view");

  const list = await page(ctx, "/o/survey");
  const tabs = await list.evaluate(() =>
    [...document.querySelectorAll('[role="tab"]')].map((t) => {
      const m = t.textContent.match(/\((\d+)\)/);
      return m ? parseInt(m[1], 10) : null;
    }),
  );
  // The second tab is the scope view, which is what the tile counts.
  eq(inView, tabs[1], "organiser: Surveys in view matches the scope tab count");
  ok(
    tabs[0] !== null && tabs[1] !== null && tabs[0] <= tabs[1],
    "organiser: own surveys do not exceed those in scope",
    `${tabs[0]} vs ${tabs[1]}`,
  );
}

/* ------------------------------------------------------ admin surfaces */
await login(ctx, "admin@ekatmadham.com");
{
  const p = await page(ctx, "/admin");
  const routeStops = await p.evaluate(STAT, "Route stops");
  const surveys = await p.evaluate(STAT, "Survey entries");
  const organisers = await p.evaluate(STAT, "Organisers");
  const awaiting = await p.evaluate(STAT, "Awaiting approval");
  const sidebarBadge = await p.evaluate(() => {
    const a = [...document.querySelectorAll('nav[aria-label="Admin sections"] a')]
      .find((x) => /Organisers/.test(x.textContent));
    const m = a && a.textContent.match(/(\d+)\s*$/);
    return m ? parseInt(m[1], 10) : 0;
  });

  eq(routeStops, landingStops, "admin: Route stops matches the public stop count");
  eq(awaiting, sidebarBadge, "admin: Awaiting approval matches the sidebar badge");
  global.admin = { routeStops, surveys, organisers, awaiting };
}
{
  const p = await page(ctx, "/admin/route");
  const counts = await p.evaluate(() => {
    const nums = [...document.querySelectorAll("ol li span")]
      .map((s) => (s.textContent || "").trim())
      .filter((t) => /^\d+$/.test(t)).length;
    const pend = document.querySelectorAll("section ul li").length;
    const hasPendingSection = /Awaiting sequencing/.test(document.body.innerText);
    return { nums, pend: hasPendingSection ? pend : 0 };
  });
  eq(counts.nums, global.admin.routeStops, "admin route: sequenced list matches the Route stops tile");
  eq(counts.pend, global.yatraPending, "admin route: awaiting-sequencing count matches the Yatra itinerary");
}
{
  const p = await page(ctx, "/admin/surveys");
  const total = await p.evaluate(() => {
    const m = document.body.innerText.match(/Showing\s+(\d+)\s+of\s+(\d+)\s+entries/i);
    return m ? parseInt(m[2], 10) : null;
  });
  eq(total, global.admin.surveys, "admin: Survey entries tile matches the inbox total");

  const tally = await p.evaluate(() => {
    // The status summary chips must add up to the stated total.
    const m = document.body.innerText.match(/Total\s+(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  });
  eq(tally, global.admin.surveys, "admin inbox: status chips total matches the tile");
}
{
  const p = await page(ctx, "/admin/organizers");
  const tabs = await p.evaluate(() =>
    Object.fromEntries(
      [...document.querySelectorAll('[role="tab"]')].map((t) => {
        const m = t.textContent.match(/(\w[\w\s]*)\((\d+)\)/);
        return m ? [m[1].trim(), parseInt(m[2], 10)] : ["?", 0];
      }),
    ),
  );
  eq(tabs.Pending, global.admin.awaiting, "organisers: Pending tab matches the Awaiting approval tile");
  eq(tabs.Approved, global.admin.organisers, "organisers: Approved tab matches the Organisers tile");
  ok(
    tabs.Pending + tabs.Approved <= tabs.All,
    "organisers: Pending + Approved does not exceed All",
    `${tabs.Pending}+${tabs.Approved} vs ${tabs.All}`,
  );
}

await browser.close();

console.log(`\n=== consistency: ${pass.length} passed, ${fail.length} failed ===`);
if (fail.length) {
  console.log("\nFAILURES:");
  for (const f of fail) console.log("  ✗ " + f);
} else {
  console.log("all figures agree");
}
process.exit(fail.length ? 1 : 0);
