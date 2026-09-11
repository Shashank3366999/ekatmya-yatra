CREATE TYPE "public"."availability_window" AS ENUM('few_days', 'one_week', 'two_weeks', 'one_month', 'full_yatra', 'flexible');--> statement-breakpoint
CREATE TYPE "public"."heritage_type" AS ENUM('char_dham', 'amnaya_peetham', 'jyotirlinga', 'shakti_peetha', 'saptapuri', 'shankaracharya_site');--> statement-breakpoint
CREATE TABLE "announcement_likes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"announcement_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD COLUMN "availability" "availability_window";--> statement-breakpoint
ALTER TABLE "organizer_profiles" ADD COLUMN "availability_note" text;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "is_heritage_site" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "heritage_types" "heritage_type"[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "places" ADD COLUMN "is_beyond_reach" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "announcement_likes" ADD CONSTRAINT "announcement_likes_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_likes" ADD CONSTRAINT "announcement_likes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "announcement_like_once_key" ON "announcement_likes" USING btree ("announcement_id","user_id");--> statement-breakpoint
CREATE INDEX "announcement_like_post_idx" ON "announcement_likes" USING btree ("announcement_id");--> statement-breakpoint
CREATE INDEX "places_heritage_idx" ON "places" USING btree ("is_heritage_site");