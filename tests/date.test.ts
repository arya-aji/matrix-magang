import { describe, expect, it } from "vitest";

import {
  addDays,
  calculateInternshipProgress,
  daysBetween,
  formatDate,
  getMonthBounds,
  getTodayJakarta,
  isOverdue,
} from "@/lib/date";

describe("date utilities (Asia/Jakarta business dates)", () => {
  it("renders today as a YYYY-MM-DD string", () => {
    expect(getTodayJakarta()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("adds and subtracts days across month boundaries", () => {
    expect(addDays("2026-09-28", 3)).toBe("2026-10-01");
    expect(addDays("2026-10-01", -1)).toBe("2026-09-30");
  });

  it("computes day differences", () => {
    expect(daysBetween("2026-01-01", "2026-01-11")).toBe(10);
    expect(daysBetween("2026-01-11", "2026-01-01")).toBe(-10);
  });

  it("returns month bounds including leap-year February", () => {
    expect(getMonthBounds("2026-09-15")).toEqual({ start: "2026-09-01", end: "2026-09-30" });
    expect(getMonthBounds("2024-02-10")).toEqual({ start: "2024-02-01", end: "2024-02-29" });
  });

  it("formats business dates", () => {
    expect(formatDate("2026-09-28", "en-GB")).toBe("28 Sept 2026");
    expect(formatDate(null)).toBe("-");
  });
});

describe("calculateInternshipProgress", () => {
  const base = { startDate: "2026-01-01", endDate: "2026-01-11" };

  it("computes elapsed / total days and percentage", () => {
    const result = calculateInternshipProgress({ ...base, today: "2026-01-06" });
    expect(result.totalDays).toBe(10);
    expect(result.elapsedDays).toBe(5);
    expect(result.currentDay).toBe(5);
    expect(result.progressPercentage).toBe(50);
  });

  it("clamps before the start date to 0", () => {
    const result = calculateInternshipProgress({ ...base, today: "2025-12-01" });
    expect(result.elapsedDays).toBe(0);
    expect(result.progressPercentage).toBe(0);
  });

  it("clamps after the end date to 100", () => {
    const result = calculateInternshipProgress({ ...base, today: "2026-06-01" });
    expect(result.progressPercentage).toBe(100);
  });

  it("forces COMPLETED to 100%", () => {
    const result = calculateInternshipProgress({
      ...base,
      status: "COMPLETED",
      today: "2026-01-02",
    });
    expect(result.progressPercentage).toBe(100);
  });

  it("forces UPCOMING to 0%", () => {
    const result = calculateInternshipProgress({
      ...base,
      status: "UPCOMING",
      today: "2026-01-06",
    });
    expect(result.progressPercentage).toBe(0);
  });
});

describe("isOverdue", () => {
  const today = "2026-09-28";

  it("is true for a past due date that is not completed", () => {
    expect(isOverdue("2026-09-27", "IN_PROGRESS", today)).toBe(true);
    expect(isOverdue("2026-09-27", "BLOCKED", today)).toBe(true);
  });

  it("is false when completed, due today, in the future, or absent", () => {
    expect(isOverdue("2026-09-27", "COMPLETED", today)).toBe(false);
    expect(isOverdue("2026-09-28", "IN_PROGRESS", today)).toBe(false);
    expect(isOverdue("2026-09-30", "IN_PROGRESS", today)).toBe(false);
    expect(isOverdue(null, "IN_PROGRESS", today)).toBe(false);
  });
});
