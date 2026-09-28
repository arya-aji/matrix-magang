/** Serializable form state shared between server actions and client forms. */
export type FormState = {
  ok: boolean;
  error: string | null;
  fieldErrors?: Record<string, string[]>;
};

export const idleFormState: FormState = { ok: false, error: null };

export function successState(): FormState {
  return { ok: true, error: null };
}

export function errorState(
  error: string,
  fieldErrors?: Record<string, string[]>,
): FormState {
  return fieldErrors ? { ok: false, error, fieldErrors } : { ok: false, error };
}
