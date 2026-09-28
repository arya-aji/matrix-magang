import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./_shared";
import { tasks } from "./tasks";
import { users } from "./users";

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    ...timestamps,
  },
  (t) => [
    index("feedback_intern_idx").on(t.internId),
    index("feedback_task_idx").on(t.taskId),
    index("feedback_author_idx").on(t.authorId),
  ],
);

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
