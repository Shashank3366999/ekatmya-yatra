# Ekatmya Yatra

A lightweight, mobile-first **web** platform for the Ek Aatam Yatra — the Bharat
Yatra for oneness, following Adi Shankaracharya's journey from Kalady to
Kedarnath.

Not a native app: it runs in Chrome on a phone and on the desktop, from one
codebase.

**Confirmed:** 16 January – 10 May 2027, Kalady (Kerala) → Kedarnath
(Uttarakhand), organised by the Acharya Shankar Sanskritik Ekta Nyas. Volunteers
are **Shankardoots**.

> **Still provisional:** the halt list and order, the official survey questions,
> and role naming below state level — see
> [docs/TEAM-QUESTIONS.md](docs/TEAM-QUESTIONS.md).

---

## Run it

Requires Node 22+ and pnpm. **No database server needed.**

```bash
pnpm install
cp .env.example .env.local
pnpm db:migrate      # creates the schema
pnpm db:seed         # states, districts, the route, demo accounts
pnpm dev             # http://localhost:3000
```

With `DATABASE_URL` empty, the app runs on **PGlite** — real Postgres compiled
to WebAssembly, stored in `./.pglite`. Same SQL dialect and same migrations as
production, so moving to a managed Postgres later is a one-line env change.

> PGlite is single-process. Stop the dev server before running `db:seed` or
> `db:migrate`, or they will contend for the same data directory.

### Seeded accounts

| Role                        | Email                          | Password     |
| --------------------------- | ------------------------------ | ------------ |
| Super admin                 | `admin@ekatmadham.com`         | `Yatra@2026` |
| Organiser (Kerala, Survey)  | `survey.kerala@ekatmadham.com` | `Yatra@2026` |
| Organiser (pending approval)| `media.mp@ekatmadham.com`      | `Yatra@2026` |

### Useful commands

```bash
pnpm typecheck                          # tsc --noEmit
pnpm build                              # production build
pnpm db:reset                           # wipe + migrate + seed (deletes real users!)
pnpm db:reset-demo                      # reset only the demo fixtures, keeping real users
pnpm db:generate                        # regenerate SQL migrations after editing schema.ts
pnpm db:promote <email> [role]          # grant access from the CLI (default: admin)
pnpm test:e2e                           # see Testing below
```

### Granting admin access

The first admin cannot be created through the UI — only a super admin may grant
admin rights, so there is nothing to bootstrap from on a fresh deployment. Use:

```bash
pnpm db:promote someone@example.com admin        # or super_admin / organizer / user
```

It is idempotent, refuses unknown emails and roles, and writes the same
`audit_log` entry the admin UI would, so the change is not invisible later.
Stop the dev server first — the local PGlite database is single-process.

`admin` can approve organisers, triage surveys and manage everything;
`super_admin` can additionally grant admin rights to others.

---

## The three surfaces

| Surface       | Route prefix | Who                                        |
| ------------- | ------------ | ------------------------------------------ |
| **User app**  | `/home`      | The public: route, events, My Journey       |
| **Organiser** | `/o`         | Organising committee: survey, checklists    |
| **Admin**     | `/admin`     | Administration: approvals, triage, reports  |

Public: `/` (landing), `/login` (its own full-bleed shell), `/register`,
`/register/organizer`, `/pending`.

The landing page offers two ways in and never mentions the Admin Panel.
**Volunteer** goes to `/register`: an ordinary Journey-app account, open
immediately. **Serve as a Shankardoot** goes to `/register/organizer`: a seat on
the organising team at a level with a responsibility, which waits for an admin.
Shankardoot is the Yatra's own word for it, so it is the word the page uses. The
panel is at `/admin`, reached by signing in.

### Mobile-first

The User and Organiser apps are mobile-first in the strong sense: **the phone
layout is the design at every screen size.** The brief asks for exactly this —
*"keep the mobile screen for volunteer app and user app, but keep the admin app
more on web"* — and the Yatra team's note agrees ("mobile app के view में रहेगा
mostly").

So there is no desktop variant of those two surfaces to keep in step. On a phone
the app fills the screen; on a laptop the same app sits centred in a 30rem column
on a tinted backdrop. One layout, one set of behaviours, nothing that exists only
at one width.

- **Installable.** A web app manifest, maskable icons and home-screen shortcuts,
  so Chrome offers "Add to home screen"; it then opens standalone, without
  browser chrome, in portrait.
- **Touch-native.** No grey tap-flash, no 300ms tap delay, no sideways scroll at
  320px, no iOS zoom-on-focus (every input is ≥16px), press feedback on every
  card and row, and `viewport-fit=cover` with safe-area padding for notches.
- **Thumb reach.** The tab bar is pinned to the bottom at every size; controls
  are at least 36px tall and navigation at least 40px.

**The Admin panel is the deliberate exception** and stays desktop-first, because
that is where the desk work happens: a static green sidebar and full-width
tables from `lg` up, collapsing to a green top bar with a slide-in drawer and
card lists below it.

| | Admin: phone / tablet | Admin: laptop and up |
| --- | --- | --- |
| Navigation | Green top bar + drawer | Static green sidebar |
| Users | Cards | Full table |
| Dashboard | Stacked | Multi-column with side rails |

> **A trap worth knowing.** Tailwind's `lg:` prefix keys off the *viewport*, not
> the container. Inside the 30rem app column a leftover `lg:grid-cols-5` still
> fires on a laptop and tries to lay five columns out in 480px, and a
> single-column `grid` wrapper is worse than useless — grid items keep
> `min-width: auto`, so one nowrap chip pushes the column past its parent and
> the page scrolls sideways. Those pages use plain block flow.

`pnpm test:mobile` and `pnpm test:responsive` enforce both halves — see
[Testing](#testing).

### A landing page that moves

The team's point about government projects was that the UI *is* the pitch, so the
public page is deliberately alive — while staying dignified, and never hiding
content behind JavaScript:

| Element | What it does |
| --- | --- |
| Live countdown | Ticks down to 16 January 2027 |
| Hero | Statue drifts and parallaxes; aurora glow and a slowly turning mandala behind it |
| Four Mahavakyas | *Aham Brahmasmi*, *Tat Tvam Asi*, *Prajnanam Brahma*, *Ayam Atma Brahma* — cycling, with dots to control them |
| Scroll progress | A pumpkin hairline across the top |
| Ribbon | All 38 sacred site names drifting past; pauses on hover |
| Count-ups | The heritage figures count up as they come into view |
| Site spotlight | Cycles through the sacred sites one at a time; pauses on hover |
| Journey timeline | 21 halts, horizontally snap-scrollable, cascading in |
| Route map | Draws itself on, then the dashes travel along it |
| Scroll reveals | Sections fade and rise as they arrive |

Every one of these degrades to a complete, static page: content renders on the
server, `prefers-reduced-motion` collapses all of it, and the reveal logic
handles jump-scrolls and horizontal scrollers so nothing can be left invisible.

## Design

| Token | Value | Where |
| --- | --- | --- |
| Pumpkin | `#F5761A` | The brand accent: primary actions, active states, the Yatra route |
| Ink | white → `#000000` | Every surface and all text |
| Green | `#14523C` family | **Sidebars and nav chrome only** — never a page surface or a button |
| Gold | `#B8873B` | "Needs attention", kept distinct from pumpkin |

The one considered exception to the green rule is the small "Approved" status
chip: a green success chip is the universal convention, and turning it orange
would make it indistinguishable from "Submitted". It uses the sidebar's own
green and only ever appears as a tinted chip.

---

## What works today

The first release is built around the client's stated priority — **getting survey
data out of notebooks and in front of the admin.**

- **Auth & onboarding** — user signup, organiser signup, admin login. Joining the
  organising team is two choices, in the Yatra team's own framing: **which team**
  (National / State / District) and **which role** (Survey, Event Planning,
  Digital & Social Media, Print Media, Logistics, and ten more), plus any extra
  roles you can cover and how many days you can give. Access stays inert until
  an admin approves it. An existing signed-in user can request a posting on
  their own account.
- **Admin controls every posting** — not just approve/reject. The admin can move
  someone between teams, change their main role and extra roles, set their state
  or district, and edit their designation, all in one save: "admin panel पे सारे
  role control होते हैं". Every change is written to the audit trail.
- **Survey capture** — a four-step mobile form with device geolocation, tri-state
  facility answers ("not known" is real field data), draft saving, and a short
  reference (`SUR-0001`) for phone coordination.
- **Admin triage** — filterable inbox (filters live in the URL, so a view can be
  shared), full review screen, status pipeline, note back to the surveyor,
  one-click promotion onto the Yatra route, and CSV export of the filtered view.
- **Organiser approvals** — approve / reject / request changes, with an audit trail.
- **Activity tracking** — activities, checklists that work without JavaScript, and
  narrative progress reports; activity status is derived from checklist state.
- **Yatra map** — India rendered as inline SVG with the route marked, plus an
  itinerary view. No tile server, no API key, works offline.
- **User app** — route exploration, events, My Journey, announcements.
- **Admin** — users & access, route overview, announcements with audience
  targeting, automation switches, and survey reports.

### Deliberately not built yet

Automations are **registered and toggleable but do not send** — no provider has
been chosen (Q8). Route re-ordering and arrival dates are Phase 5. Media upload
needs a storage decision (Q7). See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Stack

| Concern    | Choice                              | Why |
| ---------- | ----------------------------------- | --- |
| Framework  | Next.js 16 (App Router), React 19   | Server Components keep the client bundle small; Server Actions remove the need for a separate API layer |
| Language   | TypeScript 5.9                      | TS 7's native compiler is out but Next's type plugin is still stabilising against it |
| UI         | HeroUI v3 + Tailwind CSS v4         | Built on React Aria, so dialogs, selects and forms are accessible by default; themed purely through CSS variables |
| Database   | Postgres via Drizzle ORM            | Typed SQL, generated migrations, no runtime engine |
| Local DB   | PGlite (embedded Postgres/WASM)     | Clone and run with no DB server, without leaving the Postgres dialect |
| Auth       | Signed JWT in an httpOnly cookie    | One credential provider; the token carries only a user id and identity is re-read each request, so revoking access takes effect immediately |
| Passwords  | scrypt (`node:crypto`)              | No native module to compile |
| Validation | Zod 4                               | Server Actions are public endpoints; every input is re-validated server-side |
| Map        | Inline SVG, pre-projected           | ~18 KB of path data instead of a tile map; see below |
| Icons      | Lucide                              | |

### The map

`src/lib/india-outline.ts` is generated from the [DataMeet](https://github.com/datameet/maps)
open India boundary set: the 250k-point original is simplified to ~1,300 points
with Ramer–Douglas–Peucker, and the projection is baked in so `projectPoint()`
places markers exactly on the coastline. Boundaries are simplified for display
and are cartographic reference only.

The route draws itself on, its dashes then travel along the path, markers arrive
in route order, and the first and last stops breathe — all CSS animation layered
over a complete static picture, so `prefers-reduced-motion` collapses it without
changing what is shown.

Markers are only ~4px across at phone width, so taps resolve to the *nearest*
stop via a single overlay rather than per-marker hit circles, which overlapped
badly (Thrissur's would swallow Kalady, 15 units away).

### The film

The Government of Madhya Pradesh film *Ekatma Dham — A Journey of Oneness*
(1280×720, 7m48s, **86 MB**) is the master, and the site ships only its opening
**two minutes**, as the moving backdrop to the landing hero:

| | File | Size | Behaviour |
| --- | --- | --- | --- |
| Hero, phones | `intro-sm.mp4` | **2.5 MB** | 120s, 640×360, silent, chosen by `<source media>` |
| Hero, wider | `intro.mp4` | **4.6 MB** | 120s, 960×540, silent, from 700px up |

The full film is not served anywhere; it stays git-ignored and local. The
renditions carry no audio track and the hero carries no controls — the film is
wallpaper and the copy is the content, so autoplay is the only thing to get
right: it is withheld under reduced motion or on a metered connection, where
nothing is fetched and the poster stands in.

**Why a trimmed file, rather than seeking within the film.** The first attempt
pointed the hero at the full file and reset playback after 26 seconds. Measured
result: **64 MB pulled in the first eight seconds.** A playback cap does not
limit the download — the browser buffers roughly 44 seconds ahead regardless. On
a phone in the field that is someone's data allowance.

The loop was cut from the source with Chrome's MediaRecorder (`MediaRecorder`
supports H.264 mp4 in current Chrome, so it stays universally playable). Now the
hero costs 0.77 MB and does not grow however long you watch, and the full film
transfers **0 bytes** until the play button is pressed. `pnpm test:mobile`
asserts both.

Autoplay is still withheld on a metered connection or when the viewer prefers
reduced motion, and the background always carries a visible pause control.

> **Production:** the 86 MB original should be compressed or moved behind a
> CDN/YouTube embed before launch — see docs/TEAM-QUESTIONS.md Q7.

### Imagery

The statue photograph appears in exactly one place — the landing hero — where
the frame is close to its native 16:9 and the figure can be large and crisp.
Every other surface uses the themed graphic language instead, because repeating
one photograph as a band across every dashboard flattened it and forced awkward
crops:

| Motif | Where | What it is |
| --- | --- | --- |
| `ThemeBanner motif="arches"` | Sign-in, admin dashboard | Tiled temple gateways, echoing the app mark |
| `ThemeBanner motif="journey"` | User home | The route as a flowing dashed line, using the map's own motion |
| `BharatWatermark` | User home | India's own outline — free there, as the page already loads the map data |
| `LotusMandala` | Every banner, map card | Concentric lotus bloom |
| `AccentRule` | Section dividers | Pumpkin rule with a centred glyph |

### The statue image

`public/brand/oneness.avif` is the Statue of Oneness at Omkareshwar: 1366×768,
landscape, figure right of centre with open sky to its left.

That shape drives the layouts. `ShankaraPortrait` has two variants — `cover` for
frames already near 16:9 (the landing hero, a mild crop that keeps the figure
large) and `figure` for short strips and tall columns, which crops a portrait of
the statue into a right-hand column over an ink ground with the copy on the left.
`object-contain` is deliberately *not* used: containing a landscape photo inside
a portrait frame renders it as a small strip floating in a corner.

Next's image ladder is capped at 1366px in `next.config.ts` so it never upscales
the source. See [public/brand/README.md](public/brand/README.md).

---

## Testing

Two suites, both driving real Chrome against a running build.

```bash
pnpm db:reset
pnpm build && PORT=3100 pnpm start          # one terminal
BASE_URL=http://localhost:3100 pnpm test:e2e        # another
BASE_URL=http://localhost:3100 pnpm test:consistency
BASE_URL=http://localhost:3100 pnpm test:mobile
BASE_URL=http://localhost:3100 pnpm test:responsive
SHOTS=./shots pnpm test:e2e                 # also capture screenshots
```

**`pnpm test:e2e`** — the flows that matter: organiser sign-in, filing a survey,
admin triage and promotion onto the route, organiser approval, automation
toggles, announcements, public registration, the map, and My Journey. Asserts a
clean browser console throughout.

It writes to the database but resets its own preconditions through the UI, so it
can be re-run without reseeding. For a pristine fixture use
**`pnpm db:reset-demo`** — and that rather than `pnpm db:reset` once the
database has real users, since a full reset deletes them.

> **The database scripts refuse to run while the app is up.** PGlite is
> single-process: writing to it from a script while `next dev`/`next start`
> holds it corrupts the data directory, and the next open aborts with
> `RuntimeError: Aborted()` — no hint as to why. The app now claims a lock when
> it opens the database and the scripts check it, so you get a clear refusal
> naming the process instead of losing your data. A lock left by a hard kill is
> detected as stale and ignored. Override with `PGLITE_ALLOW_CONCURRENT=1` only
> if you know why.

**`pnpm test:consistency`** — 16 cross-page invariants: the same quantity must
not be computed two different ways. It exists because the landing page once
showed "22" for Stops while its own map card said "21 stops" — one counted every
place on the route, the other only the sequenced itinerary. "Stops" now means
the confirmed, sequenced itinerary everywhere, with places awaiting sequencing
counted separately.

**`pnpm test:mobile`** — 26 checks on a 360×740 touch viewport: the manifest is
served and standalone, icons and shortcuts are present, taps have no flash or
delay, controls clear 36px, the tab bar sits in thumb reach, inputs are ≥16px so
iOS will not zoom, and the survey form advances on a real tap.

**`pnpm test:responsive`** — 240 checks across five widths (390 / 768 / 1024 /
1440 / 1920): no horizontal scroll or elements past the viewport on any screen;
the app column staying phone-width and centred; one primary nav with the tabs
pinned to the bottom; the User and Organiser pages staying single-column at
every width; the admin sidebar becoming a drawer that closes on Escape; the
users table becoming cards; tap targets at least 40px; exactly one map in the
DOM; and tapping near a marker selecting a stop.

---

---

## Deploying

1. Provision Postgres (Neon, Supabase, RDS…) and set `DATABASE_URL`.
2. Set `AUTH_SECRET` to a fresh 32+ character secret (`openssl rand -base64 32`).
3. `pnpm db:migrate` against the new database, then `pnpm db:seed` for the
   reference geography and route.
4. `pnpm build && pnpm start`.

Runs anywhere Node runs. The admin panel was discussed as
`admin.yatra.ekatmadham.com`; both surfaces are served from one deployment, so a
subdomain only needs a reverse-proxy rule if it is wanted at all.
