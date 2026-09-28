import { sql } from "drizzle-orm";
import {
  check,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { timestamps } from "./_shared";
import { users } from "./users";

export const taskStatusEnum = pgEnum("task_status", [
  "TODO",
  "IN_PROGRESS",
  "BLOCKED",
  "REVIEW",
  "COMPLETED",
]);

export const taskPriorityEnum = pgEnum("task_priority", ["LOW", "MEDIUM", "HIGH"]);

export const taskLogTypeEnum = pgEnum("task_log_type", [
  "CREATED",
  "STATUS_CHANGED",
  "PROGRESS_CHANGED",
  "COMMENTED",
  "COMPLETED",
]);

/**
 * A task can be worked on by more than one person, so assignment is modelled
 * as a many-to-many join table rather than a single `intern_id` column.
 * Assignees must be users with the INTERN role (enforced in the application).
 */
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: taskStatusEnum("status").notNull().default("TODO"),
    priority: taskPriorityEnum("priority").notNull().default("MEDIUM"),
    progress: integer("progress").notNull().default(0),
    startDate: date("start_date"),
    dueDate: date("due_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index("tasks_status_idx").on(t.status),
    index("tasks_due_date_idx").on(t.dueDate),
    index("tasks_created_at_idx").on(t.createdAt),
    check("tasks_progress_range", sql`${t.progress} >= 0 AND ${t.progress} <= 100`),
  ],
);

/** Many-to-many: which interns are working on which task. */
export const taskAssignees = pgTable(
  "task_assignees",
  {
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.taskId, t.userId], name: "task_assignees_pk" }),
    index("task_assignees_user_idx").on(t.userId),
  ],
);

/** Immutable audit trail that powers the task timeline. */
export const taskActivityLogs = pgTable(
  "task_activity_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: taskLogTypeEnum("type").notNull(),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("task_activity_logs_task_idx").on(t.taskId),
    index("task_activity_logs_created_at_idx").on(t.createdAt),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type TaskAssignee = typeof taskAssignees.$inferSelect;
export type NewTaskAssignee = typeof taskAssignees.$inferInsert;
export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];
export type TaskActivityLog = typeof taskActivityLogs.$inferSelect;
export type TaskLogType = TaskActivityLog["type"];
