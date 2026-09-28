"use server";

import bcrypt from "bcryptjs";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { users } from "@/db/schema";
import { errorState, successState, type FormState } from "@/lib/form-state";
import {
  createUserSchema,
  resetPasswordSchema,
  updateUserSchema,
} from "@/lib/validations/users";
import { assertAdmin, AuthorizationError } from "@/server/permissions";
import { getSessionUser } from "@/server/auth/session";

import { handleActionError, zodToFormState } from "../server/action-utils";

const BCRYPT_ROUNDS = 10;

export async function createUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await getSessionUser();
    if (!actor) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
    assertAdmin(actor);

    const parsed = createUserSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: formData.get("role"),
      avatarUrl: formData.get("avatarUrl") || undefined,
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const email = parsed.data.email.trim().toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return errorState("Email sudah terdaftar.", { email: ["Email sudah terdaftar."] });
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);

    await db.insert(users).values({
      name: parsed.data.name,
      email,
      passwordHash,
      role: parsed.data.role,
      avatarUrl: parsed.data.avatarUrl ?? null,
    });

    revalidatePath("/users");
    revalidatePath("/mentors");
    revalidatePath("/interns");
    return successState();
  } catch (error) {
    return handleActionError(error, "createUser");
  }
}

export async function updateUserAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await getSessionUser();
    if (!actor) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
    assertAdmin(actor);

    const parsed = updateUserSchema.safeParse({
      userId: formData.get("userId"),
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      isActive: formData.get("isActive") ?? false,
      avatarUrl: formData.get("avatarUrl") || undefined,
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    if (parsed.data.userId === actor.id && !parsed.data.isActive) {
      return errorState("Anda tidak dapat menonaktifkan akun Anda sendiri.");
    }

    const email = parsed.data.email.trim().toLowerCase();

    const [conflict] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.email, email), ne(users.id, parsed.data.userId)))
      .limit(1);

    if (conflict) {
      return errorState("Email sudah digunakan.", { email: ["Email sudah digunakan."] });
    }

    await db
      .update(users)
      .set({
        name: parsed.data.name,
        email,
        role: parsed.data.role,
        isActive: parsed.data.isActive,
        avatarUrl: parsed.data.avatarUrl ?? null,
      })
      .where(eq(users.id, parsed.data.userId));

    revalidatePath("/users");
    revalidatePath(`/users/${parsed.data.userId}`);
    revalidatePath("/mentors");
    revalidatePath("/interns");
    return successState();
  } catch (error) {
    return handleActionError(error, "updateUser");
  }
}

export async function resetPasswordAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    const actor = await getSessionUser();
    if (!actor) throw new AuthorizationError("Sesi Anda berakhir. Silakan masuk kembali.");
    assertAdmin(actor);

    const parsed = resetPasswordSchema.safeParse({
      userId: formData.get("userId"),
      password: formData.get("password"),
    });

    if (!parsed.success) return zodToFormState(parsed.error);

    const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_ROUNDS);

    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, parsed.data.userId));

    revalidatePath(`/users/${parsed.data.userId}`);
    return successState();
  } catch (error) {
    return handleActionError(error, "resetPassword");
  }
}
