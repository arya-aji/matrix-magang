import { and, asc, count, desc, eq, exists, ilike, inArray, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import {
  feedback,
  internships,
  taskActivityLogs,
  taskAssignees,
  tasks,
  users,
  type TaskPriority,
  type TaskStatus,
} from "@/db/schema";
import { getTodayJakarta } from "@/lib/date";
import type { SessionUser } from "@/types";

import { AuthorizationError } from "../permissions";

const creatorUser = alias(users, "creator_user");

export type TaskAssigneeSummary = { id: string; name: string };

export type TaskListItem = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;
  startDate: string | null;
  dueDate: string | null;
  completedAt: Date | null;
  updatedAt: Date;
  createdByName: string;
  assignees: TaskAssigneeSummary[];
};

const taskSelection = {
  id: tasks.id,
  title: tasks.title,
  status: tasks.status,
  priority: tasks.priority,
  progress: tasks.progress,
  startDate: tasks.startDate,
  dueDate: tasks.dueDate,
  completedAt: tasks.completedAt,
  updatedAt: tasks.updatedAt,
  createdByName: creatorUser.name,
};

/**
 * Loads assignees for a batch of tasks in a single query and groups them in
 * memory — avoids an N+1 query per task row.
 */
export async function getAssigneesForTasks(
  taskIds: string[],
): Promise<Map<string, TaskAssigneeSummary[]>> {
  const grouped = new Map<string, TaskAssigneeSummary[]>();
  if (taskIds.length === 0) return grouped;

  const rows = await db
    .select({ taskId: taskAssignees.taskId, id: users.id, name: users.name })
    .from(taskAssignees)
    .innerJoin(users, eq(taskAssignees.userId, users.id))
    .where(inArray(taskAssignees.taskId, taskIds))
    .orderBy(asc(users.name));

  for (const row of rows) {
    const bucket = grouped.get(row.taskId) ?? [];
    bucket.push({ id: row.id, name: row.name });
    grouped.set(row.taskId, bucket);
  }

  return grouped;
}

/** Intern ids currently assigned to a mentor. Single query, reused everywhere. */
export async function getMentorInternIds(mentorId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: internships.userId })
    .from(internships)
    .where(eq(internships.mentorId, mentorId));

  return rows.map((row) => row.userId);
}

/** `true` when the given user is an assignee of the task. */
export async function isTaskAssignee(taskId: string, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ taskId: taskAssignees.taskId })
    .from(taskAssignees)
    .where(and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)))
    .limit(1);

  return Boolean(row);
}

export async function getTaskAssigneeIds(taskId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: taskAssignees.userId })
    .from(taskAssignees)
    .where(eq(taskAssignees.taskId, taskId));

  return rows.map((row) => row.userId);
}

/**
 * Ordering per PRD §66: blocked → overdue → in progress/review → todo →
 * completed, then `due_date ASC`.
 */
function operationalOrder(today: string) {
  return [
    sql`case when ${tasks.status} = 'BLOCKED' then 0 else 1 end`,
    sql`case when ${tasks.dueDate} is not null and ${tasks.dueDate} < ${today} and ${tasks.status} <> 'COMPLETED' then 0 else 1 end`,
    sql`case ${tasks.status} when 'IN_PROGRESS' then 1 when 'REVIEW' then 2 when 'TODO' then 3 when 'COMPLETED' then 4 else 5 end`,
    sql`${tasks.dueDate} asc nulls last`,
    desc(tasks.updatedAt),
  ];
}

export type TaskFilters = {
  q?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  dueBefore?: string;
  page?: number;
  pageSize?: number;
};

/**
 * Role-scoped, filterable, paginated task list.
 * - ADMIN sees everything
 * - MENTOR sees tasks for assigned interns (or tasks they created)
 * - INTERN sees only tasks they are assigned to
 */
export async function getTasksForUser(user: SessionUser, filters: TaskFilters = {}) {
  const today = getTodayJakarta();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? 20;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (user.role === "INTERN") {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(taskAssignees)
          .where(and(eq(taskAssignees.taskId, tasks.id), eq(taskAssignees.userId, user.id))),
      ),
    );
  } else if (user.role === "MENTOR") {
    const internIds = await getMentorInternIds(user.id);
    const assignedToMyInterns =
      internIds.length > 0
        ? exists(
            db
              .select({ one: sql`1` })
              .from(taskAssignees)
              .where(
                and(
                  eq(taskAssignees.taskId, tasks.id),
                  inArray(taskAssignees.userId, internIds),
                ),
              ),
          )
        : sql`false`;

    conditions.push(or(assignedToMyInterns, eq(tasks.createdBy, user.id)));
  }

  if (filters.q) conditions.push(ilike(tasks.title, `%${filters.q}%`));
  if (filters.status) conditions.push(eq(tasks.status, filters.status));
  if (filters.priority) conditions.push(eq(tasks.priority, filters.priority));
  if (filters.dueBefore) conditions.push(lte(tasks.dueDate, filters.dueBefore));
  if (filters.assigneeId) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(taskAssignees)
          .where(
            and(
              eq(taskAssignees.taskId, tasks.id),
              eq(taskAssignees.userId, filters.assigneeId),
            ),
          ),
      ),
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totals] = await Promise.all([
    db
      .select(taskSelection)
      .from(tasks)
      .innerJoin(creatorUser, eq(tasks.createdBy, creatorUser.id))
      .where(where)
      .orderBy(...operationalOrder(today))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(tasks).where(where),
  ]);

  const assigneeMap = await getAssigneesForTasks(rows.map((row) => row.id));

  const items: TaskListItem[] = rows.map((row) => ({
    ...row,
    assignees: assigneeMap.get(row.id) ?? [],
  }));

  const total = Number(totals[0]?.value ?? 0);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export type InternTaskStats = {
  activeTasks: number;
  blockedTasks: number;
  overdueTasks: number;
  completedTasks: number;
  totalTasks: number;
  perIntern: Map<
    string,
    { total: number; completed: number; blocked: number; progressSum: number }
  >;
};

/**
 * Task aggregates for a set of interns.
 *
 * A task shared by two interns counts once in the global totals and once for
 * each assigned intern in `perIntern`.
 */
export async function getTaskStatsForInterns(internIds: string[]): Promise<InternTaskStats> {
  const empty: InternTaskStats = {
    activeTasks: 0,
    blockedTasks: 0,
    overdueTasks: 0,
    completedTasks: 0,
    totalTasks: 0,
    perIntern: new Map(),
  };

  if (internIds.length === 0) return empty;

  const today = getTodayJakarta();

  // Global totals: DISTINCT tasks that have at least one of these interns.
  const distinctTasks = await db
    .select({
      id: tasks.id,
      status: tasks.status,
      progress: tasks.progress,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .where(
      exists(
        db
          .select({ one: sql`1` })
          .from(taskAssignees)
          .where(
            and(
              eq(taskAssignees.taskId, tasks.id),
              inArray(taskAssignees.userId, internIds),
            ),
          ),
      ),
    );

  // Per-intern totals: one row per (task, intern) assignment.
  const assignmentRows = await db
    .select({
      userId: taskAssignees.userId,
      status: tasks.status,
      progress: tasks.progress,
      dueDate: tasks.dueDate,
    })
    .from(taskAssignees)
    .innerJoin(tasks, eq(taskAssignees.taskId, tasks.id))
    .where(inArray(taskAssignees.userId, internIds));

  const perIntern = new Map<
    string,
    { total: number; completed: number; blocked: number; progressSum: number }
  >();

  for (const row of assignmentRows) {
    const bucket =
      perIntern.get(row.userId) ?? { total: 0, completed: 0, blocked: 0, progressSum: 0 };

    bucket.total += 1;
    bucket.progressSum += row.progress;
    if (row.status === "COMPLETED") bucket.completed += 1;
    if (row.status === "BLOCKED") bucket.blocked += 1;

    perIntern.set(row.userId, bucket);
  }

  let activeTasks = 0;
  let blockedTasks = 0;
  let overdueTasks = 0;
  let completedTasks = 0;

  for (const task of distinctTasks) {
    if (task.status === "COMPLETED") {
      completedTasks += 1;
      continue;
    }

    activeTasks += 1;
    if (task.status === "BLOCKED") blockedTasks += 1;
    if (task.dueDate && task.dueDate < today) overdueTasks += 1;
  }

  return {
    activeTasks,
    blockedTasks,
    overdueTasks,
    completedTasks,
    totalTasks: distinctTasks.length,
    perIntern,
  };
}

export async function getTaskById(taskId: string) {
  const [row] = await db
    .select({
      ...taskSelection,
      description: tasks.description,
      createdBy: tasks.createdBy,
      createdAt: tasks.createdAt,
    })
    .from(tasks)
    .innerJoin(creatorUser, eq(tasks.createdBy, creatorUser.id))
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!row) return null;

  const assigneeMap = await getAssigneesForTasks([row.id]);

  return { ...row, assignees: assigneeMap.get(row.id) ?? [] };
}

/** Loads a task and enforces who may read it. */
export async function getTaskForUser(user: SessionUser, taskId: string) {
  const task = await getTaskById(taskId);
  if (!task) return null;

  if (user.role === "ADMIN") return task;

  const assigneeIds = task.assignees.map((assignee) => assignee.id);

  if (user.role === "INTERN") {
    if (!assigneeIds.includes(user.id)) throw new AuthorizationError();
    return task;
  }

  // Mentor: creator, or mentor of at least one assignee.
  if (task.createdBy === user.id) return task;

  const assignedToMyIntern = await hasMentorOverAny(user.id, assigneeIds);
  if (!assignedToMyIntern) throw new AuthorizationError();

  return task;
}

/** Whether `mentorId` mentors any of the given interns. */
async function hasMentorOverAny(mentorId: string, internIds: string[]): Promise<boolean> {
  if (internIds.length === 0) return false;

  const [row] = await db
    .select({ id: internships.id })
    .from(internships)
    .where(
      and(
        eq(internships.mentorId, mentorId),
        inArray(internships.userId, internIds),
      ),
    )
    .limit(1);

  return Boolean(row);
}

/** Convenience wrapper used by tasks that need the same mentor check. */
export async function isMentorOfAny(mentorId: string, internIds: string[]) {
  return hasMentorOverAny(mentorId, internIds);
}

export async function getTaskTimeline(taskId: string) {
  return db
    .select({
      id: taskActivityLogs.id,
      type: taskActivityLogs.type,
      oldValue: taskActivityLogs.oldValue,
      newValue: taskActivityLogs.newValue,
      description: taskActivityLogs.description,
      createdAt: taskActivityLogs.createdAt,
      actorName: users.name,
    })
    .from(taskActivityLogs)
    .innerJoin(users, eq(taskActivityLogs.actorId, users.id))
    .where(eq(taskActivityLogs.taskId, taskId))
    .orderBy(desc(taskActivityLogs.createdAt))
    .limit(50);
}

export async function getTaskFeedback(taskId: string) {
  return db
    .select({
      id: feedback.id,
      content: feedback.content,
      createdAt: feedback.createdAt,
      authorName: users.name,
      authorRole: users.role,
    })
    .from(feedback)
    .innerJoin(users, eq(feedback.authorId, users.id))
    .where(eq(feedback.taskId, taskId))
    .orderBy(desc(feedback.createdAt))
    .limit(20);
}

/** Minimal, selectable list of interns for task assignment forms. */
export async function getAssignableInterns(user: SessionUser) {
  if (user.role === "ADMIN") {
    return db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(and(eq(users.role, "INTERN"), eq(users.isActive, true)))
      .orderBy(asc(users.name));
  }

  if (user.role === "MENTOR") {
    return db
      .select({ id: users.id, name: users.name })
      .from(internships)
      .innerJoin(users, eq(internships.userId, users.id))
      .where(eq(internships.mentorId, user.id))
      .orderBy(asc(users.name));
  }

  return [];
}

/** Validates that every id belongs to an active INTERN; returns invalid ids. */
export async function findNonInternIds(ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];

  const rows = await db
    .select({ id: users.id })
    .from(users)
    .where(and(inArray(users.id, ids), eq(users.role, "INTERN"), eq(users.isActive, true)));

  const valid = new Set(rows.map((row) => row.id));
  return ids.filter((id) => !valid.has(id));
}

/**
 * Which of the given task ids are NOT assigned to `userId`.
 * Used to stop an intern from logging work against someone else's task.
 */
export async function findTasksNotAssignedTo(
  taskIds: string[],
  userId: string,
): Promise<string[]> {
  if (taskIds.length === 0) return [];

  const rows = await db
    .select({ taskId: taskAssignees.taskId })
    .from(taskAssignees)
    .where(
      and(inArray(taskAssignees.taskId, taskIds), eq(taskAssignees.userId, userId)),
    );

  const assigned = new Set(rows.map((row) => row.taskId));
  return taskIds.filter((id) => !assigned.has(id));
}

/** Replaces the assignee set of a task (used by create/update). */
export async function setTaskAssignees(taskId: string, assigneeIds: string[]) {
  await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId));

  if (assigneeIds.length === 0) return;

  await db
    .insert(taskAssignees)
    .values(assigneeIds.map((userId) => ({ taskId, userId })))
    .onConflictDoNothing();
}
