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


/**
 * Read a stat tile / definition-list figure by its label.
 *
 * Two ways this read the wrong number, both found by it reporting a
 * contradiction the product did not have:
 *
 *  - climbing until *any* `.tabular-nums` turned up: four levels above a tile's
 *    label is the grid of tiles, so it returned a neighbour's figure. The
 *    ancestor must now hold exactly one figure to count as the card.
 *  - matching a label anywhere in the document: the admin sidebar also says
 *    "Organisers", next to a badge which is a number. So the search is scoped
 *    to <main> and skips anything inside a <nav>.
 */
const STAT = (label) => {
  const wanted = label.toLowerCase();
  const scope = document.querySelector("main") ?? document.body;
  for (const el of scope.querySelectorAll("p, dt, span")) {
    if ((el.textContent || "").trim().toLowerCase() !== wanted) continue;
    // The sidebar also says "Organisers", beside a badge that is a number.
    if (el.closest("nav")) continue;
    let node = el;
    for (let i = 0; i < 4 && node; i++) {
      node = node.parentElement;
      if (!node) break;
      const found = node.querySelectorAll(".tabular-nums");
      if (found.length > 1) break; // climbed out of the card
      if (found.length === 1) {
        const n = parseInt((found[0].textContent || "").replace(/[^0-9]/g, ""), 10);
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

/*
  Em dashes are not used anywhere a visitor can read them: the Yatra team asked
  for them gone, and the replacements are real punctuation rather than a deleted
  character. Checked on every page this suite visits, once per path, because the
  easy way to reintroduce one is a new string in a new component.

  Seeded rows count too. `pnpm db:rewrite-dashes` clears an existing database;
  the sources produce clean text on a fresh seed.
*/
const dashChecked = new Set();

async function assertNoEmDash(p, path) {
  if (dashChecked.has(path)) return;
  dashChecked.add(path);

  const found = await p.evaluate(() => {
    const out = [];
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = w.nextNode(); n; n = w.nextNode()) {
      if (n.nodeValue.includes("\u2014")) out.push(n.nodeValue.trim().slice(0, 70));
    }
    for (const el of document.querySelectorAll("[alt],[title],[aria-label],[placeholder]")) {
      for (const a of ["alt", "title", "aria-label", "placeholder"]) {
        const v = el.getAttribute(a);
        if (v && v.includes("\u2014")) out.push(`@${a}: ${v.slice(0, 60)}`);
      }
    }
    if (document.title.includes("\u2014")) out.push(`@title: ${document.title}`);
    return out;
  });

  ok(found.length === 0, `${path} uses no em dash`, found.join(" | "));
}

/*
  Headings are Cormorant Garamond, everything else is Manrope.

  The rule is not "every h-tag is serif": small uppercase section labels stay
  in the sans whatever tag they use, and a card title set as a <p> with
  `font-display` is a heading by any other name. So the check follows the class,
  not the tag. The Sanskrit is the one exception, and has to be: Cormorant
  carries no Devanagari, so the Mahavakyas are Tiro Devanagari Hindi.
*/
const fontsChecked = new Set();

async function assertFonts(p, path) {
  if (fontsChecked.has(path)) return;
  fontsChecked.add(path);

  const r = await p.evaluate(() => {
    const fam = (e) => getComputedStyle(e).fontFamily.split(",")[0].replace(/"/g, "");
    const visible = (e) => e.offsetParent !== null;
    const all = [...document.querySelectorAll("body *")].filter(visible);

    const display = all.filter(
      (e) => e.classList.contains("font-display") && !e.closest('[lang="sa"]'),
    );
    const text = all.filter(
      (e) =>
        !e.closest(".font-display") &&
        !e.closest('[lang="sa"]') &&
        e.children.length === 0 &&
        e.textContent.trim(),
    );
    const sanskrit = all.filter((e) => e.closest('[lang="sa"]'));

    const wrong = (els, want) =>
      els
        .filter((e) => fam(e) !== want)
        .slice(0, 3)
        .map((e) => `${e.tagName} "${e.textContent.trim().slice(0, 24)}" is ${fam(e)}`);

    return {
      counted: display.length + text.length,
      badDisplay: wrong(display, "Cormorant Garamond"),
      badText: wrong(text, "Manrope"),
      badSanskrit: wrong(sanskrit, "Tiro Devanagari Hindi"),
    };
  });

  ok(r.badDisplay.length === 0, `${path}: headings are Cormorant Garamond`, r.badDisplay.join(" ; "));
  ok(r.badText.length === 0, `${path}: body text is Manrope`, r.badText.join(" ; "));
  ok(r.badSanskrit.length === 0, `${path}: Sanskrit is Tiro Devanagari Hindi`, r.badSanskrit.join(" ; "));
}

async function page(ctx, path) {
  const p = ctx.__page ?? (ctx.__page = await ctx.newPage());
  await p.goto(B + path, waitFor(path));
  await settle(p, path);
  await p.waitForTimeout(700);
  await assertNoEmDash(p, path);
  await assertFonts(p, path);
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

/* ------------------------------ the two ways in, correctly weighted ---------- */
{
  /*
    The Yatra team's correction: a Shankardoot is not the same thing as
    everyone who joins the Yatra, and volunteering is not the same thing as
    following it. So the main action is JOIN (-> /register, no approval), the
    secondary action is VOLUNTEER (-> /register/organizer, needs approval and
    a role), and "Shankardoot" is not a landing-page label at all any more.
    The admin sign-in is a small link to /login, not a card, and never links
    to /admin directly.
  */
  const p = await page(ctx, "/");
  const r = await p.evaluate(() => {
    const t = document.body.innerText;
    const hrefs = (sel) => [...document.querySelectorAll(sel)].map((a) => a.getAttribute("href"));
    // The main and secondary cards, identified by their heading text.
    const cardWidth = (heading) => {
      const h = [...document.querySelectorAll("h3")].find((e) => e.textContent.trim() === heading);
      return h ? h.closest("div").parentElement.getBoundingClientRect().width : 0;
    };
    return {
      shankardoot: /Shankardoot/i.test(t),
      joinText: /Join Ekatma Yatra/.test(t),
      volunteerText: /Join as Volunteer/.test(t),
      signInLinks: hrefs('a[href^="/login"]').length,
      adminLinks: hrefs('a[href^="/admin"]').length,
      joinHrefs: [...new Set(hrefs('a[href="/register"]'))],
      volunteerHrefs: [...new Set(hrefs('a[href^="/register/organizer"]'))],
      joinWidth: cardWidth("Join Ekatma Yatra"),
      volunteerWidth: cardWidth("Join as Volunteer"),
    };
  });

  ok(!r.shankardoot, "landing names no Shankardoot label at all");
  ok(r.joinText, "landing offers Join Ekatma Yatra");
  ok(r.volunteerText, "landing offers Join as Volunteer");
  ok(
    r.signInLinks === 1,
    "landing carries exactly the one small admin sign-in link",
    `${r.signInLinks}`,
  );
  ok(r.adminLinks === 0, "landing links nowhere under /admin directly", `${r.adminLinks}`);
  ok(r.joinHrefs.includes("/register"), "Join Ekatma Yatra goes to the ordinary account");
  ok(
    r.volunteerHrefs.includes("/register/organizer"),
    "Join as Volunteer goes to the posting signup",
    r.volunteerHrefs.join(", "),
  );
  ok(
    r.volunteerHrefs.every((h) => !h.includes("as=")),
    "no leftover variant of the organiser signup",
    r.volunteerHrefs.join(", "),
  );
  /*
    The prominence itself, not just the wording: the Yatra team was explicit
    that Volunteer must read as visibly secondary, "not placed equally
    alongside the main CTA" — so this is checked as a real measured width, not
    assumed from which class name was used.
  */
  ok(
    r.joinWidth > r.volunteerWidth * 1.15,
    "the Join card is visibly larger than the Volunteer card",
    `join ${Math.round(r.joinWidth)}px vs volunteer ${Math.round(r.volunteerWidth)}px`,
  );
}

/* --------------------- the predefined role, on the form and in the panel */
{
  const p = await page(ctx, "/register/organizer");
  const signup = await p.evaluate(() => ({
    roles: document.querySelectorAll('input[name="roleTemplateId"]').length,
    checklistShown: /what this role involves/i.test(document.body.innerText),
    /* Nothing here should hint at an approval-free route; that is /register. */
    saysApproval: /approval/i.test(document.body.innerText),
  }));

  /*
    The role list is data an admin maintains, so this asserts the wiring rather
    than a particular role: at least one is offered, the form says which way in
    it belongs to, and the checklist is on screen before anyone commits.
  */
  ok(signup.roles > 0, "signup offers the roles an admin defined", `${signup.roles}`);
  ok(signup.checklistShown, "the role's checklist is shown before signing up");
  ok(signup.saysApproval, "the organising team signup says it needs approval");
}

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
