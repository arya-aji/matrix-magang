/**
 * Single source of truth for date handling.
 *
 * - Timestamps are stored in UTC.
 * - Business dates (daily activity "today", overdue checks, internship
 *   progress) are always computed in the application timezone.
 *
 * Do not call `new Date()` or timezone conversions anywhere else.
 */

export const APP_TIMEZONE = process.env.APP_TIMEZONE ?? "Asia/Jakarta";

const MS_PER_DAY = 86_400_000;

/** A calendar date in `YYYY-MM-DD` form. */
export type IsoDate = string;

/** Format a `Date` as a `YYYY-MM-DD` string in the application timezone. */
export function toJakartaDateString(date: Date = new Date()): IsoDate {
  // en-CA renders as `YYYY-MM-DD`.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Today's business date in the application timezone. */
export function getTodayJakarta(): IsoDate {
  return toJakartaDateString(new Date());
}

/** Parse a `YYYY-MM-DD` business date into a UTC timestamp at midnight. */
function isoDateToUtc(iso: IsoDate): number {
  const [year, month, day] = iso.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/** Inclusive-safe day difference between two business dates. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((isoDateToUtc(to) - isoDateToUtc(from)) / MS_PER_DAY);
}

/** Add (or subtract) days from a business date. */
export function addDays(iso: IsoDate, days: number): IsoDate {
  const next = new Date(isoDateToUtc(iso) + days * MS_PER_DAY);
  return next.toISOString().slice(0, 10);
}

/** Format a business date for display, e.g. `28 Sep 2026`. */
export function formatDate(iso: IsoDate | null | undefined, locale = "id-ID"): string {
  if (!iso) return "-";
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDateToUtc(iso)));
}

/** Format a timestamp in the application timezone, e.g. `28 Sep 2026, 09.32`. */
export function formatDateTime(
  value: Date | string | null | undefined,
  locale = "id-ID",
): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Format a timestamp as time only, e.g. `09.32`. */
export function formatTime(value: Date | string | null | undefined, locale = "id-ID"): string {
  if (!value) return "-";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale, {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Long, human friendly date used on dashboards, e.g. `Senin, 28 September 2026`. */
export function formatLongDate(iso: IsoDate, locale = "id-ID"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDateToUtc(iso)));
}

export type InternshipProgressInput = {
  startDate: IsoDate;
  endDate: IsoDate;
  status?: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED" | null;
  today?: IsoDate;
};

export type InternshipProgress = {
  currentDay: number;
  totalDays: number;
  elapsedDays: number;
  progressPercentage: number;
};

/**
 * Internship progress per PRD §31, clamped to 0–100.
 * COMPLETED is always 100%, UPCOMING is always 0%.
 */
export function calculateInternshipProgress({
  startDate,
  endDate,
  status,
  today = getTodayJakarta(),
}: InternshipProgressInput): InternshipProgress {
  const totalDays = Math.max(daysBetween(startDate, endDate), 0);
  const elapsedDays = Math.max(daysBetween(startDate, today), 0);

  if (status === "COMPLETED") {
    return {
      currentDay: totalDays,
      totalDays,
      elapsedDays: totalDays,
      progressPercentage: 100,
    };
  }

  if (status === "UPCOMING") {
    return { currentDay: 0, totalDays, elapsedDays: 0, progressPercentage: 0 };
  }

  const progressPercentage =
    totalDays <= 0 ? 0 : Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  return {
    currentDay: Math.min(elapsedDays, totalDays),
    totalDays,
    elapsedDays,
    progressPercentage,
  };
}

/**
 * Overdue is never stored — it is derived: `due_date < today AND status != COMPLETED`.
 */
export function isOverdue(
  dueDate: IsoDate | null | undefined,
  status: string,
  today: IsoDate = getTodayJakarta(),
): boolean {
  if (!dueDate) return false;
  if (status === "COMPLETED") return false;
  return dueDate < today;
}

/** `true` when the business date is strictly in the past. */
export function isPastDate(iso: IsoDate, today: IsoDate = getTodayJakarta()): boolean {
  return iso < today;
}

export function isToday(iso: IsoDate, today: IsoDate = getTodayJakarta()): boolean {
  return iso === today;
}

/** First and last calendar day of the month containing `iso`. */
export function getMonthBounds(iso: IsoDate = getTodayJakarta()): { start: IsoDate; end: IsoDate } {
  const [year, month] = iso.split("-").map(Number);
  const paddedMonth = String(month).padStart(2, "0");
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  return {
    start: `${year}-${paddedMonth}-01`,
    end: `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`,
  };
}

/* -------------------------------------------------------------------------- */
/* Month helpers (used by the calendar view)                                   */
/* -------------------------------------------------------------------------- */

/** `YYYY-MM` key for the month containing `iso`. */
export function getMonthKey(iso: IsoDate = getTodayJakarta()): string {
  return iso.slice(0, 7);
}

export function getDaysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Shift a `YYYY-MM` key by `delta` months. */
export function shiftMonth(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Monday-first weekday offset (0 = Monday) of the first day of the month. */
export function getMonthStartOffset(monthKey: string): number {
  const [year, month] = monthKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay(); // 0 = Sunday
  return (weekday + 6) % 7;
}

/** Every ISO date in the month, in order. */
export function getMonthDates(monthKey: string): IsoDate[] {
  const days = getDaysInMonth(monthKey);
  return Array.from(
    { length: days },
    (_, index) => `${monthKey}-${String(index + 1).padStart(2, "0")}`,
  );
}

/** e.g. `September 2026`. */
export function formatMonthLabel(monthKey: string, locale = "id-ID"): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(new Date(`${monthKey}-01T00:00:00Z`));
}

/** Day-of-month number, e.g. 28. */
export function getDayOfMonth(iso: IsoDate): number {
  return Number(iso.slice(8, 10));
}

export function isFutureDate(iso: IsoDate, today: IsoDate = getTodayJakarta()): boolean {
  return iso > today;
}

export function isFutureMonth(monthKey: string, today: IsoDate = getTodayJakarta()): boolean {
  return monthKey > today.slice(0, 7);
}

/** Indonesian weekday short labels, Monday-first (matches the calendar grid). */
export const WEEKDAY_LABELS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"] as const;
