import { eq } from "drizzle-orm";

import { db } from "@/db";
import { internships } from "@/db/schema";
import type { SessionUser } from "@/types";

/**
 * Resource-level authorization.
 *
 * These run close to the database, in server components and server actions —
 * middleware is never the only gate.
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

/** The internship row for an intern, if any. */
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

/** Interns may only act on their own records. Admins may act on anyone's. */
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

/** Admin-only operations (user management, departments, settings). */
export function assertAdmin(user: SessionUser): void {
  if (user.role !== "ADMIN") {
    throw new AuthorizationError("Hanya admin yang dapat melakukan aksi ini.");
  }
}

/** Whether a user may read an intern's data: admin → always, intern → only self. */
export function canViewIntern(user: SessionUser, internId: string): boolean {
  if (user.role === "ADMIN") return true;
  return user.id === internId;
}

/** Throwing variant of {@link canViewIntern}. */
export function assertCanViewIntern(user: SessionUser, internId: string): void {
  if (!canViewIntern(user, internId)) {
    throw new AuthorizationError();
  }
}
