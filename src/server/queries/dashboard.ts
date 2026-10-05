import { eq } from "drizzle-orm";

import { db } from "@/db";
import { departments, internships } from "@/db/schema";
import { addDays, calculateInternshipProgress, getTodayJakarta } from "@/lib/date";

import { getEntriesForInternDate, getEntryTotalsByDate } from "./entries";
import { getMonitoringRows, type MonitoringRow } from "./interns";
import { getSettings } from "./settings";

export type InternDashboard = Awaited<ReturnType<typeof getInternDashboard>>;

export async function getInternDashboard(internId: string) {
  const today = getTodayJakarta();
  const { dailyTarget: target } = await getSettings();

  const [internshipRow] = await db
    .select({
      id: internships.id,
      startDate: internships.startDate,
      endDate: internships.endDate,
      status: internships.status,
      departmentName: departments.name,
    })
    .from(internships)
    .leftJoin(departments, eq(internships.departmentId, departments.id))
    .where(eq(internships.userId, internId))
    .limit(1);

  const internship = internshipRow
    ? {
        ...internshipRow,
        ...calculateInternshipProgress({
          startDate: internshipRow.startDate,
          endDate: internshipRow.endDate,
          status: internshipRow.status,
          today,
        }),
      }
    : null;

  const [todayEntries, week] = await Promise.all([
    getEntriesForInternDate(internId, today),
    getEntryTotalsByDate(internId, addDays(today, -6), today),
  ]);

  const todayTotal = todayEntries.length;
  const percent = target > 0 ? Math.min(100, Math.round((todayTotal / target) * 100)) : 0;

  return {
    today,
    internship,
    target,
    todayEntries,
    todayTotal,
    percent,
    met: todayTotal >= target,
    week,
    weekTotal: week.reduce((sum, day) => sum + day.total, 0),
  };
}

export type AdminDashboard = {
  today: string;
  target: number;
  totalInterns: number;
  totalEntries: number;
  metCount: number;
  top: MonitoringRow[];
  below: MonitoringRow[];
};

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const today = getTodayJakarta();
  const monitoring = await getMonitoringRows(today);

  const sorted = [...monitoring.rows].sort((a, b) => b.total - a.total);

  return {
    today,
    target: monitoring.target,
    totalInterns: monitoring.rows.length,
    totalEntries: monitoring.totalEntries,
    metCount: monitoring.metCount,
    top: sorted.slice(0, 5),
    below: sorted
      .filter((row) => !row.met)
      .reverse()
      .slice(0, 5),
  };
}
