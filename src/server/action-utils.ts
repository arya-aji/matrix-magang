import type { ZodError } from "zod";

import { errorState, type FormState } from "@/lib/form-state";
import { logger } from "@/lib/logger";

import { AuthorizationError } from "./permissions";

/** Convert a Zod error into field-keyed messages safe to render in the UI. */
export function zodToFormState(error: ZodError): FormState {
  const fieldErrors: Record<string, string[]> = {};

  for (const issue of error.issues) {
    const key = issue.path.map((part) => String(part)).join(".") || "_form";
    fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
  }

  const firstMessage = error.issues[0]?.message ?? "Input tidak valid.";

  return errorState(firstMessage, fieldErrors);
}

/**
 * Central error funnel for server actions. Never leaks internals to the client
 * (PRD §46); technical details are logged server-side only.
 */
export function handleActionError(error: unknown, context: string): FormState {
  if (error instanceof AuthorizationError) {
    return errorState(error.message);
  }

  const errorId = crypto.randomUUID();
  logger.error("action.failed", {
    context,
    errorId,
    reason: error instanceof Error ? error.name : typeof error,
  });

  return errorState(`Terjadi kesalahan. Silakan coba lagi. (ref: ${errorId.slice(0, 8)})`);
}
