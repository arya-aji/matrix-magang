import { and, count, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import { documentEntries } from "@/db/schema";

/** Entries an intern recorded on a given business date, newest first. */
export async function getEntriesForInternDate(internId: string, date: string) {
  return db
    .select()
    .from(documentEntries)
    .where(and(eq(documentEntries.internId, internId), eq(documentEntries.entryDate, date)))
    .orderBy(desc(documentEntries.createdAt));
}

/** How many entries an intern recorded on a given business date. */
export async function countEntriesForInternDate(
  internId: string,
  date: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(documentEntries)
    .where(and(eq(documentEntries.internId, internId), eq(documentEntries.entryDate, date)));

  return Number(row?.value ?? 0);
}

/**
 * Entry totals for many interns on a single date, keyed by intern id.
 * Interns with no entries are absent from the map (treated as 0).
 */
export async function getEntryCountsForInterns(
  internIds: string[],
  date: string,
): Promise<Map<string, number>> {
  if (internIds.length === 0) return new Map();

  const rows = await db
    .select({ internId: documentEntries.internId, value: count() })
    .from(documentEntries)
    .where(
      and(
        eq(documentEntries.entryDate, date),
        inArray(documentEntries.internId, internIds),
      ),
    )
    .groupBy(documentEntries.internId);

  return new Map(rows.map((row) => [row.internId, Number(row.value)]));
}

/** Daily totals for one intern over an inclusive date range, newest first. */
export async function getEntryTotalsByDate(
  internId: string,
  from: string,
  to: string,
): Promise<{ date: string; total: number }[]> {
  const rows = await db
    .select({ date: documentEntries.entryDate, value: count() })
    .from(documentEntries)
    .where(
      and(
        eq(documentEntries.internId, internId),
        gte(documentEntries.entryDate, from),
        lte(documentEntries.entryDate, to),
      ),
    )
    .groupBy(documentEntries.entryDate)
    .orderBy(desc(documentEntries.entryDate));

  return rows.map((row) => ({ date: row.date, total: Number(row.value) }));
}
