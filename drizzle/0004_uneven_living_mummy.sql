ALTER TABLE "task_activity_logs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "task_assignees" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "tasks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_activities" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_activity_tasks" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "feedback" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "performance_criteria" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "performance_reviews" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "performance_scores" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "task_activity_logs" CASCADE;--> statement-breakpoint
DROP TABLE "task_assignees" CASCADE;--> statement-breakpoint
DROP TABLE "tasks" CASCADE;--> statement-breakpoint
DROP TABLE "daily_activities" CASCADE;--> statement-breakpoint
DROP TABLE "daily_activity_tasks" CASCADE;--> statement-breakpoint
DROP TABLE "feedback" CASCADE;--> statement-breakpoint
DROP TABLE "performance_criteria" CASCADE;--> statement-breakpoint
DROP TABLE "performance_reviews" CASCADE;--> statement-breakpoint
DROP TABLE "performance_scores" CASCADE;--> statement-breakpoint
ALTER TABLE "internships" DROP CONSTRAINT "internships_mentor_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "internships_mentor_id_idx";--> statement-breakpoint
ALTER TABLE "internships" DROP COLUMN "mentor_id";--> statement-breakpoint
DROP TYPE "public"."task_log_type";--> statement-breakpoint
DROP TYPE "public"."task_priority";--> statement-breakpoint
DROP TYPE "public"."task_status";--> statement-breakpoint
DROP TYPE "public"."daily_activity_status";--> statement-breakpoint
DROP TYPE "public"."review_status";