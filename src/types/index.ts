import type { InternshipStatus, UserRole } from "@/db/schema";

export type { InternshipStatus, UserRole };

/** Serializable session user used across the app. */
export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string | null;
};

/**
 * Every server action returns this discriminated union so callers can render
 * user-friendly errors without leaking internals.
 */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };
