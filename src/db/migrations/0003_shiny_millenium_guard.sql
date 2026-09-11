CREATE TYPE "public"."posting_kind" AS ENUM('committee', 'volunteer');--> statement-breakpoint
CREATE TABLE "role_template_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"template_id" uuid NOT NULL,
	"label" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"posting_kind" "posting_kind" DEFAULT 'committee' NOT NULL,
	"level" "org_level" DEFAULT 'state' NOT NULL,
	"function_area" "function_area" DEFAULT 'general' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD COLUMN "posting_kind" "posting_kind" DEFAULT 'committee' NOT NULL;--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD COLUMN "role_template_id" uuid;--> statement-breakpoint
ALTER TABLE "role_template_items" ADD CONSTRAINT "role_template_items_template_id_role_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."role_templates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_templates" ADD CONSTRAINT "role_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "role_template_items_template_idx" ON "role_template_items" USING btree ("template_id","position");--> statement-breakpoint
CREATE INDEX "role_templates_active_idx" ON "role_templates" USING btree ("is_active","position");