/** Helpers for reading App Router `searchParams` (which may be string | string[]). */

export function readString(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value ?? undefined;
}

export function readNumber(
  value: string | string[] | undefined,
  fallback = 1,
): number {
  const raw = readString(value);
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export type SearchParams = Record<string, string | string[] | undefined>;
