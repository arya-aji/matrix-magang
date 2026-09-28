"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { dailyActivities } from "@/db/schema";
import { getTodayJakarta } from "@/lib/date";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { saveDailyActivitySchema } from "@/lib/validations/activities";
import { AuthorizationError } from "@/server/permissions";
import { getSessionUser } from "@/server/auth/session";
import { setActivityTasks } from "@/server/queries/activities";
import { findTasksNotAssignedTo } from "@/server/queries/tasks";

import { handleActionError, zodToFormState } from "../server/action-utils";

function optionalValue(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

/**
 * Create or update the current user's activity for today.
 * Past dates are intentionally not editable (PRD §26).
 */
export async function saveDailyActivityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await getSessionUser();
    if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");

    const parsed = saveDailyActivitySchema.safeParse({
      id: optionalValue(formData.get("id")),
      internId: optionalValue(formData.get("internId")),
      activityDate: optionalValue(formData.get("activityDate")),
      taskIds: formData
        .getAll("taskIds")
        .map((value) => String(value))
        .filter(Boolean),
      summary: optionalValue(formData.get("summary")),
      progress: optionalValue(formData.get("progress")),
      blocker: optionalValue(formData.get("blocker")),
      nextStep: optionalValue(formData.get("nextStep")),
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    let internId: string;
    if (user.role === "INTERN") {
      internId = user.id;
    } else if (user.role === "ADMIN") {
      if (!parsed.data.internId) {
        return errorState("Pilih intern terlebih dahulu.");
      }
      internId = parsed.data.internId;
    } else {
      return errorState("Mentor tidak dapat mengirim aktivitas harian.");
    }

    const today = getTodayJakarta();
    const requestedDate = parsed.data.activityDate ?? today;

    if (requestedDate !== today) {
      return errorState("Hanya aktivitas hari ini yang dapat diubah.");
    }

    // Interns may only log work against tasks assigned to them.
    const notAssigned = await findTasksNotAssignedTo(parsed.data.taskIds, internId);
    if (notAssigned.length > 0) {
      return errorState("Pekerjaan yang dipilih bukan tugas untuk Anda.");
    }

    const [existing] = await db
      .select({ id: dailyActivities.id })
      .from(dailyActivities)
      .where(
        and(
          eq(dailyActivities.internId, internId),
          eq(dailyActivities.activityDate, today),
        ),
      )
      .limit(1);

    const values = {
      summary: parsed.data.summary ?? null,
      progress: parsed.data.progress ?? null,
      blocker: parsed.data.blocker ?? null,
      nextStep: parsed.data.nextStep ?? null,
    };

    const wantsSubmit = String(formData.get("submit") ?? "") === "1";

    let activityId: string;

    if (existing) {
      await db
        .update(dailyActivities)
        .set(
          wantsSubmit
            ? { ...values, status: "SUBMITTED", submittedAt: new Date() }
            : values,
        )
        .where(eq(dailyActivities.id, existing.id));

      activityId = existing.id;
    } else {
      const [created] = await db
        .insert(dailyActivities)
        .values({
          internId,
          activityDate: today,
          status: wantsSubmit ? "SUBMITTED" : "DRAFT",
          submittedAt: wantsSubmit ? new Date() : null,
          ...values,
        })
        .returning({ id: dailyActivities.id });

      if (!created) return errorState("Gagal menyimpan aktivitas. Silakan coba lagi.");
      activityId = created.id;
    }

    await setActivityTasks(activityId, parsed.data.taskIds);

    revalidatePath("/activity");
    revalidatePath("/calendar");
    revalidatePath("/dashboard");
    return successState();
  } catch (error) {
    return handleActionError(error, "saveDailyActivity");
  }
}

/** Flip today's activity to SUBMITTED. Still editable afterwards (MVP rule). */
export async function submitDailyActivityAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await getSessionUser();
    if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");

    if (user.role !== "INTERN" && user.role !== "ADMIN") {
      return errorState("Anda tidak dapat mengirim aktivitas harian.");
    }

    const today = getTodayJakarta();
    const activityId = optionalValue(formData.get("id"));

    const where =
      user.role === "INTERN"
        ? and(eq(dailyActivities.internId, user.id), eq(dailyActivities.activityDate, today))
        : activityId
          ? eq(dailyActivities.id, activityId)
          : undefined;

    if (!where) return errorState("Aktivitas tidak ditemukan.");

    const [existing] = await db
      .select({ id: dailyActivities.id })
      .from(dailyActivities)
      .where(where)
      .limit(1);

    if (!existing) {
      return errorState("Simpan aktivitas hari ini terlebih dahulu sebelum mengirim.");
    }

    await db
      .update(dailyActivities)
      .set({ status: "SUBMITTED", submittedAt: new Date() })
      .where(eq(dailyActivities.id, existing.id));

    revalidatePath("/activity");
    revalidatePath("/dashboard");
    return successState();
  } catch (error) {
    return handleActionError(error, "submitDailyActivity");
  }
}
