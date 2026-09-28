import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { internships } from "@/db/schema";
import type { SessionUser } from "@/types";

/**
 * Resource-level authorization.
 *
 * These run close to the database, in server components and server actions —
 * middleware is never the only gate (PRD §49).
 */

export class AuthorizationError extends Error {
  constructor(message = "Anda tidak memiliki akses ke resource ini.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}

/** The active internship row for an intern, if any. */
export async function getInternshipByUserId(userId: string) {
  const [row] = await db
    .select()
    .from(internships)
    .where(eq(internships.userId, userId))
    .limit(1);
  return row ?? null;
}

/** The internship row by internship id. */
export async function getInternshipById(internshipId: string) {
  const [row] = await db
    .select()
    .from(internships)
    .where(eq(internships.id, internshipId))
    .limit(1);
  return row ?? null;
}

/** Whether `mentorId` is the assigned mentor for `internId`. */
export async function isMentorOf(mentorId: string, internId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: internships.id })
    .from(internships)
    .where(and(eq(internships.userId, internId), eq(internships.mentorId, mentorId)))
    .limit(1);
  return Boolean(row);
}

/**
 * Mentor-scoped access check. Admins bypass this (they can see everything).
 * Throws `AuthorizationError` when access must be denied.
 */
export async function assertMentorAccess({
  user,
  internId,
}: {
  user: SessionUser;
  internId: string;
}): Promise<void> {
  if (user.role === "ADMIN") return;

  if (user.role !== "MENTOR") {
    throw new AuthorizationError();
  }

  const assigned = await isMentorOf(user.id, internId);
  if (!assigned) {
    throw new AuthorizationError();
  }
}

/** Interns may only act on their own records. */
export function assertInternOwnership({
  user,
  internId,
}: {
  user: SessionUser;
  internId: string;
}): void {
  if (user.role === "ADMIN") return;
  if (user.id !== internId) {
    throw new AuthorizationError();
  }
}

/**
 * Whether a user may read an intern's data: admin → always, mentor → only
 * assigned interns, intern → only self.
 */
export async function canViewIntern(user: SessionUser, internId: string): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  if (user.role === "INTERN") return user.id === internId;
  return isMentorOf(user.id, internId);
}

/** Throwing variant of {@link canViewIntern}. */
export async function assertCanViewIntern(user: SessionUser, internId: string): Promise<void> {
  const allowed = await canViewIntern(user, internId);
  if (!allowed) {
    throw new AuthorizationError();
  }
}

/** Admin-only operations (user management, departments, criteria). */
export function assertAdmin(user: SessionUser): void {
  if (user.role !== "ADMIN") {
    throw new AuthorizationError("Hanya admin yang dapat melakukan aksi ini.");
  }
}

/**
 * Mentor-scoped access check for a *set* of interns (multi-assignee tasks).
 * Requires the mentor to be assigned to every one of them. Admins bypass.
 */
export async function assertMentorAccessToInterns({
  user,
  internIds,
}: {
  user: SessionUser;
  internIds: string[];
}): Promise<void> {
  if (user.role === "ADMIN") return;

  if (user.role !== "MENTOR") {
    throw new AuthorizationError();
  }

  if (internIds.length === 0) return;

  const rows = await db
    .select({ userId: internships.userId })
    .from(internships)
    .where(
      and(eq(internships.mentorId, user.id), inArray(internships.userId, internIds)),
    );

  const covered = new Set(rows.map((row) => row.userId));
  if (internIds.some((id) => !covered.has(id))) {
    throw new AuthorizationError();
  }
}
