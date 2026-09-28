import { redirect } from "next/navigation";

import { AuthorizationError } from "./index";

/**
 * Runs a data-access function and converts an authorization failure into the
 * 403 page. Use in server components only.
 */
export async function guard<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof AuthorizationError) {
      redirect("/403");
    }
    throw error;
  }
}
