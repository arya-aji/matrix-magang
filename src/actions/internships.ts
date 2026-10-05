"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { departments, internships, users } from "@/db/schema";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { createInternSchema, updateInternshipSchema } from "@/lib/validations/users";
import { assertAdmin, AuthorizationError } from "@/server/permissions";
import { getSessionUser } from "@/server/auth/session";

import { handleActionError, zodToFormState } from "../server/action-utils";

function optionalValue(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

async function validateDepartment(departmentId?: string | null) {
  if (!departmentId) return null;

  const [department] = await db
    .select({ id: departments.id })
    .from(departments)
    .where(eq(departments.id, departmentId))
    .limit(1);

  if (!department) return "Departemen tidak ditemukan.";
  return null;
}

export async function createInternshipAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await getSessionUser();
    if (!actor) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
    assertAdmin(actor);

    const parsed = createInternSchema.safeParse({
      userId: formData.get("userId"),
      departmentId: optionalValue(formData.get("departmentId")) ?? null,
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      status: formData.get("status") || "ACTIVE",
    });

    if (!parsed.success) return zodToFormState(parsed.error);
    if (parsed.data.endDate < parsed.data.startDate) {
      return errorState("Tanggal selesai tidak boleh sebelum tanggal mulai.");
    }

    const [internUser] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, parsed.data.userId))
      .limit(1);

    if (!internUser) return errorState("User tidak ditemukan.");
    if (internUser.role !== "INTERN") {
      return errorState("User yang dipilih bukan INTERN.");
    }

    const [existing] = await db
      .select({ id: internships.id })
      .from(internships)
      .where(eq(internships.userId, parsed.data.userId))
      .limit(1);

    if (existing) {
      return errorState("Intern ini sudah memiliki data magang.");
    }

    const referenceError = await validateDepartment(parsed.data.departmentId);
    if (referenceError) return errorState(referenceError);

    await db.insert(internships).values({
      userId: parsed.data.userId,
      departmentId: parsed.data.departmentId ?? null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      status: parsed.data.status,
    });

    revalidatePath("/interns");
    revalidatePath("/dashboard");
    return successState();
  } catch (error) {
    return handleActionError(error, "createInternship");
  }
}

export async function updateInternshipAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await getSessionUser();
    if (!actor) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
    assertAdmin(actor);

    const parsed = updateInternshipSchema.safeParse({
      internshipId: formData.get("internshipId"),
      userId: formData.get("userId"),
      departmentId: optionalValue(formData.get("departmentId")) ?? null,
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      status: formData.get("status"),
    });

    if (!parsed.success) return zodToFormState(parsed.error);
    if (parsed.data.endDate < parsed.data.startDate) {
      return errorState("Tanggal selesai tidak boleh sebelum tanggal mulai.");
    }

    const referenceError = await validateDepartment(parsed.data.departmentId);
    if (referenceError) return errorState(referenceError);

    await db
      .update(internships)
      .set({
        departmentId: parsed.data.departmentId ?? null,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        status: parsed.data.status,
      })
      .where(eq(internships.id, parsed.data.internshipId));

    revalidatePath("/interns");
    revalidatePath(`/interns/${parsed.data.userId}`);
    revalidatePath("/dashboard");
    return successState();
  } catch (error) {
    return handleActionError(error, "updateInternship");
  }
}
