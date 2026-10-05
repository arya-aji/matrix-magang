CREATE TYPE "public"."entry_kind" AS ENUM('USAHA', 'KELUARGA');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"daily_target" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_settings_daily_target_positive" CHECK ("app_settings"."daily_target" > 0)
);
--> statement-breakpoint
CREATE TABLE "document_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intern_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"name" varchar(200) NOT NULL,
	"kind" "entry_kind" NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "document_entries" ADD CONSTRAINT "document_entries_intern_id_users_id_fk" FOREIGN KEY ("intern_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "document_entries_intern_date_idx" ON "document_entries" USING btree ("intern_id","entry_date");--> statement-breakpoint
CREATE INDEX "document_entries_date_idx" ON "document_entries" USING btree ("entry_date");