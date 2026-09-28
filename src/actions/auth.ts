"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validations/auth";

export type LoginState = { error: string | null };

const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 60_000;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Email atau password tidak valid." };
  }

  const email = parsed.data.email.trim().toLowerCase();
  const limitKey = `login:${email}`;
  const limit = rateLimit(limitKey, LOGIN_LIMIT, LOGIN_WINDOW_MS);

  if (!limit.allowed) {
    logger.warn("auth.rate_limited", { email });
    return {
      error: `Terlalu banyak percobaan. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
    };
  }

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      // Generic message: never reveal whether the account exists.
      return { error: "Email atau password salah." };
    }
    // NEXT_REDIRECT and everything else must bubble up.
    throw error;
  }

  resetRateLimit(limitKey);
  return { error: null };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}
