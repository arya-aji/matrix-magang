"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { feedback, tasks } from "@/db/schema";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { createFeedbackSchema } from "@/lib/validations/feedback";
import { assertMentorAccess, AuthorizationError } from "@/server/permissions";
import { getSessionUser } from "@/server/auth/session";
import { isTaskAssignee } from "@/server/queries/tasks";

import { handleActionError, zodToFormState } from "../server/action-utils";

export async function createFeedbackAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await getSessionUser();
    if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");

    if (user.role === "INTERN") {
      return errorState("Intern tidak dapat memberikan feedback.");
    }

    const rawTaskId = formData.get("taskId");
    const taskId = rawTaskId && String(rawTaskId).trim() !== "" ? String(rawTaskId) : null;

    const parsed = createFeedbackSchema.safeParse({
      internId: formData.get("internId"),
      taskId,
      content: formData.get("content"),
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    await assertMentorAccess({ user, internId: parsed.data.internId });

    if (parsed.data.taskId) {
      const [task] = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.id, parsed.data.taskId))
        .limit(1);

      if (!task) return errorState("Tugas tidak ditemukan.");

      const assigned = await isTaskAssignee(parsed.data.taskId, parsed.data.internId);
      if (!assigned) {
        return errorState("Intern tersebut bukan assignee pada tugas ini.");
      }
    }

    await db.insert(feedback).values({
      internId: parsed.data.internId,
      taskId: parsed.data.taskId ?? null,
      authorId: user.id,
      content: parsed.data.content,
    });

    revalidatePath("/tasks");
    revalidatePath("/dashboard");
    revalidatePath("/activity");
    if (parsed.data.taskId) revalidatePath(`/tasks/${parsed.data.taskId}`);
    revalidatePath(`/interns/${parsed.data.internId}`);

    return successState();
  } catch (error) {
    return handleActionError(error, "createFeedback");
  }
}
