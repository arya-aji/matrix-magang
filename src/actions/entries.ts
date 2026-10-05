"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { documentEntries } from "@/db/schema";
import { getTodayJakarta } from "@/lib/date";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { createEntrySchema, deleteEntrySchema } from "@/lib/validations/entries";
import { getSessionUser } from "@/server/auth/session";
import { assertInternOwnership, AuthorizationError } from "@/server/permissions";

import { handleActionError, zodToFormState } from "../server/action-utils";

function revalidateEntryViews() {
  revalidatePath("/entri");
  revalidatePath("/riwayat");
  revalidatePath("/monitoring");
  revalidatePath("/dashboard");
}

export async function createEntryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await getSessionUser();
    if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
    if (user.role !== "INTERN") {
      return errorState("Hanya intern yang dapat menambah entri.");
    }

    const parsed = createEntrySchema.safeParse({
      name: formData.get("name"),
      kind: formData.get("kind"),
      note: formData.get("note") || undefined,
      entryDate: formData.get("entryDate") || undefined,
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const today = getTodayJakarta();
    const entryDate = parsed.data.entryDate ?? today;

    if (entryDate !== today) {
      return errorState("Entri hanya dapat dicatat untuk hari ini.");
    }

    await db.insert(documentEntries).values({
      internId: user.id,
      entryDate,
      name: parsed.data.name,
      kind: parsed.data.kind,
      note: parsed.data.note ?? null,
    });

    revalidateEntryViews();
    return successState();
  } catch (error) {
    return handleActionError(error, "createEntry");
  }
}

export async function deleteEntryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const user = await getSessionUser();
    if (!user) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");

    const parsed = deleteEntrySchema.safeParse({ entryId: formData.get("entryId") });
    if (!parsed.success) return zodToFormState(parsed.error);

    const [entry] = await db
      .select({ id: documentEntries.id, internId: documentEntries.internId })
      .from(documentEntries)
      .where(eq(documentEntries.id, parsed.data.entryId))
      .limit(1);

    if (!entry) return errorState("Entri tidak ditemukan.");

    // Admins may correct any entry; interns only their own.
    assertInternOwnership({ user, internId: entry.internId });

    await db.delete(documentEntries).where(eq(documentEntries.id, parsed.data.entryId));

    revalidateEntryViews();
    return successState();
  } catch (error) {
    return handleActionError(error, "deleteEntry");
  }
}
