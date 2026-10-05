"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { successState, type FormState } from "@/lib/form-state";
import { updateSettingsSchema } from "@/lib/validations/settings";
import { getSessionUser } from "@/server/auth/session";
import { assertAdmin, AuthorizationError } from "@/server/permissions";
import { getSettings } from "@/server/queries/settings";

import { handleActionError, zodToFormState } from "../server/action-utils";

export async function updateSettingsAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await getSessionUser();
    if (!actor) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
    assertAdmin(actor);

    const parsed = updateSettingsSchema.safeParse({
      dailyTarget: formData.get("dailyTarget"),
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const settings = await getSettings();
    await db
      .update(appSettings)
      .set({ dailyTarget: parsed.data.dailyTarget })
      .where(eq(appSettings.id, settings.id));

    revalidatePath("/settings");
    revalidatePath("/monitoring");
    revalidatePath("/dashboard");
    revalidatePath("/entri");
    return successState();
  } catch (error) {
    return handleActionError(error, "updateSettings");
  }
}
