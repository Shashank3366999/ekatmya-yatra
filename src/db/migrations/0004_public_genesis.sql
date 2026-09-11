ALTER TABLE "organizer_profiles" DROP COLUMN "posting_kind";--> statement-breakpoint
ALTER TABLE "role_templates" DROP COLUMN "posting_kind";--> statement-breakpoint
DROP TYPE "public"."posting_kind";