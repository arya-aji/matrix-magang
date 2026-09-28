import {
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { timestamps } from "./_shared";
import { tasks } from "./tasks";
import { users } from "./users";

export const dailyActivityStatusEnum = pgEnum("daily_activity_status", [
  "DRAFT",
  "SUBMITTED",
]);

/**
 * One intern may have at most one activity row per business date.
 * The `(intern_id, activity_date)` unique index enforces this in the database
 * so concurrent submissions cannot create duplicates.
 */
export const dailyActivities = pgTable(
  "daily_activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    activityDate: date("activity_date").notNull(),
    /**
     * Free-text note. Optional because the work itself is now selected from a
     * dropdown of mentor-assigned tasks (see `dailyActivityTasks`).
     */
    summary: text("summary"),
    progress: integer("progress"),
    blocker: text("blocker"),
    nextStep: text("next_step"),
    status: dailyActivityStatusEnum("status").notNull().default("DRAFT"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("daily_activities_intern_date_idx").on(t.internId, t.activityDate),
    index("daily_activities_date_idx").on(t.activityDate),
    index("daily_activities_status_idx").on(t.status),
  ],
);

export type DailyActivity = typeof dailyActivities.$inferSelect;
export type NewDailyActivity = typeof dailyActivities.$inferInsert;
export type DailyActivityStatus = DailyActivity["status"];

/**
 * Which mentor-assigned tasks an intern actually worked on that day.
 * The mentor defines the tasks; the intern picks from a dropdown.
 */
export const dailyActivityTasks = pgTable(
  "daily_activity_tasks",
  {
    activityId: uuid("activity_id")
      .notNull()
      .references(() => dailyActivities.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.activityId, t.taskId], name: "daily_activity_tasks_pk" }),
    index("daily_activity_tasks_task_idx").on(t.taskId),
  ],
);

export type DailyActivityTask = typeof dailyActivityTasks.$inferSelect;
