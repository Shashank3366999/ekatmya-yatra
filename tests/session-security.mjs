/**
 * The session cookie's Secure attribute, checked against the real HTTP
 * response header — not against whether a browser accepted it.
 *
 * This exists because of a bug that shipped and was only found in production:
 * the cookie's `Secure` flag was hard-coded from NODE_ENV, which is true for
 * any production build regardless of whether the connection is actually
 * HTTPS. Over plain HTTP, a Secure cookie is not extra-safe, it is silently
 * REFUSED by the browser — sign-in appeared to work (rendered from Next's
 * client router cache) for a few minutes, then the first real server round
 * trip found no cookie and bounced to /login. It reached production because
 * every local test runs on Chrome against localhost, and Chrome exempts
 * localhost from the Secure-requires-HTTPS rule — so a cookie jar check
 * (`context.cookies()`) passed locally while being silently dropped on the
 * live IP the whole time. Reading the raw Set-Cookie response header is what
 * catches it; asking the browser whether it kept the cookie cannot, on
 * localhost.
 *
 * The fix derives Secure from X-Forwarded-Proto, which nginx sets on every
 * request it proxies and which nothing outside the instance can forge (Node
 * only listens on 127.0.0.1). This suite drives that header directly, the
 * same way nginx would, without needing nginx in front of it.
 *
 *   pnpm build && PORT=3200 pnpm start
 *   pnpm test:session
 */
import { chromium } from "playwright";

const B = process.env.BASE_URL ?? "http://localhost:3200";
const pass = [], fail = [];
const ok = (c, n, extra = "") => (c ? pass : fail).push(n + (extra ? ` — ${extra}` : ""));

const browser = await chromium.launch({ channel: "chrome" });

/**
 * Sign in with a given X-Forwarded-Proto (or none), and return the raw
 * Set-Cookie header text from the response that actually set the session —
 * not from the browser's cookie jar, which localhost exempts from the rule
 * under test.
 */
async function signInAndCaptureSetCookie(proto) {
  const ctx = await browser.newContext(
    proto ? { extraHTTPHeaders: { "x-forwarded-proto": proto } } : {},
  );
  const p = await ctx.newPage();
  await p.goto(`${B}/login`, { waitUntil: "load" });

  const [response] = await Promise.all([
    p.waitForResponse((r) => r.request().method() === "POST"),
    (async () => {
      await p.getByLabel("Email address").fill("survey.kerala@ekatmadham.com");
      await p.getByLabel("Password").fill("Yatra@2026");
      await p.getByRole("button", { name: /sign in/i }).click();
    })(),
  ]);

  const headers = await response.allHeaders();
  await ctx.close();
  return headers["set-cookie"] ?? null;
}

{
  const setCookie = await signInAndCaptureSetCookie("https");
  ok(Boolean(setCookie), "sign-in with x-forwarded-proto: https sets a cookie");
  ok(
    /;\s*Secure/i.test(setCookie ?? ""),
    "x-forwarded-proto: https -> the session cookie IS Secure",
    setCookie ?? "(no cookie)",
  );
}

{
  const setCookie = await signInAndCaptureSetCookie("http");
  ok(Boolean(setCookie), "sign-in with x-forwarded-proto: http sets a cookie");
  ok(
    !/;\s*Secure/i.test(setCookie ?? ""),
    "x-forwarded-proto: http -> the session cookie is NOT Secure (or it would be silently dropped)",
    setCookie ?? "(no cookie)",
  );
}

{
  /*
    No explicit override from this test. `next start` does not leave this
    unanswered, though: confirmed separately that it backfills
    x-forwarded-proto from the actual raw connection whenever nothing upstream
    set it, so a plain HTTP hit with no header is reported as "http" — truthfully,
    since the connection really is unencrypted here — and the cookie must NOT
    be Secure, for the same reason as the explicit-http case above. This is
    what makes trusting the header safe in the first place: even without
    nginx, Next itself will not claim a connection is HTTPS when it is not.
  */
  const setCookie = await signInAndCaptureSetCookie(null);
  ok(Boolean(setCookie), "sign-in with no explicit proto override sets a cookie");
  ok(
    !/;\s*Secure/i.test(setCookie ?? ""),
    "no explicit override, genuinely-HTTP connection -> the session cookie is NOT Secure",
    setCookie ?? "(no cookie)",
  );
}

await browser.close();

console.log(`\n=== session-security: ${pass.length} passed, ${fail.length} failed ===`);
if (fail.length) {
  console.log("\nFAILURES:");
  for (const f of fail) console.log("  ✗ " + f);
} else {
  console.log("the Secure flag matches the real connection in every case");
}
process.exit(fail.length ? 1 : 0);
