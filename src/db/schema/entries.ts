import { date, index, pgEnum, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

import { timestamps } from "./_shared";
import { users } from "./users";

/**
 * A document-entry unit is identified by a name: a business name ("Nama Usaha")
 * or a family/household name ("Nama Keluarga"). Interns enter them one by one,
 * and each row counts as one unit of daily progress.
 */
export const entryKindEnum = pgEnum("entry_kind", ["USAHA", "KELUARGA"]);

export const documentEntries = pgTable(
  "document_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Business date in the application timezone (`YYYY-MM-DD`). */
    entryDate: date("entry_date").notNull(),
    name: varchar("name", { length: 200 }).notNull(),
    kind: entryKindEnum("kind").notNull(),
    note: text("note"),
    ...timestamps,
  },
  (t) => [
    index("document_entries_intern_date_idx").on(t.internId, t.entryDate),
    index("document_entries_date_idx").on(t.entryDate),
  ],
);

export type DocumentEntry = typeof documentEntries.$inferSelect;
export type NewDocumentEntry = typeof documentEntries.$inferInsert;
export type EntryKind = DocumentEntry["kind"];
