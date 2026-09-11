CREATE TYPE "public"."account_type" AS ENUM('user', 'organizer', 'admin', 'super_admin');--> statement-breakpoint
CREATE TYPE "public"."activity_status" AS ENUM('not_started', 'in_progress', 'blocked', 'completed');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('pending', 'approved', 'rejected', 'changes_requested');--> statement-breakpoint
CREATE TYPE "public"."audience" AS ENUM('everyone', 'users_only', 'organizers_only', 'national_organizers', 'state_organizers', 'district_organizers');--> statement-breakpoint
CREATE TYPE "public"."function_area" AS ENUM('survey', 'route_planning', 'media_pr', 'logistics', 'fleet', 'medical', 'boarding_lodging', 'concept_design', 'print_media', 'social_media', 'invite_outreach', 'event_planning', 'finance', 'general');--> statement-breakpoint
CREATE TYPE "public"."org_level" AS ENUM('national', 'state', 'district');--> statement-breakpoint
CREATE TYPE "public"."place_category" AS ENUM('religious', 'educational', 'social', 'advaita_heritage', 'institution', 'crowd_gathering', 'civic', 'other');--> statement-breakpoint
CREATE TYPE "public"."recommendation" AS ENUM('strongly_recommended', 'recommended', 'possible', 'not_suitable');--> statement-breakpoint
CREATE TYPE "public"."survey_status" AS ENUM('draft', 'submitted', 'under_review', 'shortlisted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."yatra_kind" AS ENUM('main', 'sub');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"function_area" "function_area" DEFAULT 'general' NOT NULL,
	"level" "org_level" DEFAULT 'national' NOT NULL,
	"state_id" uuid,
	"district_id" uuid,
	"place_id" uuid,
	"assigned_to_id" uuid,
	"due_date" timestamp with time zone,
	"status" "activity_status" DEFAULT 'not_started' NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"body" text NOT NULL,
	"people_met" text,
	"status_at_report" "activity_status" DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"audience" "audience" DEFAULT 'everyone' NOT NULL,
	"state_id" uuid,
	"district_id" uuid,
	"function_area" "function_area",
	"is_published" boolean DEFAULT true NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(48) NOT NULL,
	"entity_id" uuid,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "automations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" varchar(64) NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"channel" varchar(24) DEFAULT 'email' NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"config" jsonb,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_done" boolean DEFAULT false NOT NULL,
	"done_by_id" uuid,
	"done_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"state_id" uuid NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"place_id" uuid,
	"yatra_id" uuid,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "journey_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizer_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"level" "org_level" NOT NULL,
	"state_id" uuid,
	"district_id" uuid,
	"primary_function" "function_area" DEFAULT 'general' NOT NULL,
	"additional_functions" "function_area"[] DEFAULT '{}' NOT NULL,
	"designation" text,
	"is_spiritual_representative" boolean DEFAULT false NOT NULL,
	"intake" jsonb,
	"status" "approval_status" DEFAULT 'pending' NOT NULL,
	"review_note" text,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"state_id" uuid,
	"district_id" uuid,
	"category" "place_category" DEFAULT 'religious' NOT NULL,
	"latitude" real,
	"longitude" real,
	"significance" text,
	"is_on_route" boolean DEFAULT false NOT NULL,
	"yatra_id" uuid,
	"route_order" integer,
	"expected_arrival" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(8) NOT NULL,
	"name" text NOT NULL,
	"is_union_territory" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" varchar(16) NOT NULL,
	"submitted_by_id" uuid NOT NULL,
	"place_name" text NOT NULL,
	"state_id" uuid NOT NULL,
	"district_id" uuid,
	"address_notes" text,
	"latitude" real,
	"longitude" real,
	"category" "place_category" NOT NULL,
	"proposed_for" "yatra_kind" DEFAULT 'main' NOT NULL,
	"significance" text,
	"expected_gathering" integer,
	"has_parking" boolean,
	"has_accommodation" boolean,
	"has_stage_or_hall" boolean,
	"is_vehicle_accessible" boolean,
	"access_notes" text,
	"contact_name" text,
	"contact_phone" varchar(24),
	"contact_role" text,
	"organizations_met" text[] DEFAULT '{}' NOT NULL,
	"recommendation" "recommendation" DEFAULT 'recommended' NOT NULL,
	"observations" text,
	"media_urls" text[] DEFAULT '{}' NOT NULL,
	"extra" jsonb,
	"status" "survey_status" DEFAULT 'submitted' NOT NULL,
	"admin_note" text,
	"reviewed_by_id" uuid,
	"reviewed_at" timestamp with time zone,
	"linked_place_id" uuid,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" varchar(24),
	"account_type" "account_type" DEFAULT 'user' NOT NULL,
	"state_id" uuid,
	"district_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "yatras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "yatra_kind" NOT NULL,
	"name" text NOT NULL,
	"parent_id" uuid,
	"state_id" uuid,
	"district_id" uuid,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"convergence_place_id" uuid,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_assigned_to_id_users_id_fk" FOREIGN KEY ("assigned_to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reports" ADD CONSTRAINT "activity_reports_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_reports" ADD CONSTRAINT "activity_reports_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_done_by_id_users_id_fk" FOREIGN KEY ("done_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_yatra_id_yatras_id_fk" FOREIGN KEY ("yatra_id") REFERENCES "public"."yatras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_places" ADD CONSTRAINT "journey_places_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journey_places" ADD CONSTRAINT "journey_places_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD CONSTRAINT "organizer_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD CONSTRAINT "organizer_profiles_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD CONSTRAINT "organizer_profiles_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "places" ADD CONSTRAINT "places_yatra_id_yatras_id_fk" FOREIGN KEY ("yatra_id") REFERENCES "public"."yatras"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_submitted_by_id_users_id_fk" FOREIGN KEY ("submitted_by_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD CONSTRAINT "survey_submissions_linked_place_id_places_id_fk" FOREIGN KEY ("linked_place_id") REFERENCES "public"."places"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yatras" ADD CONSTRAINT "yatras_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yatras" ADD CONSTRAINT "yatras_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_assignee_idx" ON "activities" USING btree ("assigned_to_id");--> statement-breakpoint
CREATE INDEX "activities_scope_idx" ON "activities" USING btree ("level","state_id","district_id");--> statement-breakpoint
CREATE INDEX "activities_function_idx" ON "activities" USING btree ("function_area");--> statement-breakpoint
CREATE INDEX "activity_reports_activity_idx" ON "activity_reports" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "announcements_created_idx" ON "announcements" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_log" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "automations_key_key" ON "automations" USING btree ("key");--> statement-breakpoint
CREATE INDEX "checklist_activity_idx" ON "checklist_items" USING btree ("activity_id","position");--> statement-breakpoint
CREATE INDEX "districts_state_idx" ON "districts" USING btree ("state_id");--> statement-breakpoint
CREATE UNIQUE INDEX "districts_state_name_key" ON "districts" USING btree ("state_id","name");--> statement-breakpoint
CREATE INDEX "events_starts_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE UNIQUE INDEX "journey_user_place_key" ON "journey_places" USING btree ("user_id","place_id");--> statement-breakpoint
CREATE INDEX "organizer_profiles_user_idx" ON "organizer_profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "organizer_profiles_status_idx" ON "organizer_profiles" USING btree ("status");--> statement-breakpoint
CREATE INDEX "organizer_profiles_scope_idx" ON "organizer_profiles" USING btree ("level","state_id","district_id");--> statement-breakpoint
CREATE INDEX "places_state_idx" ON "places" USING btree ("state_id");--> statement-breakpoint
CREATE INDEX "places_route_idx" ON "places" USING btree ("is_on_route","route_order");--> statement-breakpoint
CREATE UNIQUE INDEX "states_code_key" ON "states" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "survey_reference_key" ON "survey_submissions" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "survey_status_idx" ON "survey_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "survey_scope_idx" ON "survey_submissions" USING btree ("state_id","district_id");--> statement-breakpoint
CREATE INDEX "survey_submitter_idx" ON "survey_submissions" USING btree ("submitted_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_account_type_idx" ON "users" USING btree ("account_type");