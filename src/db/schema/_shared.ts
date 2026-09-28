import { timestamp } from "drizzle-orm/pg-core";

/**
 * Shared `created_at` / `updated_at` columns.
 * Timestamps are stored in UTC (`withTimezone: true`); conversion to
 * Asia/Jakarta happens only at the display/business-date layer.
 */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};
