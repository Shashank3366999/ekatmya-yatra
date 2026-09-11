/**
 * Ekatma Yatra — database schema.
 *
 * Design principle (docs/ARCHITECTURE.md §1):
 *   The first UI exposes only Survey + Activity tracking, but the schema already
 *   understands National -> State -> District -> Functional Team -> Main/Sub-Yatra.
 *   Nothing here needs replacing to grow into the full platform.
 *
 * Access is never "role = organizer". It is the tuple:
 *   account type + organisational level + geographic scope + functional responsibility
 * See src/lib/permissions.ts for the resolver.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* -------------------------------------------------------------------------- */
/* Enums                                                                      */
/* -------------------------------------------------------------------------- */

/** What kind of account this is. Deliberately small; power comes from scope. */
export const accountTypeEnum = pgEnum("account_type", [
  "user",
  "organizer",
  "admin",
  "super_admin",
]);

/** Organisational level of an organiser. Mirrors the Yatra's real structure. */
export const orgLevelEnum = pgEnum("org_level", [
  "national",
  "state",
  "district",
]);

/**
 * Functional stream an organiser belongs to. Stored as an enum for query speed;
 * add values via migration as the Yatra team confirms the official list.
 * OPEN QUESTION: final official list — see docs/TEAM-QUESTIONS.md Q4.
 */
export const functionEnum = pgEnum("function_area", [
  "survey",
  "route_planning",
  "media_pr",
  "logistics",
  "fleet",
  "medical",
  "boarding_lodging",
  "concept_design",
  "print_media",
  "social_media",
  "invite_outreach",
  "event_planning",
  "finance",
  "general",
]);

/**
 * How much time a volunteer can commit.
 *
 * The Yatra team asks not only *what* responsibility someone will take but for
 * *how many days* — a survey lead available for three days and one available
 * for the whole Yatra need different work assigned to them.
 */
export const availabilityEnum = pgEnum("availability_window", [
  "few_days",
  "one_week",
  "two_weeks",
  "one_month",
  "full_yatra",
  "flexible",
]);

/** Lifecycle of an organiser's access request. */
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
  "changes_requested",
]);

/** Whether a place belongs to the Main Yatra spine or a local Sub-Yatra. */
export const yatraKindEnum = pgEnum("yatra_kind", ["main", "sub"]);

/**
 * Why a place matters to the Advaita tradition.
 *
 * A place can hold several of these at once — Varanasi is both a Jyotirlinga
 * and a Saptapuri; Dwarka is a Char Dham, an Amnaya Peetham and a Jyotirlinga —
 * so this is stored as an array.
 */
export const heritageTypeEnum = pgEnum("heritage_type", [
  "char_dham",
  "amnaya_peetham",
  "jyotirlinga",
  "shakti_peetha",
  "saptapuri",
  "shankaracharya_site",
]);

/** Category of a surveyed place. Drives the survey form's branching. */
export const placeCategoryEnum = pgEnum("place_category", [
  "religious",
  "educational",
  "social",
  "advaita_heritage",
  "institution",
  "crowd_gathering",
  "civic",
  "other",
]);

/** Review state of a survey submission as it flows to the admin. */
export const surveyStatusEnum = pgEnum("survey_status", [
  "draft",
  "submitted",
  "under_review",
  "shortlisted",
  "approved",
  "rejected",
]);

/** Whether a surveyor recommends the place for the Yatra route. */
export const recommendationEnum = pgEnum("recommendation", [
  "strongly_recommended",
  "recommended",
  "possible",
  "not_suitable",
]);

export const activityStatusEnum = pgEnum("activity_status", [
  "not_started",
  "in_progress",
  "blocked",
  "completed",
]);

export const audienceEnum = pgEnum("audience", [
  "everyone",
  "users_only",
  "organizers_only",
  "national_organizers",
  "state_organizers",
  "district_organizers",
]);

/* -------------------------------------------------------------------------- */
/* Geography — India's real administrative tree                               */
/* -------------------------------------------------------------------------- */

export const states = pgTable(
  "states",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Census/ISO style short code, e.g. "KL", "MP". Stable join key. */
    code: varchar("code", { length: 8 }).notNull(),
    name: text("name").notNull(),
    /** true for Union Territories — they organise slightly differently. */
    isUnionTerritory: boolean("is_union_territory").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("states_code_key").on(t.code)],
);

export const districts = pgTable(
  "districts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("districts_state_idx").on(t.stateId),
    uniqueIndex("districts_state_name_key").on(t.stateId, t.name),
  ],
);

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 320 }).notNull(),
    /** scrypt hash, format: scrypt$N$r$p$salt$hash — see src/lib/password.ts */
    passwordHash: text("password_hash").notNull(),
    fullName: text("full_name").notNull(),
    phone: varchar("phone", { length: 24 }),
    accountType: accountTypeEnum("account_type").notNull().default("user"),
    /** Users are localised too, so the User App can show district-relevant info. */
    stateId: uuid("state_id").references(() => states.id, { onDelete: "set null" }),
    districtId: uuid("district_id").references(() => districts.id, { onDelete: "set null" }),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    index("users_account_type_idx").on(t.accountType),
  ],
);

/**
 * An organiser's position in the Yatra structure. Separate from `users` because
 * one person may later hold more than one posting (e.g. State Survey Lead who is
 * also a District co-ordinator) — this table is intentionally many-per-user.
 */
export const organizerProfiles = pgTable(
  "organizer_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /**
     * The predefined role the person picked while signing up.
     *
     * Kept as a reference rather than copied, so an admin editing a template
     * does not rewrite history on people already approved under it. The
     * checklist is copied at approval time instead (see src/actions/admin.ts).
     */
    roleTemplateId: uuid("role_template_id"),

    level: orgLevelEnum("level").notNull(),
    /** Geographic scope. national => both null; state => stateId; district => both. */
    stateId: uuid("state_id").references(() => states.id, { onDelete: "set null" }),
    districtId: uuid("district_id").references(() => districts.id, { onDelete: "set null" }),

    /** Primary functional stream, plus any additional ones they opted into. */
    primaryFunction: functionEnum("primary_function").notNull().default("general"),
    additionalFunctions: functionEnum("additional_functions").array().notNull().default(sql`'{}'`),

    /**
     * Free-text official designation, e.g. "Sanyasi", "Acharya", "State Representative".
     * Kept as text on purpose: the official titles are NOT yet confirmed and must not
     * be hard-coded. See docs/TEAM-QUESTIONS.md Q3.
     */
    designation: text("designation"),
    /** Marks a spiritual/mentor posting so the UI can honour it appropriately. */
    isSpiritualRepresentative: boolean("is_spiritual_representative").notNull().default(false),

    /** How much time they can give, and any specifics (dates, weekends only). */
    availability: availabilityEnum("availability"),
    availabilityNote: text("availability_note"),

    /** Anything the signup form collected that has no column yet. */
    intake: jsonb("intake").$type<Record<string, unknown>>(),

    status: approvalStatusEnum("status").notNull().default("pending"),
    reviewNote: text("review_note"),
    reviewedById: uuid("reviewed_by_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("organizer_profiles_user_idx").on(t.userId),
    index("organizer_profiles_status_idx").on(t.status),
    index("organizer_profiles_scope_idx").on(t.level, t.stateId, t.districtId),
  ],
);

/* -------------------------------------------------------------------------- */
/* Predefined roles, with the checklist each one comes with                   */
/* -------------------------------------------------------------------------- */

/**
 * A role an admin has defined in advance, for someone to pick while signing up.
 *
 * The Yatra team's framing: the Admin Panel already holds one or two ready-made
 * roles with their checklists, a joiner picks the relevant one, and the admin
 * approves. So the choice on the signup form is data an admin controls, not a
 * list in the code.
 *
 * These belong to the organising team only. A volunteer is an ordinary user
 * account with no posting to approve, so there is nothing here for them.
 */
export const roleTemplates = pgTable(
  "role_templates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    /** Suggested posting for anyone who picks it; the admin can still override. */
    level: orgLevelEnum("level").notNull().default("state"),
    functionArea: functionEnum("function_area").notNull().default("general"),
    /** Hidden from the signup form without being deleted. */
    isActive: boolean("is_active").notNull().default(true),
    position: integer("position").notNull().default(0),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("role_templates_active_idx").on(t.isActive, t.position)],
);

/**
 * The checklist a role comes with.
 *
 * Shown on the signup form so someone can see what they are taking on before
 * they commit, and copied into a real activity when the admin approves them.
 */
export const roleTemplateItems = pgTable(
  "role_template_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    templateId: uuid("template_id")
      .notNull()
      .references(() => roleTemplates.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("role_template_items_template_idx").on(t.templateId, t.position)],
);

/* -------------------------------------------------------------------------- */
/* Yatra structure — one Main Yatra, many Sub-Yatras                          */
/* -------------------------------------------------------------------------- */

export const yatras = pgTable("yatras", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: yatraKindEnum("kind").notNull(),
  name: text("name").notNull(),
  /** Sub-Yatras hang off the Main Yatra. */
  parentId: uuid("parent_id"),
  stateId: uuid("state_id").references(() => states.id, { onDelete: "set null" }),
  districtId: uuid("district_id").references(() => districts.id, { onDelete: "set null" }),
  startDate: timestamp("start_date", { withTimezone: true }),
  endDate: timestamp("end_date", { withTimezone: true }),
  /** Where a Sub-Yatra merges into the Main Yatra. */
  convergencePlaceId: uuid("convergence_place_id"),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A physical location on the Yatra map. Confirmed route stops AND places that
 * only exist because a surveyor proposed them both live here, separated by
 * `isOnRoute` — so an approved survey simply flips a flag rather than copying data.
 */
export const places = pgTable(
  "places",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    stateId: uuid("state_id").references(() => states.id, { onDelete: "set null" }),
    districtId: uuid("district_id").references(() => districts.id, { onDelete: "set null" }),
    category: placeCategoryEnum("category").notNull().default("religious"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    /** Significance to Advaita / Shankaracharya tradition. */
    significance: text("significance"),
    /**
     * Photograph of the place, as a public path. Data rather than a lookup in
     * the UI, so a place approved from a survey can be given one later without
     * touching code.
     */
    imageUrl: text("image_url"),
    /** Confirmed as part of a Yatra route (vs. merely surveyed). */
    isOnRoute: boolean("is_on_route").notNull().default(false),

    /**
     * Sanctified or established by Adi Shankaracharya. Shown on the journey map
     * to convey the full depth of the Digvijaya Yatra, whether or not the 2027
     * Yatra itself stops there — Sharada Peeth in PoK, for instance, cannot be
     * visited but belongs to the story.
     */
    isHeritageSite: boolean("is_heritage_site").notNull().default(false),
    heritageTypes: heritageTypeEnum("heritage_types").array().notNull().default(sql`'{}'`),
    /** True where the site cannot be visited on this Yatra (e.g. across a border). */
    isBeyondReach: boolean("is_beyond_reach").notNull().default(false),
    yatraId: uuid("yatra_id").references(() => yatras.id, { onDelete: "set null" }),
    /** Position along the route, for ordering the map and the itinerary. */
    routeOrder: integer("route_order"),
    expectedArrival: timestamp("expected_arrival", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("places_state_idx").on(t.stateId),
    index("places_route_idx").on(t.isOnRoute, t.routeOrder),
    index("places_heritage_idx").on(t.isHeritageSite),
  ],
);

/* -------------------------------------------------------------------------- */
/* Survey — the first source of truth                                        */
/* -------------------------------------------------------------------------- */

/**
 * One surveyed place proposal. This is the table the whole MVP exists to fill:
 * survey teams create rows, admins read and triage them.
 *
 * NOTE: the field list is a best-effort model of the survey the teams are already
 * doing on paper. It MUST be reconciled with the official survey form —
 * see docs/TEAM-QUESTIONS.md Q5. `extra` absorbs anything not yet modelled so
 * field work is never blocked by a pending migration.
 */
export const surveySubmissions = pgTable(
  "survey_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Short human reference for phone/WhatsApp coordination, e.g. "SUR-0042". */
    reference: varchar("reference", { length: 16 }).notNull(),

    submittedById: uuid("submitted_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),

    /* -- Where -- */
    placeName: text("place_name").notNull(),
    stateId: uuid("state_id")
      .notNull()
      .references(() => states.id, { onDelete: "restrict" }),
    districtId: uuid("district_id").references(() => districts.id, { onDelete: "set null" }),
    addressNotes: text("address_notes"),
    latitude: real("latitude"),
    longitude: real("longitude"),

    /* -- What kind of place -- */
    category: placeCategoryEnum("category").notNull(),
    /** Which Yatra this place is proposed for. */
    proposedFor: yatraKindEnum("proposed_for").notNull().default("main"),
    significance: text("significance"),

    /* -- Practical capacity, the questions route planners actually ask -- */
    expectedGathering: integer("expected_gathering"),
    hasParking: boolean("has_parking"),
    hasAccommodation: boolean("has_accommodation"),
    hasStageOrHall: boolean("has_stage_or_hall"),
    isVehicleAccessible: boolean("is_vehicle_accessible"),
    accessNotes: text("access_notes"),

    /* -- Who to talk to -- */
    contactName: text("contact_name"),
    contactPhone: varchar("contact_phone", { length: 24 }),
    contactRole: text("contact_role"),
    /** Supporting organisations/institutions met at this place. */
    organizationsMet: text("organizations_met").array().notNull().default(sql`'{}'`),

    /* -- Surveyor's judgement -- */
    recommendation: recommendationEnum("recommendation").notNull().default("recommended"),
    observations: text("observations"),
    /** Media captured in the field. URLs only; upload target TBD (Q7). */
    mediaUrls: text("media_urls").array().notNull().default(sql`'{}'`),

    /** Escape hatch for un-modelled official fields. */
    extra: jsonb("extra").$type<Record<string, unknown>>(),

    /* -- Review pipeline -- */
    status: surveyStatusEnum("status").notNull().default("submitted"),
    adminNote: text("admin_note"),
    reviewedById: uuid("reviewed_by_id"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    /** Set when an approved survey is promoted into `places`. */
    linkedPlaceId: uuid("linked_place_id").references(() => places.id, { onDelete: "set null" }),

    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("survey_reference_key").on(t.reference),
    index("survey_status_idx").on(t.status),
    index("survey_scope_idx").on(t.stateId, t.districtId),
    index("survey_submitter_idx").on(t.submittedById),
  ],
);

/* -------------------------------------------------------------------------- */
/* Activity tracking                                                          */
/* -------------------------------------------------------------------------- */

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    /** Which functional stream owns this work. */
    functionArea: functionEnum("function_area").notNull().default("general"),
    /** Scope the activity is aimed at; null state => national activity. */
    level: orgLevelEnum("level").notNull().default("national"),
    stateId: uuid("state_id").references(() => states.id, { onDelete: "set null" }),
    districtId: uuid("district_id").references(() => districts.id, { onDelete: "set null" }),
    placeId: uuid("place_id").references(() => places.id, { onDelete: "set null" }),
    assignedToId: uuid("assigned_to_id").references(() => users.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: activityStatusEnum("status").notNull().default("not_started"),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("activities_assignee_idx").on(t.assignedToId),
    index("activities_scope_idx").on(t.level, t.stateId, t.districtId),
    index("activities_function_idx").on(t.functionArea),
  ],
);

export const checklistItems = pgTable(
  "checklist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    position: integer("position").notNull().default(0),
    isDone: boolean("is_done").notNull().default(false),
    doneById: uuid("done_by_id").references(() => users.id, { onDelete: "set null" }),
    doneAt: timestamp("done_at", { withTimezone: true }),
  },
  (t) => [index("checklist_activity_idx").on(t.activityId, t.position)],
);

export const activityReports = pgTable(
  "activity_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** "Who did you meet / what is the status" — the narrative update. */
    body: text("body").notNull(),
    peopleMet: text("people_met"),
    statusAtReport: activityStatusEnum("status_at_report").notNull().default("in_progress"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("activity_reports_activity_idx").on(t.activityId)],
);

/* -------------------------------------------------------------------------- */
/* Events, announcements, automations                                         */
/* -------------------------------------------------------------------------- */

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    placeId: uuid("place_id").references(() => places.id, { onDelete: "set null" }),
    yatraId: uuid("yatra_id").references(() => yatras.id, { onDelete: "set null" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    isPublished: boolean("is_published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("events_starts_idx").on(t.startsAt)],
);

/** A user's personal "My Journey" — places they intend to join. */
export const journeyPlaces = pgTable(
  "journey_places",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    placeId: uuid("place_id")
      .notNull()
      .references(() => places.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("journey_user_place_key").on(t.userId, t.placeId)],
);

export const announcements = pgTable(
  "announcements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    /** Targeting reuses the same scope vocabulary as permissions. */
    audience: audienceEnum("audience").notNull().default("everyone"),
    stateId: uuid("state_id").references(() => states.id, { onDelete: "set null" }),
    districtId: uuid("district_id").references(() => districts.id, { onDelete: "set null" }),
    functionArea: functionEnum("function_area"),
    isPublished: boolean("is_published").notNull().default(true),
    createdById: uuid("created_by_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("announcements_created_idx").on(t.createdAt)],
);

/**
 * Automations are declared in the DB and toggled by admins. The MVP ships the
 * registry and the switches; the dispatcher that actually sends mail is a later
 * phase (docs/ARCHITECTURE.md §7) and needs a provider decision — Q8.
 */
export const automations = pgTable(
  "automations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: varchar("key", { length: 64 }).notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** email | reminder | notification */
    channel: varchar("channel", { length: 24 }).notNull().default("email"),
    isEnabled: boolean("is_enabled").notNull().default(false),
    config: jsonb("config").$type<Record<string, unknown>>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("automations_key_key").on(t.key)],
);

/**
 * Likes on announcements.
 *
 * The Yatra team wants the announcement feed to read like a social handle —
 * "post आएगा, उसको like कर सकते हो" — so posts carry a visible like count that
 * anyone signed in can add to. One row per person per announcement.
 */
export const announcementLikes = pgTable(
  "announcement_likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("announcement_like_once_key").on(t.announcementId, t.userId),
    index("announcement_like_post_idx").on(t.announcementId),
  ],
);

/** Append-only trail for admin actions — approvals, rejections, role changes. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 48 }).notNull(),
    entityId: uuid("entity_id"),
    detail: jsonb("detail").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt)],
);

/* -------------------------------------------------------------------------- */
/* Relations                                                                  */
/* -------------------------------------------------------------------------- */

export const statesRelations = relations(states, ({ many }) => ({
  districts: many(districts),
}));

export const districtsRelations = relations(districts, ({ one }) => ({
  state: one(states, { fields: [districts.stateId], references: [states.id] }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  state: one(states, { fields: [users.stateId], references: [states.id] }),
  district: one(districts, { fields: [users.districtId], references: [districts.id] }),
  organizerProfiles: many(organizerProfiles),
  surveys: many(surveySubmissions),
}));

export const organizerProfilesRelations = relations(organizerProfiles, ({ one }) => ({
  user: one(users, { fields: [organizerProfiles.userId], references: [users.id] }),
  state: one(states, { fields: [organizerProfiles.stateId], references: [states.id] }),
  district: one(districts, {
    fields: [organizerProfiles.districtId],
    references: [districts.id],
  }),
}));

export const surveySubmissionsRelations = relations(surveySubmissions, ({ one }) => ({
  submittedBy: one(users, {
    fields: [surveySubmissions.submittedById],
    references: [users.id],
  }),
  state: one(states, { fields: [surveySubmissions.stateId], references: [states.id] }),
  district: one(districts, {
    fields: [surveySubmissions.districtId],
    references: [districts.id],
  }),
}));

export const placesRelations = relations(places, ({ one, many }) => ({
  state: one(states, { fields: [places.stateId], references: [states.id] }),
  district: one(districts, { fields: [places.districtId], references: [districts.id] }),
  yatra: one(yatras, { fields: [places.yatraId], references: [yatras.id] }),
  events: many(events),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  assignedTo: one(users, { fields: [activities.assignedToId], references: [users.id] }),
  state: one(states, { fields: [activities.stateId], references: [states.id] }),
  district: one(districts, { fields: [activities.districtId], references: [districts.id] }),
  checklist: many(checklistItems),
  reports: many(activityReports),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  activity: one(activities, {
    fields: [checklistItems.activityId],
    references: [activities.id],
  }),
}));

export const activityReportsRelations = relations(activityReports, ({ one }) => ({
  activity: one(activities, {
    fields: [activityReports.activityId],
    references: [activities.id],
  }),
  author: one(users, { fields: [activityReports.authorId], references: [users.id] }),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  place: one(places, { fields: [events.placeId], references: [places.id] }),
}));
