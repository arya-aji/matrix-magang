import { count, desc, eq, ne } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import { db } from "@/db";
import { departments, feedback, internships, taskAssignees, tasks, users } from "@/db/schema";
import { calculateInternshipProgress, getTodayJakarta, isOverdue } from "@/lib/date";

import { getActivityTasks, getTodayActivity, getSubmittedInternIds } from "./activities";
import { getMentorInterns } from "./interns";
import { getTaskStatsForInterns } from "./tasks";

const mentorUser = alias(users, "mentor_user");
const authorUser = alias(users, "author_user");

export type InternDashboard = Awaited<ReturnType<typeof getInternDashboard>>;

export async function getInternDashboard(internId: string) {
  const today = getTodayJakarta();

  const [internshipRow] = await db
    .select({
      id: internships.id,
      startDate: internships.startDate,
      endDate: internships.endDate,
      status: internships.status,
      departmentName: departments.name,
      mentorName: mentorUser.name,
    })
    .from(internships)
    .leftJoin(departments, eq(internships.departmentId, departments.id))
    .leftJoin(mentorUser, eq(internships.mentorId, mentorUser.id))
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

  const taskRows = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      status: tasks.status,
      priority: tasks.priority,
      progress: tasks.progress,
      dueDate: tasks.dueDate,
    })
    .from(tasks)
    .innerJoin(taskAssignees, eq(taskAssignees.taskId, tasks.id))
    .where(eq(taskAssignees.userId, internId))
    .orderBy(desc(tasks.updatedAt));

  const totalTasks = taskRows.length;
  const completedTasks = taskRows.filter((task) => task.status === "COMPLETED").length;
  const blockedTasks = taskRows.filter((task) => task.status === "BLOCKED").length;
  const overdueTasks = taskRows.filter((task) =>
    isOverdue(task.dueDate, task.status, today),
  ).length;
  const activeTasks = totalTasks - completedTasks;
  const progress =
    totalTasks === 0
      ? 0
      : Math.round(taskRows.reduce((sum, task) => sum + task.progress, 0) / totalTasks);

  const activeTaskList = taskRows.filter((task) => task.status !== "COMPLETED").slice(0, 5);

  const [activity, recentFeedback] = await Promise.all([
    getTodayActivity(internId),
    db
      .select({
        id: feedback.id,
        content: feedback.content,
        createdAt: feedback.createdAt,
        authorName: authorUser.name,
      })
      .from(feedback)
      .innerJoin(authorUser, eq(feedback.authorId, authorUser.id))
      .where(eq(feedback.internId, internId))
      .orderBy(desc(feedback.createdAt))
      .limit(3),
  ]);

  const activityTasks = activity ? await getActivityTasks(activity.id) : [];

  return {
    internship,
    today: {
      date: today,
      tasks: activeTaskList,
      completedTasks,
      totalTasks,
      activeTasks,
      blockedTasks,
      overdueTasks,
      progress,
    },
    dailyActivity: {
      submitted: activity?.status === "SUBMITTED",
      activity,
      /** Work items already recorded today, shown on the dashboard. */
      tasks: activityTasks,
    },
    recentFeedback,
    blockers: taskRows.filter((task) => task.status === "BLOCKED"),
  };
}

export type MentorDashboard = Awaited<ReturnType<typeof getMentorDashboard>>;

export async function getMentorDashboard(mentorId: string) {
  const interns = await getMentorInterns(mentorId);
  const stats = await getTaskStatsForInterns(interns.map((intern) => intern.id));

  return {
    internCount: interns.length,
    activeTasks: stats.activeTasks,
    blockedTasks: stats.blockedTasks,
    overdueTasks: stats.overdueTasks,
    todayUpdates: interns.filter((intern) => intern.submittedToday).length,
    interns,
  };
}

export type AdminDashboard = Awaited<ReturnType<typeof getAdminDashboard>>;

export async function getAdminDashboard() {
  const today = getTodayJakarta();

  const [internCountRows, mentorCountRows, userCountRows, departmentCountRows, activeInternIds] =
    await Promise.all([
      db.select({ value: count() }).from(users).where(eq(users.role, "INTERN")),
      db.select({ value: count() }).from(users).where(eq(users.role, "MENTOR")),
      db.select({ value: count() }).from(users),
      db.select({ value: count() }).from(departments),
      db.select({ userId: internships.userId }).from(internships).where(ne(internships.status, "CANCELLED")),
    ]);

  const internIds = activeInternIds.map((row) => row.userId);
  const [stats, submittedIds] = await Promise.all([
    getTaskStatsForInterns(internIds),
    getSubmittedInternIds(internIds, today),
  ]);

  return {
    today,
    internCount: Number(internCountRows[0]?.value ?? 0),
    mentorCount: Number(mentorCountRows[0]?.value ?? 0),
    userCount: Number(userCountRows[0]?.value ?? 0),
    departmentCount: Number(departmentCountRows[0]?.value ?? 0),
    activeTasks: stats.activeTasks,
    blockedTasks: stats.blockedTasks,
    overdueTasks: stats.overdueTasks,
    todayUpdates: submittedIds.size,
  };
}
