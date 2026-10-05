import { and, asc, count, eq, ilike, notInArray, or } from "drizzle-orm";

import { db } from "@/db";
import {
  departments,
  internships,
  users,
  type InternshipStatus,
} from "@/db/schema";
import { PAGE_SIZE } from "@/lib/constants";

import { getEntryCountsForInterns } from "./entries";
import { getSettings } from "./settings";

export type MonitoringRow = {
  internId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  internshipStatus: InternshipStatus;
  departmentName: string | null;
  total: number;
  target: number;
  percent: number;
  met: boolean;
};

export type MonitoringResult = {
  target: number;
  rows: MonitoringRow[];
  totalEntries: number;
  metCount: number;
};

/**
 * Every active intern with their entry total for one business date, compared to
 * the shared daily target. Uses two queries (roster + grouped counts).
 */
export async function getMonitoringRows(date: string): Promise<MonitoringResult> {
  const { dailyTarget: target } = await getSettings();

  const roster = await db
    .select({
      internId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      internshipStatus: internships.status,
      departmentName: departments.name,
    })
    .from(internships)
    .innerJoin(users, eq(internships.userId, users.id))
    .leftJoin(departments, eq(internships.departmentId, departments.id))
    .where(and(eq(users.isActive, true), notInArray(internships.status, ["CANCELLED"])))
    .orderBy(asc(users.name));

  const counts = await getEntryCountsForInterns(
    roster.map((row) => row.internId),
    date,
  );

  const rows: MonitoringRow[] = roster.map((row) => {
    const total = counts.get(row.internId) ?? 0;
    const percent = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;
    return { ...row, total, target, percent, met: total >= target };
  });

  return {
    target,
    rows,
    totalEntries: rows.reduce((sum, row) => sum + row.total, 0),
    metCount: rows.filter((row) => row.met).length,
  };
}

export type InternDetailRow = {
  internId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  internshipId: string | null;
  internshipStatus: InternshipStatus | null;
  departmentId: string | null;
  departmentName: string | null;
  startDate: string | null;
  endDate: string | null;
};

/** Intern + internship info for a single intern (drill-down / admin). */
export async function getInternDetail(internId: string): Promise<InternDetailRow | null> {
  const [row] = await db
    .select({
      internId: users.id,
      name: users.name,
      email: users.email,
      avatarUrl: users.avatarUrl,
      isActive: users.isActive,
      internshipId: internships.id,
      internshipStatus: internships.status,
      departmentId: internships.departmentId,
      departmentName: departments.name,
      startDate: internships.startDate,
      endDate: internships.endDate,
    })
    .from(users)
    .leftJoin(internships, eq(internships.userId, users.id))
    .leftJoin(departments, eq(internships.departmentId, departments.id))
    .where(eq(users.id, internId))
    .limit(1);

  return row ?? null;
}

export type InternRosterRow = {
  internId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  isActive: boolean;
  internshipId: string | null;
  internshipStatus: InternshipStatus | null;
  departmentId: string | null;
  departmentName: string | null;
  startDate: string | null;
  endDate: string | null;
};

/** Admin intern directory (search + department/status filters). */
export async function getInternsRoster(
  options: {
    q?: string;
    departmentId?: string;
    status?: InternshipStatus;
    page?: number;
  } = {},
) {
  const page = Math.max(1, options.page ?? 1);
  const pageSize = PAGE_SIZE.interns;
  const offset = (page - 1) * pageSize;

  const conditions = [eq(users.role, "INTERN")];
  if (options.q) {
    conditions.push(
      or(ilike(users.name, `%${options.q}%`), ilike(users.email, `%${options.q}%`))!,
    );
  }
  if (options.departmentId) conditions.push(eq(internships.departmentId, options.departmentId));
  if (options.status) conditions.push(eq(internships.status, options.status));

  const where = and(...conditions);

  const [rows, totals] = await Promise.all([
    db
      .select({
        internId: users.id,
        name: users.name,
        email: users.email,
        avatarUrl: users.avatarUrl,
        isActive: users.isActive,
        internshipId: internships.id,
        internshipStatus: internships.status,
        departmentId: internships.departmentId,
        departmentName: departments.name,
        startDate: internships.startDate,
        endDate: internships.endDate,
      })
      .from(users)
      .leftJoin(internships, eq(internships.userId, users.id))
      .leftJoin(departments, eq(internships.departmentId, departments.id))
      .where(where)
      .orderBy(asc(users.name))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ value: count() })
      .from(users)
      .leftJoin(internships, eq(internships.userId, users.id))
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
