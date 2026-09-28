"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { departments } from "@/db/schema";
import { errorState, successState, type FormState } from "@/lib/form-state";
import { departmentSchema } from "@/lib/validations/users";
import { assertAdmin, AuthorizationError } from "@/server/permissions";
import { getSessionUser } from "@/server/auth/session";

import { handleActionError, zodToFormState } from "../server/action-utils";

function optionalValue(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  const text = String(value).trim();
  return text === "" ? undefined : text;
}

export async function saveDepartmentAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await getSessionUser();
    if (!actor) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
    assertAdmin(actor);

    const parsed = departmentSchema.safeParse({
      id: optionalValue(formData.get("id")),
      name: formData.get("name"),
      description: optionalValue(formData.get("description")),
      isActive: formData.get("isActive") ?? false,
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const values = {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      isActive: parsed.data.isActive,
    };

    if (parsed.data.id) {
      await db.update(departments).set(values).where(eq(departments.id, parsed.data.id));
    } else {
      const [existing] = await db
        .select({ id: departments.id })
        .from(departments)
        .where(eq(departments.name, parsed.data.name))
        .limit(1);

      if (existing) {
        return errorState("Nama departemen sudah ada.", { name: ["Nama sudah digunakan."] });
      }

      await db.insert(departments).values(values);
    }

    revalidatePath("/departments");
    revalidatePath("/interns");
    return successState();
  } catch (error) {
    return handleActionError(error, "saveDepartment");
  }
}

export async function toggleDepartmentAction(formData: FormData): Promise<void> {
  const actor = await getSessionUser();
  if (!actor) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
  assertAdmin(actor);

  const departmentId = String(formData.get("departmentId") ?? "");
  if (!departmentId) return;

  const [department] = await db
    .select({ id: departments.id, isActive: departments.isActive })
    .from(departments)
    .where(eq(departments.id, departmentId))
    .limit(1);

  if (!department) return;

  await db
    .update(departments)
    .set({ isActive: !department.isActive })
    .where(eq(departments.id, departmentId));

  revalidatePath("/departments");
}
