import { and, asc, count, eq, ilike, or } from "drizzle-orm";

import { db } from "@/db";
import { departments, internships, users } from "@/db/schema";
import { PAGE_SIZE } from "@/lib/constants";

export type UserListFilters = {
  q?: string;
  role?: "ADMIN" | "MENTOR" | "INTERN";
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

export async function getMentorsWithCounts() {
  const [rows, counts] = await Promise.all([
    db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.role, "MENTOR"))
      .orderBy(asc(users.name)),
    db
      .select({ mentorId: internships.mentorId, value: count() })
      .from(internships)
      .groupBy(internships.mentorId),
  ]);

  const countMap = new Map(counts.map((row) => [row.mentorId, Number(row.value)]));

  return rows.map((row) => ({ ...row, internCount: countMap.get(row.id) ?? 0 }));
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

export async function getMentorOptions() {
  return db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(eq(users.role, "MENTOR"))
    .orderBy(asc(users.name));
}
