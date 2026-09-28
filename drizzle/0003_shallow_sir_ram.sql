CREATE TABLE "daily_activity_tasks" (
	"activity_id" uuid NOT NULL,
	"task_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "daily_activity_tasks_pk" PRIMARY KEY("activity_id","task_id")
);
--> statement-breakpoint
ALTER TABLE "daily_activities" ALTER COLUMN "summary" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "daily_activity_tasks" ADD CONSTRAINT "daily_activity_tasks_activity_id_daily_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."daily_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_activity_tasks" ADD CONSTRAINT "daily_activity_tasks_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_activity_tasks_task_idx" ON "daily_activity_tasks" USING btree ("task_id");