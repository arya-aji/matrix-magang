"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { taskActivityLogs, tasks, type TaskStatus } from "@/db/schema";
import { errorState, successState, type FormState } from "@/lib/form-state";
import {
  createTaskSchema,
  updateTaskProgressSchema,
  updateTaskSchema,
} from "@/lib/validations/tasks";
import { assertMentorAccessToInterns, AuthorizationError } from "@/server/permissions";
import { getSessionUser } from "@/server/auth/session";
import {
  findNonInternIds,
  getTaskForUser,
  setTaskAssignees,
} from "@/server/queries/tasks";

import { handleActionError, zodToFormState } from "../server/action-utils";

async function requireUserOrThrow() {
  const user = await getSessionUser();
  if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
  return user;
}

function revalidateTaskViews(taskId?: string) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (taskId) revalidatePath(`/tasks/${taskId}`);
}

export async function createTaskAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await requireUserOrThrow();

    if (user.role === "INTERN") {
      return errorState("Intern tidak dapat membuat tugas.");
    }

    const assigneeIds = formData
      .getAll("assigneeIds")
      .map((value) => String(value))
      .filter(Boolean);

    const parsed = createTaskSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      assigneeIds,
      priority: formData.get("priority") || "MEDIUM",
      startDate: formData.get("startDate") || null,
      dueDate: formData.get("dueDate") || null,
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const invalidAssignees = await findNonInternIds(parsed.data.assigneeIds);
    if (invalidAssignees.length > 0) {
      return errorState("Assignee harus berupa intern yang aktif.");
    }

    await assertMentorAccessToInterns({ user, internIds: parsed.data.assigneeIds });

    const [created] = await db
      .insert(tasks)
      .values({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        createdBy: user.id,
        priority: parsed.data.priority,
        startDate: parsed.data.startDate ?? null,
        dueDate: parsed.data.dueDate ?? null,
      })
      .returning({ id: tasks.id });

    if (created) {
      await setTaskAssignees(created.id, parsed.data.assigneeIds);

      await db.insert(taskActivityLogs).values({
        taskId: created.id,
        actorId: user.id,
        type: "CREATED",
        description: `Tugas dibuat oleh ${user.name} untuk ${parsed.data.assigneeIds.length} intern.`,
      });
    }

    revalidateTaskViews(created?.id);
  } catch (error) {
    return handleActionError(error, "createTask");
  }

  redirect("/tasks");
}

export async function updateTaskAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await requireUserOrThrow();

    const assigneeIds = formData
      .getAll("assigneeIds")
      .map((value) => String(value))
      .filter(Boolean);

    const parsed = updateTaskSchema.safeParse({
      taskId: formData.get("taskId"),
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      assigneeIds,
      priority: formData.get("priority"),
      startDate: formData.get("startDate") || null,
      dueDate: formData.get("dueDate") || null,
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    if (user.role === "INTERN") {
      return errorState("Intern tidak dapat mengubah detail tugas.");
    }

    const task = await getTaskForUser(user, parsed.data.taskId);
    if (!task) return errorState("Tugas tidak ditemukan.");

    const invalidAssignees = await findNonInternIds(parsed.data.assigneeIds);
    if (invalidAssignees.length > 0) {
      return errorState("Assignee harus berupa intern yang aktif.");
    }

    await assertMentorAccessToInterns({ user, internIds: parsed.data.assigneeIds });

    await db
      .update(tasks)
      .set({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        priority: parsed.data.priority,
        startDate: parsed.data.startDate ?? null,
        dueDate: parsed.data.dueDate ?? null,
      })
      .where(eq(tasks.id, parsed.data.taskId));

    await setTaskAssignees(parsed.data.taskId, parsed.data.assigneeIds);

    await db.insert(taskActivityLogs).values({
      taskId: parsed.data.taskId,
      actorId: user.id,
      type: "COMMENTED",
      description: `Detail tugas dan assignee diperbarui oleh ${user.name}.`,
    });

    revalidateTaskViews(parsed.data.taskId);
    return successState();
  } catch (error) {
    return handleActionError(error, "updateTask");
  }
}

/**
 * Progress/status update.
 * Rules (PRD §28): COMPLETED forces progress 100 and sets `completed_at`;
 * moving away from COMPLETED clears it.
 */
export async function updateTaskProgressAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await requireUserOrThrow();

    const rawProgress = formData.get("progress");
    const progressValue =
      rawProgress === null || String(rawProgress).trim() === "" ? undefined : rawProgress;

    const parsed = updateTaskProgressSchema.safeParse({
      taskId: formData.get("taskId"),
      progress: progressValue,
      status: formData.get("status") || undefined,
      comment: formData.get("comment") || undefined,
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const task = await getTaskForUser(user, parsed.data.taskId);
    if (!task) return errorState("Tugas tidak ditemukan.");

    const previousStatus = task.status;
    const previousProgress = task.progress;

    let nextProgress = parsed.data.progress ?? previousProgress;
    let nextStatus: TaskStatus = parsed.data.status ?? previousStatus;
    let completedAt = task.completedAt;

    if (parsed.data.status === "COMPLETED") {
      nextProgress = 100;
      completedAt = new Date();
    } else if (parsed.data.status && previousStatus === "COMPLETED") {
      completedAt = null;
    } else if (
      parsed.data.progress !== undefined &&
      !parsed.data.status &&
      previousStatus !== "BLOCKED" &&
      previousStatus !== "REVIEW"
    ) {
      // No explicit status: derive the recommended one from progress.
      if (nextProgress >= 100) {
        nextStatus = "COMPLETED";
        completedAt = new Date();
      } else if (nextProgress <= 1) {
        nextStatus = "TODO";
        completedAt = null;
      } else {
        nextStatus = "IN_PROGRESS";
        completedAt = null;
      }
    }

    await db
      .update(tasks)
      .set({
        progress: nextProgress,
        status: nextStatus,
        completedAt,
      })
      .where(eq(tasks.id, parsed.data.taskId));

    const logs: {
      taskId: string;
      actorId: string;
      type: "STATUS_CHANGED" | "PROGRESS_CHANGED" | "COMPLETED" | "COMMENTED";
      oldValue: string | null;
      newValue: string | null;
      description: string | null;
    }[] = [];

    if (previousStatus !== nextStatus) {
      logs.push({
        taskId: task.id,
        actorId: user.id,
        type: nextStatus === "COMPLETED" ? "COMPLETED" : "STATUS_CHANGED",
        oldValue: previousStatus,
        newValue: nextStatus,
        description: `${user.name} mengubah status menjadi ${nextStatus}.`,
      });
    }

    if (previousProgress !== nextProgress) {
      logs.push({
        taskId: task.id,
        actorId: user.id,
        type: "PROGRESS_CHANGED",
        oldValue: String(previousProgress),
        newValue: String(nextProgress),
        description: `${user.name} memperbarui progress menjadi ${nextProgress}%.`,
      });
    }

    if (parsed.data.comment) {
      logs.push({
        taskId: task.id,
        actorId: user.id,
        type: "COMMENTED",
        oldValue: null,
        newValue: null,
        description: parsed.data.comment,
      });
    }

    if (logs.length > 0) {
      await db.insert(taskActivityLogs).values(logs);
    }

    revalidateTaskViews(task.id);
    return successState();
  } catch (error) {
    return handleActionError(error, "updateTaskProgress");
  }
}

export async function deleteTaskAction(formData: FormData): Promise<void> {
  const user = await requireUserOrThrow();
  const taskId = String(formData.get("taskId") ?? "");

  if (user.role === "INTERN") {
    throw new AuthorizationError();
  }

  const task = await getTaskForUser(user, taskId);
  if (!task) return;

  await db.delete(tasks).where(eq(tasks.id, taskId));

  revalidateTaskViews();
  redirect("/tasks");
}
