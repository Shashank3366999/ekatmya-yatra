# Architecture

The guiding constraint from the brief:

> Build a lightweight MVP around survey and activity tracking, but design the
> data model and permissions around the real Yatra hierarchy from day one.

So the first UI exposes a small subset, while the schema already understands
National → State → District → Functional Team → Main/Sub-Yatra. Nothing here
needs replacing to grow into the full platform.

---

## 1. Why the hierarchy is in the schema from the start

The explicit anti-goal was a `user / volunteer / admin` model retrofitted later.
The cost of retrofitting is not the tables — it is every query, every permission
check and every historical row written under the old assumptions.

`organizer_profiles` is therefore many-per-user from the outset (one person may
hold more than one posting), carries `level` + `state_id` + `district_id` +
`primary_function` + `additional_functions`, and keeps `designation` as free text
because the official titles are not confirmed.

## 2. The access model

Access is never `role === "organizer"`. It is the resolved tuple:

```
account type + organisational level + geographic scope + functional responsibility
```

`src/lib/permissions.ts` is the single place this is decided:

- `resolveScope(user)` → `all` | `state` | `district` | `own` | `none`
- `scopeFilter(user, columns)` → a Drizzle `WHERE` clause for any scoped table

Every list query in `src/lib/queries.ts` funnels through `scopeFilter`, so a new
module inherits correct visibility instead of re-implementing it. It fails
closed: an approved organiser with incomplete geography sees only their own
records, and `none` compiles to an impossible predicate rather than no filter.

Admins and national organisers resolve to `all`. A district organiser also sees
state-wide rows that carry no district, since those legitimately concern them.

## 3. Team and role: the two choices

The Yatra team frames joining as two questions — "which kind of team you want to
join, और दूसरा कौन से role?" — so the UI asks exactly those, in that order:

1. **Which team?** `organizer_profiles.level` → National / State / District
2. **Which role?** `organizer_profiles.primary_function` → Survey, Event
   Planning, Digital & Social Media, Print Media, Logistics, and ten more

`additional_functions` carries any further roles the person can cover, and the
geographic scope (`state_id`, `district_id`) belongs to the team rather than the
role. Those are the same two columns the permission tuple in §2 resolves, so the
question a volunteer answers and the access they receive are the same thing.

**The admin controls all of it.** `reviewOrganizer` does not merely set a status:
it can move someone to a different team, change their main and extra roles, set
their state or district, and edit their designation — "admin panel पे सारे role
control होते हैं". Someone may apply to the national Survey team and be placed
in the Maharashtra chapter on Digital Media instead. Two things make that safe:

- Scope is normalised against the team on every save, so a "state team" posting
  can never end up without a state and silently see nothing.
- The team/role fields are optional in the schema and the action distinguishes
  "absent" from "blank", so a plain approve never wipes a posting.

The audit log records the before and after of each change, because who was moved
to which team, by whom, is exactly what gets asked about months later.

## 4. Roles that are still undecided

Sannyasis / Acharyas are modelled as a **configurable posting**, not a separate
role: `is_spiritual_representative` plus a free-text `designation`. That way the
committee can settle the terminology without a migration, and permissions stay
driven by the same tuple as everyone else.

## 5. Main Yatra and Sub-Yatras

`yatras` is self-referential (`parent_id`), with `convergence_place_id` for where
a Sub-Yatra meets the Main Yatra. With ~700 districts each potentially running a
local Upayatra, this has to be a tree rather than two tables.

Confirmed route stops and merely-surveyed places both live in `places`,
distinguished by `is_on_route`. Approving a survey therefore flips a flag and
links a row rather than copying data — the map and the survey stay one record.

**Route ordering.** A place approved from a survey joins the route *unsequenced*
(`route_order` stays null). Appending it as `max + 1` would silently make it the
Yatra's final stop, displacing Kedarnath as the culmination everywhere the
itinerary is shown. Where it actually belongs is a human decision, so it waits
under "Awaiting sequencing" in the admin route screen and is drawn with a
distinct map marker. Anything deriving the journey's start and end filters to
sequenced stops only.

## 6. Survey as the first source of truth

The client's stated first problem: survey teams are deciding where the Yatra
goes, and that information needs to reach the admin.

`survey_submissions` models the questions route planners actually ask — capacity,
vehicle access, parking, stage, accommodation, who was met, which organisations
were involved, and the surveyor's recommendation. Three deliberate decisions:

- **Only the place name and state are required.** A surveyor who knows nothing
  else yet can still file the place. A form that refuses incomplete data sends
  the information back to a notebook.
- **Facility answers are tri-state.** "Not known" is real field data and must not
  be recorded as "no", so those columns are nullable booleans.
- **`extra` is a JSONB escape hatch.** Field work is never blocked waiting on a
  migration when the official form turns out to ask something we did not model.

`reference` (`SUR-0001`) exists because coordination happens on the phone and on
WhatsApp, where a UUID is unusable.

## 7. What is deliberately incomplete

| Area | State | Blocked on |
| --- | --- | --- |
| Automations | Registry + toggles persist; **nothing sends** | Provider choice (Q8). The UI says so plainly rather than implying delivery. |
| Route sequencing | Approved places wait unsequenced | Confirmed itinerary (Q1) |
| Media on surveys | `media_urls` column exists, no upload | Storage decision (Q7) |
| Organisations | Not modelled yet | Ownership rules (Q6) |
| Community posts | `announcements` covers targeting; no threads | Scope decision |

## 8. Request lifecycle

```
Browser (Chrome, mobile or desktop)
   │
   ├── GET  → Server Component → getSessionUser() → scoped query → SSR HTML
   │
   └── POST → Server Action → Zod validation → permission check
                            → write + audit_log → revalidatePath()
```

There is no separate REST layer: Server Actions are the mutation surface. They
are public HTTP endpoints, so each one re-validates its input with Zod and
re-checks permissions server-side, never trusting a client-supplied scope. The
one route handler, `/api/surveys/export`, exists because a CSV download needs
real response headers.

Identity is re-read from the database on every request; the cookie carries only
a user id. Deactivating an account or changing a role therefore takes effect
immediately rather than at token expiry.

`audit_log` is append-only and records approvals, rejections and access changes —
precisely the decisions a committee asks about months later.

## 9. Mobile-first, and where it stops

The two field-facing surfaces are mobile-first in the strong sense: the phone
layout is the design at every screen size, and there is no desktop variant to
keep in step with it. `AppShell` caps them at a 30rem column and centres it on a
backdrop once there is room. The brief asks for this directly, and the Yatra
team's note agrees.

The Admin panel is the deliberate exception, because it is where the desk work
happens: a static green sidebar and full tables from `lg` up, collapsing to a
green top bar with a drawer and card lists below.

**The trap this creates.** Tailwind's `lg:` prefix keys off the viewport, not the
container, so a `lg:grid-cols-5` left inside the 30rem column still fires on a
laptop and tries to lay five columns out in 480px. Worse, a *single-column*
`grid` wrapper is harmful: grid items keep `min-width: auto`, so one
`whitespace-nowrap` chip grows the column past its parent's content box and the
page scrolls sideways — which is how 9px of overflow appeared on the organiser
dashboard at 360px. Those pages use plain block flow, and the audits check for
overflow at 320px upward.

Three more rules learned while building it:

**Render once.** The Yatra page originally showed tabs on a phone and a
side-by-side grid on a laptop — which meant rendering the whole map twice into
the DOM, ~18 KB of path data and a second set of animations for a copy that was
always hidden. It is now one stacking grid. Anything conditional on width should
be CSS on one tree, not two trees behind `lg:hidden` / `hidden lg:block`, unless
the content genuinely differs.

**One quantity, one source.** "Stops" was being derived two ways — every place
flagged onto the route, versus only those with a position in the itinerary — so
the landing page contradicted itself the moment a survey was approved onto the
route (22 in the figure, 21 in the map card). Anything counted in more than one
place needs a single definition; `tests/consistency.mjs` asserts the cross-page
invariants and fails loudly if two screens ever disagree again.

**Animation must never gate content.** Everything renders visible from the
server; the motion layer is added after mount. Three failure modes were found by
testing rather than by looking:

- A jump to the bottom of the page (End, an anchor, a restored scroll position)
  fires no IntersectionObserver callback at all — the element goes from "not
  intersecting" below to "not intersecting" above — so 10 sections stayed
  invisible. Fixed by expanding the observer root far upward.
- Items inside a horizontally scrolling row are *clipped* by the container, so
  their intersection rect is empty however far the root is expanded. 16 of 21
  itinerary cards never appeared. Those cascade from CSS off the row's own
  reveal instead (`.stagger`).
- `overflow-x: hidden` on `body` turns it into a scroll container and silently
  breaks `position: sticky`, killing the header and the bottom tab bar.
  `overflow-x: clip` prevents sideways scroll without that side effect.

**Test the geometry, not the screenshot.** `tests/responsive.mjs` asserts the
properties that actually break — horizontal overflow, elements past the
viewport, nav swapping, drawer behaviour, tap-target height, column layout,
single map instance. That caught the duplicate map, four sub-40px tap targets,
and overlapping marker hit areas.

## 10. Library and asset findings worth knowing

All of these were found by testing the built app rather than by reading docs,
and each is recorded next to the code that works around it:

- **HeroUI's `ToastProvider` suppresses SSR entirely.** With `@heroui/react`
  3.2.4 + Next 16.3, wrapping the tree in it makes the server emit no HTML at
  all — the body arrives as the RSC payload and everything renders client-side.
  Bisected to that provider alone; `RouterProvider` is fine. We do not mount it
  (form feedback uses server-rendered `Alert`s). See `src/components/app-providers.tsx`.

- **HeroUI's `Radio`/`Checkbox`/`Switch` need the control nested inside
  `.Content`.** As siblings they land in the column wrapper and the label renders
  under its own control; omitted entirely, the component renders an inert `<div>`
  with **no input at all**, so the value never reaches `FormData` — a silent data
  loss bug. `src/components/ui/choice.tsx` encodes the correct structure once.

A related trap: a **disabled** HeroUI `Select` submits nothing. A required field
pinned to one value must be a read-only display plus a hidden input, not a
disabled select — see `StateDistrictSelect`, where a state organiser's state is
pinned.

Two more, from working with the supplied artwork:

- **`object-contain` is not a safe default for a mismatched aspect ratio.** The
  statue photo is landscape; contained inside the portrait-ish column of a
  dashboard banner it rendered as a small strip floating in the corner. What the
  layout actually wanted was a portrait *crop* of the figure — `object-cover`
  with `object-position` centred on it, which also keeps the pixels downscaled.
- **Next will upscale past your source.** Its default device ladder reaches
  3840px, so a 1366px original was being served as a soft 1920px variant.
  `images.deviceSizes` is capped at the source width in `next.config.ts`.

And one on typography: Marcellus, the display serif, has letter-like figures —
"0" reads as a ring and "1" as an I. Every metric, count and date therefore uses
the sans stack with `tabular-nums`; the serif is for prose headings only.

## 11. Layout

```
src/
├── app/
│   ├── page.tsx              landing / role chooser
│   ├── (auth)/               login, register, register/organizer, pending
│   ├── (user)/               /home /yatra /events /journey /join /announcements
│   ├── o/                    organiser app: dashboard, survey, activities, profile
│   ├── admin/                admin: surveys, organizers, users, route,
│   │                         announcements, automations, reports
│   └── api/surveys/export/   CSV download
├── actions/                  Server Actions (auth, survey, admin, activity, journey, organizer)
├── db/                       schema, dual-driver connection, migrations, seed
├── lib/                      permissions, session, queries, validation, geo data, map outline
└── components/               brand, india-map, shells, ui/
```

## 12. Phasing

Delivered: Phase 1 (foundation, auth, roles, geography), Phase 2 (organiser
onboarding + approval), Phase 3 (survey + admin dashboard), Phase 4 (activity
tracking) and the read side of Phase 5 (route, places, events).

Next, in the order the Yatra will need it:

1. Route sequencing and arrival dates once the itinerary is confirmed.
2. Media upload on survey entries.
3. The automation dispatcher, once a provider is chosen.
4. Sub-Yatra creation per district, with convergence points.
5. Organisations as a first-class entity.
6. Logistics, fleet, medical and boarding modules — each one a functional stream
   that already exists in the permission model.
