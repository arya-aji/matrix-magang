import { sql } from "drizzle-orm";
import { check, integer, pgTable, uuid } from "drizzle-orm/pg-core";

import { timestamps } from "./_shared";

/**
 * Application-wide settings.
 *
 * This table is a singleton: the application only ever reads/writes its first
 * row (`id` is kept for a stable primary key). `dailyTarget` is the shared
 * document-entry target that applies to every intern.
 */
export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    dailyTarget: integer("daily_target").notNull().default(50),
    ...timestamps,
  },
  (t) => [check("app_settings_daily_target_positive", sql`${t.dailyTarget} > 0`)],
);

export type AppSettings = typeof appSettings.$inferSelect;
export type NewAppSettings = typeof appSettings.$inferInsert;
