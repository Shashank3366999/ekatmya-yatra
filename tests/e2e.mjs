/**
 * End-to-end smoke test of the flows that matter, driven through real Chrome.
 *
 *   pnpm build && PORT=3200 pnpm start      # in one terminal
 *   pnpm test:e2e                           # in another
 *
 * Set BASE_URL to point at another environment, and SHOTS=<dir> to capture
 * screenshots of every screen it visits.
 *
 * Covers: organiser sign-in, filing a multi-step survey, admin triage and
 * promotion onto the route, organiser approval, automation toggles,
 * announcements, public registration, the Yatra map, My Journey, and the
 * in-place organiser posting request. Also asserts a clean console throughout.
 *
 * It writes to the database but resets its own preconditions through the UI,
 * so it can be run repeatedly without reseeding. For a pristine fixture:
 *   pnpm db:reset-demo   (stop the server first — PGlite is single-process)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE_URL ?? "http://localhost:3200";
const SHOTS = process.env.SHOTS;
const pass = [], fail = [];
/** ok(name, condition, extra?) — name first in this suite. */
const ok = (n, c, extra = "") => (c ? pass : fail).push(n + (extra ? ` — ${extra}` : ""));

const browser = await chromium.launch({ channel: "chrome" });

async function newPage(w = 430, h = 900) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  return { ctx, page, errors };
}

/* ---------------------------------------------- 1. Login as the survey lead */
{
  const { ctx, page, errors } = await newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email address").fill("survey.kerala@ekatmadham.com");
  await page.getByLabel("Password").fill("Yatra@2026");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/o", { timeout: 15000 }).catch(() => {});
  ok("organiser login lands on /o", page.url().endsWith("/o"), page.url());
  ok("dashboard greets by name", await page.getByText("Priya Menon").first().isVisible());
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/01-organiser-dashboard.png`, fullPage: true });

  /* ------------------------------------- 2. File a brand-new survey entry */
  await page.goto(`${BASE}/o/survey/new`, { waitUntil: "networkidle" });
  await page.getByLabel("Name of the place").fill("Chottanikkara Devi Temple");
  // State is locked to Kerala for a state-level organiser.
  await page.getByLabel("Address / landmark").fill("Chottanikkara, 18 km from Kochi");
  await page.getByLabel("Latitude").fill("9.9459");
  await page.getByLabel("Longitude").fill("76.3899");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/02-survey-step1.png`, fullPage: true });

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByLabel("Significance to the Yatra").fill(
    "Major Devi shrine with a large daily gathering; trustees keen to host a reception for the Yatra."
  );
  await page.getByLabel("Expected gathering").fill("12000");
  await page.getByRole("button", { name: "Next", exact: true }).click();

  // Facilities step — tri-state radios. The native input is visually hidden
  // behind its label, so click the label, exactly as a person would.
  const vehGroup = page.getByRole("radiogroup").filter({ hasText: "Can vehicles and buses reach it?" });
  await vehGroup.getByText("Yes", { exact: true }).click();
  await page.waitForTimeout(300);
  ok("tri-state radio actually checks",
    await page.getByRole("radio", { name: "Yes" }).first().isChecked());
  const parkGroup = page.getByRole("radiogroup").filter({ hasText: "Is there parking?" });
  await parkGroup.getByText("No", { exact: true }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();

  await page.getByLabel("Person you met").fill("Smt. Lakshmi Devi");
  await page.getByLabel("Their role").fill("Devaswom Board Member");
  await page.getByLabel("Organisations involved").fill("Cochin Devaswom Board, Local Sabha");
  await page.getByText("Strongly Recommended", { exact: true }).click();
  await page.waitForTimeout(300);
  ok("recommendation radio checks",
    await page.getByRole("radio", { name: "Strongly Recommended" }).isChecked());
  await page.getByLabel("Observations").fill("Best slot is early morning before the main pooja rush.");
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/03-survey-step4.png`, fullPage: true });

  await page.getByRole("button", { name: "Submit survey" }).click();
  await page.waitForURL(/\/o\/survey\/[0-9a-f-]{36}/, { timeout: 20000 }).catch(() => {});
  ok("survey submit redirects to detail", /\/o\/survey\/[0-9a-f-]{36}/.test(page.url()), page.url());
  const body = await page.textContent("body");
  ok("detail shows the new place", body.includes("Chottanikkara Devi Temple"));
  ok("detail shows submitted confirmation", /Submitted to the Yatra administration/i.test(body));
  ok("reference assigned", /SUR-\d{4}/.test(body), (body.match(/SUR-\d{4}/) || [])[0]);
  ok("gathering persisted", body.includes("12,000"));
  ok("contact persisted", body.includes("Smt. Lakshmi Devi"));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/04-survey-detail.png`, fullPage: true });

  ok("no console/page errors (organiser)", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

/* ------------------------------------------- 3. Admin reviews + approves it */
{
  const { ctx, page, errors } = await newPage(1440, 1000);
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.getByLabel("Email address").fill("admin@ekatmadham.com");
  await page.getByLabel("Password").fill("Yatra@2026");
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("**/admin", { timeout: 15000 }).catch(() => {});
  ok("admin login lands on /admin", page.url().endsWith("/admin"), page.url());
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/05-admin-dashboard.png`, fullPage: true });

  await page.goto(`${BASE}/admin/surveys`, { waitUntil: "networkidle" });
  const inbox = await page.textContent("body");
  ok("inbox lists the new survey", inbox.includes("Chottanikkara Devi Temple"));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/06-admin-survey-inbox.png`, fullPage: true });

  // Open the row for the survey we just filed, via its reference link.
  const ref = (await page.textContent("body")).match(/SUR-\d{4}/g).sort().pop();
  const row = page.locator("tr", { hasText: "Chottanikkara Devi Temple" });
  if (await row.count()) {
    await row.first().getByRole("link").first().click();
  } else {
    await page.getByRole("link", { name: ref }).first().click();
  }
  await page.waitForLoadState("networkidle");
  ok("admin opens survey review", /\/admin\/surveys\/[0-9a-f-]{36}/.test(page.url()), page.url());
  ok("review screen is the new survey",
    (await page.textContent("body")).includes("Chottanikkara Devi Temple"));

  await page.getByLabel("Decision").click();
  await page.getByRole("option", { name: "Approved" }).click();
  await page.getByLabel("Note to the surveyor").fill("Approved. Please confirm the morning slot with the Devaswom Board.");
  // Switch input is visually hidden behind its label too.
  const routeLabel = page.getByText("Add to the Yatra route", { exact: true });
  if (await routeLabel.count()) {
    await routeLabel.first().click();
    await page.waitForTimeout(300);
    ok("add-to-route switch checks",
      await page.getByRole("switch").first().isChecked());
  }
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/07-admin-review.png`, fullPage: true });
  await page.getByRole("button", { name: /Save decision/i }).click();
  await page.waitForTimeout(2500);
  const after = await page.textContent("body");
  ok("approval saved", /Approved and added to the Yatra route|Survey updated/i.test(after));

  /* ------------------------------ 4. Approve the pending organiser */
  await page.goto(`${BASE}/admin/organizers`, { waitUntil: "networkidle" });
  const orgBody = await page.textContent("body");
  ok("pending organiser listed", orgBody.includes("Amit Verma"));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/08-admin-organizers.png`, fullPage: true });

  // Approve the pending organiser. HeroUI Tabs mount only the selected panel,
  // so scope to the visible card. Assert the *outcome* (they move to Approved)
  // rather than the flash message, which revalidation clears.
  /*
    Make the precondition true through the UI rather than depending on a freshly
    seeded database. A previous run leaves the demo organiser approved, and
    resetting the fixture out-of-band means stopping the server first — PGlite is
    single-process. Setting the status back here keeps the suite self-contained
    and re-runnable.
  */
  await page.getByRole("tab", { name: /^All/ }).click();
  await page.waitForTimeout(700);
  const amit = page.locator("li", { hasText: "Amit Verma" }).filter({ visible: true }).first();
  const amitStatus = await amit
    .getByRole("button")
    .filter({ hasText: /Pending Approval|Approved|Rejected|Changes Requested/ })
    .first()
    .innerText();

  if (!/Pending Approval/.test(amitStatus)) {
    await amit
      .getByRole("button")
      .filter({ hasText: /Approved|Rejected|Changes Requested/ })
      .first()
      .click();
    await page.getByRole("option", { name: "Pending Approval", exact: true }).click();
    await amit.getByRole("button", { name: /^Save$/ }).click();
    await page.waitForTimeout(3000);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(800);
  }

  await page.getByRole("tab", { name: /^Pending/ }).click();
  await page.waitForTimeout(700);

  const tabsBefore = (await page.getByRole("tab").allTextContents()).join(" ");
  const card = page.locator("li", { hasText: "Amit Verma" }).filter({ visible: true }).first();
  await card.getByRole("button").filter({ hasText: /Pending Approval/ }).first().click();
  await page.getByRole("option", { name: "Approved", exact: true }).click();
  await page.waitForTimeout(300);
  ok("decision select updates",
    (await card.locator('select[name="status"]').inputValue()) === "approved");
  await card.getByRole("button", { name: /^Save$/ }).first().click();
  await page.waitForTimeout(3500);
  await page.reload({ waitUntil: "networkidle" });
  const tabsAfter = (await page.getByRole("tab").allTextContents()).join(" ");
  ok("organiser approval persists", tabsBefore !== tabsAfter, `${tabsBefore}  ->  ${tabsAfter}`);
  await page.getByRole("tab", { name: /^Approved/ }).click();
  await page.waitForTimeout(700);
  ok("approved organiser appears in Approved tab",
    (await page.locator("body").innerText()).includes("Amit Verma"));

  /* ------------- 4b. Admin controls the team and the role, not just status */
  /*
    The Yatra team's framing: joining is two choices — which team, and which
    role — and "admin panel पे सारे role control होते हैं". So the admin must be
    able to move someone between teams and roles, not only approve them.
  */
  await page.goto(`${BASE}/admin/organizers`, { waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /^Approved/ }).click();
  await page.waitForTimeout(700);

  const moved = page.locator("li", { hasText: "Amit Verma" }).filter({ visible: true }).first();
  const beforeText = (await moved.innerText()).replace(/\s+/g, " ");

  await moved.getByRole("button", { name: /Change team & role/i }).click();
  await page.waitForTimeout(500);

  // State team -> National team
  await moved.getByRole("button", { name: /team\s*$/i }).first().click();
  await page.getByRole("option", { name: "National team", exact: true }).click();
  await page.waitForTimeout(300);
  // Media & PR -> Survey & Research
  await moved.getByRole("button", { name: /Main role/i }).first().click();
  await page.getByRole("option", { name: "Survey & Research", exact: true }).click();
  await page.waitForTimeout(300);
  await moved.getByRole("button", { name: /^Save$/ }).click();
  await page.waitForTimeout(3200);

  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("tab", { name: /^Approved/ }).click();
  await page.waitForTimeout(800);
  const afterText = (
    await page.locator("li", { hasText: "Amit Verma" }).filter({ visible: true }).first().innerText()
  ).replace(/\s+/g, " ");

  ok(
    "admin moved the organiser to another team",
    /National/.test(afterText) && !/Madhya Pradesh/.test(afterText),
    `${(beforeText.match(/State · [^·]+/) || ["?"])[0].trim()} -> ${(afterText.match(/National[^·]*/) || ["?"])[0].trim()}`,
  );
  ok(
    "admin changed the organiser's role",
    /Survey & Research/.test(afterText),
    afterText.includes("Survey & Research") ? "Media & PR -> Survey & Research" : afterText.slice(0, 40),
  );

  /* ------------------------------ 5. Automations toggle */
  await page.goto(`${BASE}/admin/automations`, { waitUntil: "networkidle" });
  const sw = page.getByRole("switch").first();
  const before = await sw.getAttribute("aria-checked");
  await sw.click();
  await page.waitForTimeout(2000);
  const afterState = await page.getByRole("switch").first().getAttribute("aria-checked");
  ok("automation toggle persists", before !== afterState, `${before} -> ${afterState}`);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/09-admin-automations.png`, fullPage: true });

  /* ------------------------------ 6. Publish an announcement */
  await page.goto(`${BASE}/admin/announcements`, { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill("Route survey deadline");
  await page.getByLabel("Message").fill("Please complete district survey entries before the end of the month.");
  await page.getByRole("button", { name: /Publish announcement/i }).click();
  await page.waitForTimeout(2500);
  ok("announcement published", (await page.textContent("body")).includes("Route survey deadline"));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/10-admin-announcements.png`, fullPage: true });

  await page.goto(`${BASE}/admin/reports`, { waitUntil: "networkidle" });
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/11-admin-reports.png`, fullPage: true });
  await page.goto(`${BASE}/admin/route`, { waitUntil: "networkidle" });
  ok("approved place now on route", (await page.textContent("body")).includes("Chottanikkara Devi Temple"));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/12-admin-route.png`, fullPage: true });

  ok("no console/page errors (admin)", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

/* -------------------------------------------- 7. Public user app + journey */
{
  const { ctx, page, errors } = await newPage();
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  ok("landing renders", (await page.textContent("body")).includes("One Journey"));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/13-landing.png`, fullPage: true });

  // Register a brand-new public user
  await page.goto(`${BASE}/register`, { waitUntil: "networkidle" });
  const email = `devotee.${Date.now()}@example.com`;
  await page.getByLabel("Full name").fill("Ananya Sharma");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill("Yatra@2026");
  await page.getByRole("button", { name: /Create account/i }).click();
  await page.waitForURL("**/home", { timeout: 20000 }).catch(() => {});
  ok("user registration lands on /home", page.url().endsWith("/home"), page.url());
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/14-user-home.png`, fullPage: true });

  await page.goto(`${BASE}/yatra`, { waitUntil: "networkidle" });
  ok("yatra map renders markers", (await page.locator("svg circle").count()) > 15);
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/15-yatra-map.png`, fullPage: true });

  // Add a place to My Journey from the itinerary. The map and itinerary are
  // now one layout (stacked on a phone, side by side on a laptop) — no tabs.
  const addBtn = page.getByRole("button", { name: /Add to my journey/i }).first();
  await addBtn.scrollIntoViewIfNeeded();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/16-yatra-itinerary.png`, fullPage: true });
  await addBtn.click();
  await page.waitForTimeout(2500);
  await page.goto(`${BASE}/journey`, { waitUntil: "networkidle" });
  const j = await page.textContent("body");
  ok("place added to My Journey", !j.includes("Your journey is empty"), j.slice(0, 80));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/17-my-journey.png`, fullPage: true });

  // Request an organiser posting in place
  await page.goto(`${BASE}/join`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /Team\*?$/ }).first().click();
  await page.getByRole("option", { name: /District \/ Zilla team/ }).click();
  await page.getByRole("button", { name: /Select state/ }).click();
  await page.getByRole("option", { name: "Kerala", exact: true }).click();
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Select district/ }).click();
  await page.waitForTimeout(300);
  const opt = page.getByRole("option", { name: "Thrissur", exact: true });
  if (await opt.count()) await opt.click();
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/18-join.png`, fullPage: true });
  await page.getByRole("button", { name: /Submit request for approval/i }).click();
  await page.waitForURL("**/pending", { timeout: 20000 }).catch(() => {});
  ok("posting request lands on /pending", page.url().endsWith("/pending"), page.url());
  ok("pending page shows the posting", (await page.textContent("body")).includes("Pending Approval"));
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/19-pending.png`, fullPage: true });

  ok("no console/page errors (user)", errors.length === 0, errors.slice(0, 2).join(" | "));
  await ctx.close();
}

await browser.close();

console.log("\n=== PASS (" + pass.length + ") ===");
pass.forEach((p) => console.log("  ✓ " + p));
if (fail.length) {
  console.log("\n=== FAIL (" + fail.length + ") ===");
  fail.forEach((f) => console.log("  ✗ " + f));
}
process.exit(fail.length ? 1 : 0);
