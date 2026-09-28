import type {
  DailyActivityStatus,
  InternshipStatus,
  ReviewStatus,
  TaskLogType,
  TaskPriority,
  TaskStatus,
  UserRole,
} from "@/db/schema";

export type { DailyActivityStatus, InternshipStatus, ReviewStatus, TaskLogType, TaskPriority, TaskStatus, UserRole };

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
 * user-friendly errors without leaking internals (PRD §46).
 */
export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: undefined } : { data: T }))
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };
