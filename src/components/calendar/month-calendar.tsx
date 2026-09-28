import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  formatMonthLabel,
  getDayOfMonth,
  getMonthDates,
  getMonthStartOffset,
  shiftMonth,
  WEEKDAY_LABELS,
} from "@/lib/date";
import { cn } from "@/lib/utils";

export type DayIndicator = {
  /** `submitted` / `draft` for interns; `count` for mentors and admins. */
  kind: "none" | "submitted" | "draft";
  count?: number;
};

/** Screen-reader / tooltip text so status is never conveyed by colour alone. */
function describe(indicator: DayIndicator, isFuture: boolean): string {
  if (isFuture) return "belum bisa diisi";
  if (indicator.kind === "submitted") {
    return typeof indicator.count === "number" && indicator.count > 0
      ? `${indicator.count} entri terkirim`
      : "sudah entri (terkirim)";
  }
  if (indicator.kind === "draft") return "masih draft";
  return "belum ada entri";
}

/**
 * Server-rendered month grid. Navigation is plain links (`?month=&date=`) so it
 * works without client JavaScript and stays fast on mobile.
 */
export function MonthCalendar({
  monthKey,
  selectedDate,
  today,
  indicators,
  basePath,
}: {
  monthKey: string;
  selectedDate: string;
  today: string;
  indicators: Map<string, DayIndicator>;
  basePath: string;
}) {
  const offset = getMonthStartOffset(monthKey);
  const days = getMonthDates(monthKey);
  const previousMonth = shiftMonth(monthKey, -1);
  const nextMonth = shiftMonth(monthKey, 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`${basePath}?month=${previousMonth}`} aria-label="Bulan sebelumnya">
            <ChevronLeft className="size-4" aria-hidden />
          </Link>
        </Button>

        <p className="text-sm font-semibold capitalize">{formatMonthLabel(monthKey)}</p>

        <Button variant="outline" size="icon" asChild>
          <Link href={`${basePath}?month=${nextMonth}`} aria-label="Bulan berikutnya">
            <ChevronRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-1">
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, index) => (
          <div key={`pad-${index}`} aria-hidden />
        ))}

        {days.map((day) => {
          const indicator = indicators.get(day) ?? { kind: "none" as const };
          const isToday = day === today;
          const isSelected = day === selectedDate;
          const isFuture = day > today;

          return (
            <Link
              key={day}
              href={`${basePath}?month=${monthKey}&date=${day}`}
              aria-current={isSelected ? "date" : undefined}
              aria-label={`${formatMonthLabel(monthKey)} tanggal ${getDayOfMonth(day)} — ${describe(indicator, isFuture)}`}
              title={describe(indicator, isFuture)}
              className={cn(
                "relative flex aspect-square items-center justify-center rounded-md border text-sm transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 font-semibold"
                  : "border-border hover:bg-muted",
                isFuture && !isSelected && "opacity-45",
              )}
            >
              <span>{getDayOfMonth(day)}</span>

              {indicator.kind === "submitted" ? (
                <span
                  aria-hidden
                  className="absolute bottom-1 size-1.5 rounded-full bg-primary"
                />
              ) : null}

              {indicator.kind === "draft" ? (
                <span
                  aria-hidden
                  className="absolute bottom-1 size-1.5 rounded-full border border-muted-foreground"
                />
              ) : null}

              {indicator.count && indicator.count > 0 ? (
                <span
                  aria-hidden
                  className="absolute bottom-0.5 rounded-full bg-primary px-1 text-[10px] leading-4 font-medium text-primary-foreground"
                >
                  {indicator.count}
                </span>
              ) : null}

              {isToday ? (
                <span
                  aria-hidden
                  className="absolute top-1 right-1 size-1.5 rounded-full bg-foreground/60"
                />
              ) : null}

              <span className="sr-only">{describe(indicator, isFuture)}</span>
            </Link>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-primary" />
          terkirim
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full border border-muted-foreground" />
          draft
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-1.5 rounded-full bg-foreground/60" />
          hari ini
        </span>
        <span className="flex items-center gap-1.5">
          angka = jumlah orang yang entri
        </span>
      </div>
    </div>
  );
}
