import { and, asc, count, desc, eq, gte, inArray, lte } from "drizzle-orm";

import { db } from "@/db";
import { dailyActivities, dailyActivityTasks, internships, tasks, users } from "@/db/schema";
import { getDaysInMonth, getTodayJakarta } from "@/lib/date";
import { PAGE_SIZE } from "@/lib/constants";
import type { SessionUser } from "@/types";

import { assertCanViewIntern } from "../permissions";

function monthRange(monthKey: string) {
  return {
    start: `${monthKey}-01`,
    end: `${monthKey}-${String(getDaysInMonth(monthKey)).padStart(2, "0")}`,
  };
}

export async function getActivityByDate(internId: string, date: string) {
  const [row] = await db
    .select()
    .from(dailyActivities)
    .where(and(eq(dailyActivities.internId, internId), eq(dailyActivities.activityDate, date)))
    .limit(1);

  return row ?? null;
}

export async function getTodayActivity(internId: string) {
  return getActivityByDate(internId, getTodayJakarta());
}

export async function getActivitiesForIntern(
  user: SessionUser,
  internId: string,
  page = 1,
  pageSize: number = PAGE_SIZE.activities,
) {
  await assertCanViewIntern(user, internId);

  const offset = (Math.max(1, page) - 1) * pageSize;

  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(dailyActivities)
      .where(eq(dailyActivities.internId, internId))
      .orderBy(desc(dailyActivities.activityDate))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(dailyActivities)
      .where(eq(dailyActivities.internId, internId)),
  ]);

  const total = Number(totals[0]?.value ?? 0);

  return {
    items: rows,
    total,
    page: Math.max(1, page),
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/**
 * Today's activity feed for a mentor: the interns who submitted and the ones
 * who did not. Two batched queries — no per-intern round trip.
 */
export async function getActivityFeedForMentor(mentorId: string, date?: string) {
  const targetDate = date ?? getTodayJakarta();

  const roster = await db
    .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
    .from(internships)
    .innerJoin(users, eq(internships.userId, users.id))
    .where(eq(internships.mentorId, mentorId));

  if (roster.length === 0) {
    return { date: targetDate, items: [], missing: [] as typeof roster };
  }

  const internIds = roster.map((row) => row.id);

  const submitted = await db
    .select({
      id: dailyActivities.id,
      internId: dailyActivities.internId,
      activityDate: dailyActivities.activityDate,
      summary: dailyActivities.summary,
      progress: dailyActivities.progress,
      blocker: dailyActivities.blocker,
      nextStep: dailyActivities.nextStep,
      status: dailyActivities.status,
      submittedAt: dailyActivities.submittedAt,
      updatedAt: dailyActivities.updatedAt,
    })
    .from(dailyActivities)
    .where(
      and(inArray(dailyActivities.internId, internIds), eq(dailyActivities.activityDate, targetDate)),
    )
    .orderBy(desc(dailyActivities.updatedAt));

  const submittedIds = new Set(submitted.map((row) => row.internId));

  const items = submitted.map((row) => {
    const intern = roster.find((entry) => entry.id === row.internId);
    return { ...row, internName: intern?.name ?? "Unknown", internAvatarUrl: intern?.avatarUrl ?? null };
  });

  return {
    date: targetDate,
    items,
    missing: roster.filter((row) => !submittedIds.has(row.id)),
  };
}

/** Activity history across a mentor's interns. */
export async function getActivityHistoryForMentor(
  mentorId: string,
  options: { from?: string; to?: string; internId?: string; page?: number } = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = PAGE_SIZE.activities;
  const offset = (page - 1) * pageSize;

  const internIds = (
    await db
      .select({ userId: internships.userId })
      .from(internships)
      .where(eq(internships.mentorId, mentorId))
  ).map((row) => row.userId);

  if (internIds.length === 0) {
    return { items: [], total: 0, page, pageSize, totalPages: 1 };
  }

  const scoped = options.internId
    ? internIds.filter((id) => id === options.internId)
    : internIds;

  const conditions = [inArray(dailyActivities.internId, scoped.length > 0 ? scoped : [""])];
  if (options.from) conditions.push(gte(dailyActivities.activityDate, options.from));
  if (options.to) conditions.push(lte(dailyActivities.activityDate, options.to));

  const where = and(...conditions);

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: dailyActivities.id,
        internId: dailyActivities.internId,
        internName: users.name,
        activityDate: dailyActivities.activityDate,
        summary: dailyActivities.summary,
        progress: dailyActivities.progress,
        blocker: dailyActivities.blocker,
        status: dailyActivities.status,
        submittedAt: dailyActivities.submittedAt,
      })
      .from(dailyActivities)
      .innerJoin(users, eq(dailyActivities.internId, users.id))
      .where(where)
      .orderBy(desc(dailyActivities.activityDate), desc(dailyActivities.updatedAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(dailyActivities).where(where),
  ]);

  const total = Number(totals[0]?.value ?? 0);

  return {
    items: rows,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getActivityById(activityId: string) {
  const [row] = await db
    .select({
      id: dailyActivities.id,
      internId: dailyActivities.internId,
      internName: users.name,
      activityDate: dailyActivities.activityDate,
      summary: dailyActivities.summary,
      progress: dailyActivities.progress,
      blocker: dailyActivities.blocker,
      nextStep: dailyActivities.nextStep,
      status: dailyActivities.status,
      submittedAt: dailyActivities.submittedAt,
      updatedAt: dailyActivities.updatedAt,
    })
    .from(dailyActivities)
    .innerJoin(users, eq(dailyActivities.internId, users.id))
    .where(eq(dailyActivities.id, activityId))
    .limit(1);

  return row ?? null;
}

/** Recent activity across the whole company (admin view). */
export async function getRecentActivities(limit = PAGE_SIZE.activities) {
  return db
    .select({
      id: dailyActivities.id,
      internId: dailyActivities.internId,
      internName: users.name,
      activityDate: dailyActivities.activityDate,
      summary: dailyActivities.summary,
      progress: dailyActivities.progress,
      blocker: dailyActivities.blocker,
      nextStep: dailyActivities.nextStep,
      status: dailyActivities.status,
      submittedAt: dailyActivities.submittedAt,
      updatedAt: dailyActivities.updatedAt,
    })
    .from(dailyActivities)
    .innerJoin(users, eq(dailyActivities.internId, users.id))
    .orderBy(desc(dailyActivities.activityDate), desc(dailyActivities.updatedAt))
    .limit(limit);
}

/** Which of the given interns submitted an activity for `date`. */
export async function getSubmittedInternIds(internIds: string[], date: string) {
  if (internIds.length === 0) return new Set<string>();

  const rows = await db
    .select({ internId: dailyActivities.internId })
    .from(dailyActivities)
    .where(
      and(inArray(dailyActivities.internId, internIds), eq(dailyActivities.activityDate, date)),
    );

  return new Set(rows.map((row) => row.internId));
}

/** Entries across the whole company on a specific date (admin calendar). */
export async function getCompanyActivityFeed(date: string) {
  const [submitted, roster] = await Promise.all([
    db
      .select({
        id: dailyActivities.id,
        internId: dailyActivities.internId,
        internName: users.name,
        internAvatarUrl: users.avatarUrl,
        activityDate: dailyActivities.activityDate,
        summary: dailyActivities.summary,
        progress: dailyActivities.progress,
        blocker: dailyActivities.blocker,
        nextStep: dailyActivities.nextStep,
        status: dailyActivities.status,
        submittedAt: dailyActivities.submittedAt,
        updatedAt: dailyActivities.updatedAt,
      })
      .from(dailyActivities)
      .innerJoin(users, eq(dailyActivities.internId, users.id))
      .where(eq(dailyActivities.activityDate, date))
      .orderBy(asc(users.name)),
    db
      .select({ id: users.id, name: users.name, avatarUrl: users.avatarUrl })
      .from(users)
      .where(and(eq(users.role, "INTERN"), eq(users.isActive, true)))
      .orderBy(asc(users.name)),
  ]);

  const submittedIds = new Set(submitted.map((row) => row.internId));

  return {
    date,
    items: submitted,
    missing: roster.filter((row) => !submittedIds.has(row.id)),
  };
}

/* -------------------------------------------------------------------------- */
/* Work items (mentor-assigned tasks picked by the intern)                     */
/* -------------------------------------------------------------------------- */

export async function getActivityTasks(activityId: string) {
  return db
    .select({ id: tasks.id, title: tasks.title, status: tasks.status })
    .from(dailyActivityTasks)
    .innerJoin(tasks, eq(dailyActivityTasks.taskId, tasks.id))
    .where(eq(dailyActivityTasks.activityId, activityId))
    .orderBy(asc(tasks.title));
}

/** Batched work items for several activities (avoids N+1 on the calendar). */
export async function getTasksForActivities(
  activityIds: string[],
): Promise<Map<string, { id: string; title: string }[]>> {
  const grouped = new Map<string, { id: string; title: string }[]>();
  if (activityIds.length === 0) return grouped;

  const rows = await db
    .select({
      activityId: dailyActivityTasks.activityId,
      id: tasks.id,
      title: tasks.title,
    })
    .from(dailyActivityTasks)
    .innerJoin(tasks, eq(dailyActivityTasks.taskId, tasks.id))
    .where(inArray(dailyActivityTasks.activityId, activityIds))
    .orderBy(asc(tasks.title));

  for (const row of rows) {
    const bucket = grouped.get(row.activityId) ?? [];
    bucket.push({ id: row.id, title: row.title });
    grouped.set(row.activityId, bucket);
  }

  return grouped;
}

/** Replaces the work items linked to an activity. */
export async function setActivityTasks(activityId: string, taskIds: string[]) {
  await db.delete(dailyActivityTasks).where(eq(dailyActivityTasks.activityId, activityId));

  if (taskIds.length === 0) return;

  await db
    .insert(dailyActivityTasks)
    .values(taskIds.map((taskId) => ({ activityId, taskId })))
    .onConflictDoNothing();
}

/* -------------------------------------------------------------------------- */
/* Month aggregates for the calendar view                                      */
/* -------------------------------------------------------------------------- */

export async function getInternActivityMonth(internId: string, monthKey: string) {
  const { start, end } = monthRange(monthKey);

  return db
    .select({
      id: dailyActivities.id,
      activityDate: dailyActivities.activityDate,
      status: dailyActivities.status,
      progress: dailyActivities.progress,
      summary: dailyActivities.summary,
    })
    .from(dailyActivities)
    .where(
      and(
        eq(dailyActivities.internId, internId),
        gte(dailyActivities.activityDate, start),
        lte(dailyActivities.activityDate, end),
      ),
    )
    .orderBy(asc(dailyActivities.activityDate));
}

/** Entries for every intern mentored by `mentorId` in a month. */
export async function getMentorActivityMonth(mentorId: string, monthKey: string) {
  const { start, end } = monthRange(monthKey);

  return db
    .select({
      id: dailyActivities.id,
      activityDate: dailyActivities.activityDate,
      status: dailyActivities.status,
      internId: dailyActivities.internId,
      internName: users.name,
    })
    .from(dailyActivities)
    .innerJoin(internships, eq(internships.userId, dailyActivities.internId))
    .innerJoin(users, eq(users.id, dailyActivities.internId))
    .where(
      and(
        eq(internships.mentorId, mentorId),
        gte(dailyActivities.activityDate, start),
        lte(dailyActivities.activityDate, end),
      ),
    )
    .orderBy(asc(dailyActivities.activityDate));
}

/** Entries across the whole company in a month (admin view). */
export async function getCompanyActivityMonth(monthKey: string) {
  const { start, end } = monthRange(monthKey);

  return db
    .select({
      id: dailyActivities.id,
      activityDate: dailyActivities.activityDate,
      status: dailyActivities.status,
      internId: dailyActivities.internId,
      internName: users.name,
    })
    .from(dailyActivities)
    .innerJoin(users, eq(users.id, dailyActivities.internId))
    .where(
      and(gte(dailyActivities.activityDate, start), lte(dailyActivities.activityDate, end)),
    )
    .orderBy(asc(dailyActivities.activityDate));
}
