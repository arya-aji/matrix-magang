import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { departments, internships, users } from "@/db/schema";
import { PAGE_SIZE } from "@/lib/constants";

export type UserListFilters = {
  q?: string;
  role?: "ADMIN" | "INTERN";
  activeOnly?: boolean;
  page?: number;
};

export async function getUsers(options: UserListFilters = {}) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = PAGE_SIZE.users;
  const offset = (page - 1) * pageSize;

  const conditions = [];

  if (options.q) {
    const pattern = `%${options.q}%`;
    conditions.push(or(ilike(users.name, pattern), ilike(users.email, pattern)));
  }
  if (options.role) conditions.push(eq(users.role, options.role));
  if (options.activeOnly) conditions.push(eq(users.isActive, true));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, totals] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
        avatarUrl: users.avatarUrl,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(where)
      .orderBy(asc(users.name))
      .limit(pageSize)
      .offset(offset),
    db.select({ value: count() }).from(users).where(where),
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

export async function getUserById(userId: string) {
  const [row] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return row ?? null;
}

export async function getDepartments(includeInactive = false) {
  const where = includeInactive ? undefined : eq(departments.isActive, true);

  return db
    .select({
      id: departments.id,
      name: departments.name,
      description: departments.description,
      isActive: departments.isActive,
    })
    .from(departments)
    .where(where)
    .orderBy(asc(departments.name));
}

/** INTERN users who are not linked to an internship yet (for the create dialog). */
export async function getSelectableInterns() {
  return db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .leftJoin(internships, eq(internships.userId, users.id))
    .where(and(eq(users.role, "INTERN"), isNull(internships.id)))
    .orderBy(asc(users.name));
}
