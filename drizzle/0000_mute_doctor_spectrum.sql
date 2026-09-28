CREATE TYPE "public"."role" AS ENUM('ADMIN', 'MENTOR', 'INTERN');--> statement-breakpoint
CREATE TYPE "public"."internship_status" AS ENUM('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."task_log_type" AS ENUM('CREATED', 'STATUS_CHANGED', 'PROGRESS_CHANGED', 'COMMENTED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('LOW', 'MEDIUM', 'HIGH');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('TODO', 'IN_PROGRESS', 'BLOCKED', 'REVIEW', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."daily_activity_status" AS ENUM('DRAFT', 'SUBMITTED');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('DRAFT', 'FINAL');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" NOT NULL,
	"avatar_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mentor_id" uuid,
	"department_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"status" "internship_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "internships_date_order" CHECK ("internships"."start_date" <= "internships"."end_date")
);
--> statement-breakpoint
CREATE TABLE "task_activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"type" "task_log_type" NOT NULL,
	"old_value" text,
	"new_value" text,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"intern_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"status" "task_status" DEFAULT 'TODO' NOT NULL,
	"priority" "task_priority" DEFAULT 'MEDIUM' NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"start_date" date,
	"due_date" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_progress_range" CHECK ("tasks"."progress" >= 0 AND "tasks"."progress" <= 100)
);
--> statement-breakpoint
CREATE TABLE "daily_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intern_id" uuid NOT NULL,
	"activity_date" date NOT NULL,
	"summary" text NOT NULL,
	"progress" integer,
	"blocker" text,
	"next_step" text,
	"status" "daily_activity_status" DEFAULT 'DRAFT' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intern_id" uuid NOT NULL,
	"task_id" uuid,
	"author_id" uuid NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "performance_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"weight" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "performance_criteria_weight_range" CHECK ("performance_criteria"."weight" >= 0 AND "performance_criteria"."weight" <= 100)
);
--> statement-breakpoint
CREATE TABLE "performance_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"intern_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"status" "review_status" DEFAULT 'DRAFT' NOT NULL,
	"overall_score" numeric(3, 2),
	"summary" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "performance_reviews_period_order" CHECK ("performance_reviews"."period_start" <= "performance_reviews"."period_end")
);
--> statement-breakpoint
CREATE TABLE "performance_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"review_id" uuid NOT NULL,
	"criterion_id" uuid NOT NULL,
	"score" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "performance_scores_range" CHECK ("performance_scores"."score" >= 1 AND "performance_scores"."score" <= 5)
);
--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_mentor_id_users_id_fk" FOREIGN KEY ("mentor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internships" ADD CONSTRAINT "internships_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_activity_logs" ADD CONSTRAINT "task_activity_logs_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_activity_logs" ADD CONSTRAINT "task_activity_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_intern_id_users_id_fk" FOREIGN KEY ("intern_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_activities" ADD CONSTRAINT "daily_activities_intern_id_users_id_fk" FOREIGN KEY ("intern_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_intern_id_users_id_fk" FOREIGN KEY ("intern_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_intern_id_users_id_fk" FOREIGN KEY ("intern_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_reviews" ADD CONSTRAINT "performance_reviews_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_scores" ADD CONSTRAINT "performance_scores_review_id_performance_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."performance_reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_scores" ADD CONSTRAINT "performance_scores_criterion_id_performance_criteria_id_fk" FOREIGN KEY ("criterion_id") REFERENCES "public"."performance_criteria"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_name_idx" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "internships_user_id_idx" ON "internships" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "internships_mentor_id_idx" ON "internships" USING btree ("mentor_id");--> statement-breakpoint
CREATE INDEX "internships_department_id_idx" ON "internships" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "internships_status_idx" ON "internships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "task_activity_logs_task_idx" ON "task_activity_logs" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "task_activity_logs_created_at_idx" ON "task_activity_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tasks_intern_id_idx" ON "tasks" USING btree ("intern_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "tasks_created_at_idx" ON "tasks" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_activities_intern_date_idx" ON "daily_activities" USING btree ("intern_id","activity_date");--> statement-breakpoint
CREATE INDEX "daily_activities_date_idx" ON "daily_activities" USING btree ("activity_date");--> statement-breakpoint
CREATE INDEX "daily_activities_status_idx" ON "daily_activities" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_intern_idx" ON "feedback" USING btree ("intern_id");--> statement-breakpoint
CREATE INDEX "feedback_task_idx" ON "feedback" USING btree ("task_id");--> statement-breakpoint
CREATE INDEX "feedback_author_idx" ON "feedback" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "performance_criteria_active_idx" ON "performance_criteria" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "performance_reviews_intern_idx" ON "performance_reviews" USING btree ("intern_id");--> statement-breakpoint
CREATE INDEX "performance_reviews_reviewer_idx" ON "performance_reviews" USING btree ("reviewer_id");--> statement-breakpoint
CREATE INDEX "performance_reviews_period_idx" ON "performance_reviews" USING btree ("period_start","period_end");--> statement-breakpoint
CREATE INDEX "performance_scores_review_idx" ON "performance_scores" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "performance_scores_criterion_idx" ON "performance_scores" USING btree ("criterion_id");--> statement-breakpoint
CREATE UNIQUE INDEX "performance_scores_review_criterion_uq" ON "performance_scores" USING btree ("review_id","criterion_id");