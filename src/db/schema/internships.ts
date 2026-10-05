import { sql } from "drizzle-orm";
import { check, date, index, pgEnum, pgTable, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./_shared";
import { departments } from "./departments";
import { users } from "./users";

export const internshipStatusEnum = pgEnum("internship_status", [
  "UPCOMING",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

/**
 * Internship-specific data lives here, never on `users`.
 * `user_id` must reference an INTERN — that cross-table rule is enforced in the
 * application layer.
 */
export const internships = pgTable(
  "internships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    departmentId: uuid("department_id").references(() => departments.id, {
      onDelete: "set null",
    }),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    status: internshipStatusEnum("status").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("internships_user_id_idx").on(t.userId),
    index("internships_department_id_idx").on(t.departmentId),
    index("internships_status_idx").on(t.status),
    check("internships_date_order", sql`${t.startDate} <= ${t.endDate}`),
  ],
);

export type Internship = typeof internships.$inferSelect;
export type NewInternship = typeof internships.$inferInsert;
export type InternshipStatus = Internship["status"];
