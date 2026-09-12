CREATE TYPE "public"."participation_role" AS ENUM('maha_rath_yatra', 'rath_yatra', 'night_halt', 'welcome', 'mahasabha', 'sabha', 'other');--> statement-breakpoint
CREATE TYPE "public"."support_category" AS ENUM('venue', 'accommodation', 'food', 'volunteers', 'transport', 'parking', 'outreach', 'local_coordination', 'publicity', 'other');--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD COLUMN "proposed_roles" "participation_role"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD COLUMN "venue_capacity" integer;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD COLUMN "food_arrangement_notes" text;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD COLUMN "is_directly_on_route" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD COLUMN "off_route_reason" text;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD COLUMN "support_categories" "support_category"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD COLUMN "distance_from_route_km" real;--> statement-breakpoint
ALTER TABLE "survey_submissions" ADD COLUMN "institution_website" text;