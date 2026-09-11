# What we need from the Yatra team

The application is built and working. Everything below is a decision only the
Yatra team can make. Nothing here blocks people from **using** the app today —
the survey flow works end to end — but each answer either replaces a provisional
value or unlocks a module we have deliberately left switched off.

Ordered by how much it holds us up.

---

## Blocking — needed to go live with real users

### Q1. The Yatra dates and the confirmed route
**What we assumed:** 15 January – 15 May, seeded for the *next* 15 January so the
dashboards never show a Yatra in the past. The route is a researched Kalady →
Kedarnath spine of 21 stops (Kalady, Thrissur, Kanyakumari, Madurai, Rameswaram,
Kanchipuram, Sringeri, Kollur, Kolhapur, Nashik, Dwarka, Omkareshwar, Ujjain,
Puri, Varanasi, Prayagraj, Haridwar, Rishikesh, Joshimath, Badrinath, Kedarnath).

**We need:** the confirmed year and dates, and confirmation or correction of that
stop list. Every date shown in the app currently carries a "provisional" note.

### Q2. The registration form already circulating
You shared the Google Form floated in the group a month ago:
<https://forms.gle/W2SqXJPaE1gp7eNWA>

**We need its exact field list**, so the in-app signup asks the same questions in
the same words. Today our organiser signup captures: name, email, phone, state,
district, organisational level, primary responsibility, additional
responsibilities, designation, Sannyasi/Acharya flag, **how much time you can
give**, **which days suit you**, and a free-text note.

If you can export the existing responses as CSV, we can import them as
pre-approved Shankardoots rather than asking several hundred people to register
a second time.

### Q2b. The survey form the teams are actually using
**What we assumed:** place name, state, district, address, coordinates, category,
Main-or-Sub-Yatra, significance, expected gathering, vehicle access, parking,
stage/hall, accommodation, access notes, contact person + phone + role,
organisations met, recommendation, observations.

**We need:** the official questionnaire, and specifically which fields are
mandatory. We made only *place name and state* required on purpose — a form that
refuses incomplete entries sends the information back into a notebook. If the
committee wants more enforced, tell us which.

Anything we have not modelled is still captured (there is a JSON overflow field),
so surveyors are never blocked — but named fields are what reports can count.

### Q3. Official role and level names
**What we assumed:** three levels — National, State, District/Zilla — and the
word "Organiser" in place of "Volunteer", per your note.

**We need:** the official terms. Is it Organising Committee, Organising Team,
Karyakarta, something else? Are there levels between State and District
(division, block, mandal)?

### Q4. The functional teams
**What we assumed:** Survey, Route Planning, Media & PR, Logistics, Fleet,
Medical & Health, Boarding & Lodging, Concept Design, Print Media, Social Media,
Invite & Outreach, Event Planning, Finance, General.

**We need:** the official list — additions, removals, and the right names.

### Q5. How Sannyasis and Acharyas should appear
**What we assumed:** a configurable posting rather than a separate role — a flag
plus a free-text designation, so terminology can change without a migration.

**We need:** the correct title, and whether such a posting should carry different
visibility from a lay organiser at the same level (for example: see everything in
their state regardless of functional team).

---

## Needed soon — unlocks work already built

### Q6. Who reviews what
**Today:** only admins change a survey's status. Organisers see entries for their
own area.

**We need:** should a State Survey Lead be able to shortlist or reject entries
from their own state, or does everything go to the national admin? Same question
for approving organisers — can a State lead approve district organisers?

### Q7b. The film — hosting
You supplied *Ekatma Dham — A Journey of Oneness* (7m48s, **86 MB**). It is in
the build: an 18-second 0.77 MB cut loops behind the landing hero, and the full
film sits in a "Watch" section that downloads nothing until pressed.

**We need:** where the full film should live for launch. 86 MB served from our
own host is slow and expensive at scale. Either

- a **YouTube/Vimeo link** — simplest, and gives you view counts; or
- a **compressed version** (the same film at ~8–10 MB would look fine at 1080p); or
- confirmation that a CDN will front it.

Also: is there a **shorter cut** (30–60s) already made for social? That would be
a better hero background than one we cut ourselves.

### Q7. Photographs from the field
Surveyors will want to attach photos. The column exists; upload does not, because
it needs a storage decision: S3, Cloudinary, Google Drive, or the Yatra's own
hosting? Also: is there a size or retention policy?

### Q8. Email and SMS
Six automations are registered and can be switched on and off — organiser
welcome, checklist reminders, survey follow-ups, pending-approval digest, event
reminders, weekly progress. **None of them send anything yet,** and the admin
screen says so plainly rather than pretending.

**We need:** the sending provider and the from-address. If SMS or WhatsApp
matters more than email in the field, say so — it changes the choice.

### Q9. Official imagery — partly answered
The Statue of Oneness photograph has been supplied and is now used across the
product (landing hero, sign-in banner, both dashboards). It is **1366×768**,
which is sharp everywhere we currently place it.

**We need, when convenient:**

- A **~2400px-wide** version of the same photograph, if one exists. That would
  allow a true full-bleed hero on a large monitor without upscaling. Same
  filename, same aspect ratio — nothing in the code needs to change.
- The **Ekatma Dham logo** (SVG preferred) for co-branding.
- Whether an **official colour palette or typeface** exists that we should match.
  We are currently using pumpkin `#F5761A` as the accent with white/black
  surfaces and the deep green reserved for sidebars, per instruction.

We have deliberately not drawn or generated a likeness of Adi Shankaracharya —
only official photography is used.

---

## Can wait

### Q10. Districts
All 36 states and union territories are loaded, with ~400 districts covering
every state the Yatra passes through plus the larger organising states. The
remaining districts should come from the official LGD list — **which vintage
should we use?** District boundaries change, and reports will be compared against
government figures.

### Q11. Sub-Yatras
The model supports one Main Yatra and many Sub-Yatras, each with a convergence
point. **How many are expected, and who creates them** — the national team, or
each district for itself?

### Q12. Organisations
Supporting organisations are in the design but not yet built. **Who creates and
approves an organisation record** — can an organiser add one, or admin only?

### Q13. Production hosting
`admin.yatra.ekatmadham.com` was discussed for the admin panel. All three
surfaces are served from one deployment, so the subdomain is only a proxy rule if
you want it. **We need:** the confirmed domain, who controls DNS, and where it
will be hosted.

### Q14. Details taken from oneness.org.in
The landing page now names the Nyas's wider work at Omkareshwar and carries its
contact details, all read from **oneness.org.in** — the postal address at Shyamla
Hills, `+91 755-4928869`, and the X / Facebook / Instagram / YouTube profiles,
each checked on two pages of that site.

Three things need a word from the team:

1. **The email address is missing on purpose.** It is obfuscated on their site,
   and a guessed address printed on a public page is worse than none. Send the
   one you want shown.
2. **Confirm the phone number and address are the right point of contact for
   Yatra enquiries** — they are the Nyas's general details, and a Yatra-specific
   line may be better.
3. Their home page also states the statue depicts Adi Shankaracharya **at twelve
   years old**, is **88% copper, 8% tin and 4% lead**, and is built to last
   **500 years**. Those are not repeated on their Statue of Oneness page, so we
   have not printed them. Confirm and we will add them. The three figures we do
   show — 108 ft, the 54 ft pedestal, the 27 ft lotus base — appear identically
   on both pages.

---

## Two things to be aware of

**The map.** India is drawn from open government-derived boundary data, simplified
for display. If the Yatra needs an officially approved map of India, that file
should come from the team and we will swap it in.

**Existing volunteer lists.** If names have already been collected in a
spreadsheet or WhatsApp, send them over — we can import them as pre-approved
organisers rather than asking several hundred people to register from scratch.
