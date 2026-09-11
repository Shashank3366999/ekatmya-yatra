/**
 * Palette contrast, checked against WCAG 2.1 on the specified colours.
 *
 * This deliberately does not measure rendered pixels. Two attempts at that were
 * discarded: walking the DOM for an effective background mis-composited alpha
 * layers and reported near-black text as failing on a white card, and sampling
 * a cropped screenshot reads subpixel antialiasing rather than the glyph, which
 * puts 12px text 2 points below its real ratio. WCAG defines contrast on the
 * colours an author specifies, which is exactly what the tokens are.
 *
 *   pnpm test:contrast
 */
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");

/** Pull `--color-x: #hex;` out of globals.css, so this can never drift from it. */
function token(name) {
  /* Palette tokens are --color-*; HeroUI's semantic ones (danger) are bare. */
  for (const pattern of [`--color-${name}:`, `--${name}:`]) {
    const m = css.match(new RegExp(`${pattern}\\s*(#[0-9a-fA-F]{3,8})`));
    if (m) return m[1];
  }
  throw new Error(`no colour token for "${name}" in globals.css`);
}

function luminance(hex) {
  const h = hex.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c) : h.match(/../g);
  const [r, g, b] = n.slice(0, 3).map((x) => parseInt(x, 16));
  const f = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The pairs that actually occur, rather than a cross-product.
 *
 * A cross-product reports pairs nobody uses: ink-500 never sits on full-strength
 * pumpkin-100, for instance, because the only place that colour is a background
 * is a numbered badge whose type is pumpkin-800. Listing the real pairs is both
 * honest and useful — a failure here is a failure someone can see.
 */
function mix(fg, bg, alpha) {
  const c = (h) => h.replace("#", "").match(/../g).map((x) => parseInt(x, 16));
  const [a, b] = [c(fg), c(bg)];
  const out = a.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha)));
  return "#" + out.map((v) => v.toString(16).padStart(2, "0")).join("");
}

const WHITE = "#ffffff";
/* The map card fades to pumpkin-100 at 70% over white; that is the real ground. */
const CARD_FOOT = mix(token("pumpkin-100"), WHITE, 0.7);

const PAIRS = [
  /* Body text on the light grounds. */
  ["ink-900", WHITE, "headings and primary text on a card"],
  ["ink-800", WHITE, "primary text"],
  ["ink-700", WHITE, "secondary text"],
  ["ink-600", WHITE, "supporting text"],
  ["ink-600", token("ink-50"), "supporting text on the grey band"],
  ["ink-600", token("pumpkin-50"), "supporting text on the warm band"],
  ["ink-600", CARD_FOOT, "the map legend, at the foot of the card"],
  ["ink-500", WHITE, "the faintest text on the site"],
  ["ink-500", token("ink-50"), "faint text on the grey band"],
  ["ink-500", token("pumpkin-50"), "faint text on the warm band"],

  /* The accents, as type. */
  ["pumpkin-700", WHITE, "eyebrows, links"],
  ["pumpkin-700", token("ink-50"), "eyebrows on the grey band"],
  ["pumpkin-700", token("pumpkin-50"), "eyebrows and chips on the warm band"],
  ["pumpkin-800", token("pumpkin-100"), "the unsequenced-stop badge"],
  ["gold-ink", WHITE, "in-progress status"],

  /* Type on the filled brand colours. */
  ["ink-900", token("pumpkin-500"), "primary buttons and pumpkin badges"],
  ["ink-0", token("pumpkin-700"), "type on the deep pumpkin"],
  ["ink-0", token("danger"), "type on a danger fill"],
  ["ink-0", token("yatra-800"), "the admin sidebar"],
  ["ink-0", token("yatra-900"), "the admin sidebar, deep"],
  ["ink-0", "#000000", "the hero and the dark bands"],
  ["pumpkin-400", "#000000", "accents on the dark bands"],
];

/*
 * Tints, never type. `text-ink-400` was on 40 elements at 2.4:1, which is why
 * this file exists. pumpkin-500 and gold stay off the list because they are
 * legitimate icon and fill colours; what matters is that they never carry words,
 * and the pairs above cover the places they are filled behind type.
 */
const NOT_TEXT = ["ink-400", "ink-300", "ink-200", "ink-100"];

const pass = [];
const fail = [];
const ok = (c, name, extra = "") => (c ? pass : fail).push(name + (extra ? ` — ${extra}` : ""));

for (const [name, ground, where] of PAIRS) {
  const r = ratio(token(name), ground);
  ok(r >= 4.5, `${name} on ${ground} (${where})`, `${r.toFixed(2)}:1`);
}

/* The tints must not appear in a text class anywhere in the source. */
const { execSync } = await import("node:child_process");
const used = execSync("grep -rho 'text-ink-[0-9]*' src/ || true", { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);
for (const name of NOT_TEXT) {
  const hits = used.filter((u) => u === `text-${name}`).length;
  ok(hits === 0, `${name} is a tint, not a text colour`, hits ? `${hits} usages in src/` : "");
}

console.log(`\n=== contrast: ${pass.length} passed, ${fail.length} failed ===`);
if (fail.length) {
  console.log("\nFAILURES:");
  for (const f of fail) console.log("  ✗ " + f);
  console.log("\nWCAG 2.1 wants 4.5:1 for body text. Darken the token, or use the next step down.");
} else {
  console.log("every text token clears 4.5:1 on every ground it is used on");
}
process.exit(fail.length ? 1 : 0);
