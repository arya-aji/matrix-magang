-- Retire the MENTOR role. Postgres cannot drop an enum value in place, so the
-- type is recreated. Existing MENTOR accounts are promoted to ADMIN first.
UPDATE "users" SET "role" = 'ADMIN' WHERE "role" = 'MENTOR';--> statement-breakpoint
ALTER TYPE "public"."role" RENAME TO "role_old";--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'INTERN');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."role" USING "role"::"text"::"public"."role";--> statement-breakpoint
DROP TYPE "public"."role_old";
