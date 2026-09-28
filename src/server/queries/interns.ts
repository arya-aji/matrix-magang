import { and, asc, count, desc, eq, ilike, inArray, isNull, notInArray, or } from "drizzle-orm";

import { db } from "@/db";
import {
  departments,
  internships,
  taskAssignees,
  tasks,
  users,
  type InternshipStatus,
  type TaskStatus,
} from "@/db/schema";
import { PAGE_SIZE } from "@/lib/constants";
import { getTodayJakarta } from "@/lib/date";
import type { SessionUser } from "@/types";

import { assertCanViewIntern } from "../permissions";
import { getSubmittedInternIds } from "./activities";
import { getTaskStatsForInterns } from "./tasks";

export type MentorInternRow = {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  internshipId: string;
  internshipStatus: InternshipStatus;
  departmentName: string | null;
  startDate: string;
  endDate: string;
  totalTasks: number;
  completedTasks: number;
  blockedTasks: number;
  activeTaskTitle: string | null;
  activeTaskStatus: TaskStatus | null;
  todayProgress: number;
  submittedToday: boolean;
  hasBlocker: boolean;
};

/**
 * Mentor roster with every column the mentor dashboard needs.
 * Uses a fixed number of batched queries (roster, task stats, activity status,
 * active task titles) instead of per-intern queries.
 */
export async function getMentorInterns(mentorId: string): Promise<MentorInternRow[]> {
  const roster = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      internshipId: internships.id,
      internshipStatus: internships.status,
      startDate: internships.startDate,
      endDate: internships.endDate,
      departmentName: departments.name,
    })
    .from(internships)
    .innerJoin(users, eq(internships.userId, users.id))
    .leftJoin(departments, eq(internships.departmentId, departments.id))
    .where(eq(internships.mentorId, mentorId))
    .orderBy(asc(users.name));

  if (roster.length === 0) return [];

  const internIds = roster.map((row) => row.id);
  const today = getTodayJakarta();

  const [stats, submittedIds, activeTasks] = await Promise.all([
    getTaskStatsForInterns(internIds),
    getSubmittedInternIds(internIds, today),
    db
      .select({
        internId: taskAssignees.userId,
        title: tasks.title,
        status: tasks.status,
        updatedAt: tasks.updatedAt,
      })
      .from(taskAssignees)
      .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
      .where(
        and(
          inArray(taskAssignees.userId, internIds),
          notInArray(tasks.status, ["COMPLETED"]),
        ),
      )
      .orderBy(desc(tasks.updatedAt)),
  ]);

  const latestByIntern = new Map<string, { title: string; status: TaskStatus }>();
  for (const task of activeTasks) {
    if (!latestByIntern.has(task.internId)) {
      latestByIntern.set(task.internId, { title: task.title, status: task.status });
    }
  }

  return roster.map((row) => {
    const bucket = stats.perIntern.get(row.id);
    const total = bucket?.total ?? 0;
    const completed = bucket?.completed ?? 0;
    const progressSum = bucket?.progressSum ?? 0;
    const latest = latestByIntern.get(row.id);

    return {
      id: row.id,
      name: row.name,
      email: row.email,
      avatarUrl: row.avatarUrl,
      internshipId: row.internshipId,
      internshipStatus: row.internshipStatus,
      departmentName: row.departmentName,
      startDate: row.startDate,
      endDate: row.endDate,
      totalTasks: total,
      completedTasks: completed,
      blockedTasks: bucket?.blocked ?? 0,
      activeTaskTitle: latest?.title ?? null,
      activeTaskStatus: latest?.status ?? null,
      todayProgress: total === 0 ? 0 : Math.round(progressSum / total),
      submittedToday: submittedIds.has(row.id),
      hasBlocker: (bucket?.blocked ?? 0) > 0,
    };
  });
}

/** Admin intern directory with search + department/status filters. */
export async function getInternsForAdmin(options: {
  q?: string;
  departmentId?: string;
  status?: InternshipStatus;
  mentorId?: string;
  page?: number;
} = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = PAGE_SIZE.interns;
  const offset = (page - 1) * pageSize;

  const mentor = db.$with("m").as(db.select().from(users));
  void mentor; // placeholder to keep imports explicit; not used

  const conditions = [];
  if (options.q) {
    conditions.push(
      or(ilike(users.name, `%${options.q}%`), ilike(users.email, `%${options.q}%`)),
    );
  }
  if (options.departmentId) conditions.push(eq(internships.departmentId, options.departmentId));
  if (options.status) conditions.push(eq(internships.status, options.status));
  if (options.mentorId) conditions.push(eq(internships.mentorId, options.mentorId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        internshipId: internships.id,
        internshipStatus: internships.status,
        startDate: internships.startDate,
        endDate: internships.endDate,
        departmentName: departments.name,
        mentorId: internships.mentorId,
      })
      .from(internships)
      .innerJoin(users, eq(internships.userId, users.id))
      .leftJoin(departments, eq(internships.departmentId, departments.id))
      .where(where)
      .orderBy(asc(users.name))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(internships)
      .innerJoin(users, eq(internships.userId, users.id))
      .where(where),
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

/** Full intern profile, guarded by resource-level authorization. */
export async function getInternDetail(user: SessionUser, internId: string) {
  await assertCanViewIntern(user, internId);

  const [row] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      internshipId: internships.id,
      internshipStatus: internships.status,
      startDate: internships.startDate,
      endDate: internships.endDate,
      mentorId: internships.mentorId,
      departmentId: internships.departmentId,
      departmentName: departments.name,
    })
    .from(internships)
    .innerJoin(users, eq(internships.userId, users.id))
    .leftJoin(departments, eq(internships.departmentId, departments.id))
    .where(eq(internships.userId, internId))
    .limit(1);

  if (!row) return null;

  let mentorName: string | null = null;
  if (row.mentorId) {
    const [mentor] = await db
      .select({ name: users.name })
      .from(users)
      .where(eq(users.id, row.mentorId))
      .limit(1);
    mentorName = mentor?.name ?? null;
  }

  return { ...row, mentorName };
}

/** Interns that exist as users but have no internship row yet. */
export async function getUnassignedInterns() {
  const withInternship = await db.select({ userId: internships.userId }).from(internships);
  const excluded = withInternship.map((row) => row.userId);

  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(
      and(
        eq(users.role, "INTERN"),
        excluded.length > 0 ? notInArray(users.id, excluded) : isNull(users.id),
      ),
    )
    .orderBy(asc(users.name));
}
