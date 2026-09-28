/**
 * Domain constants and Indonesian UI labels.
 *
 * Values are derived from the database enum definitions so the two can never
 * drift apart.
 */

export const APP_NAME = "INMA";
export const APP_TAGLINE = "Internship Performance Matrix";

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  MENTOR: "Mentor",
  INTERN: "Intern",
};

export const TASK_STATUS_LABELS = {
  TODO: "Todo",
  IN_PROGRESS: "Dikerjakan",
  BLOCKED: "Terhambat",
  REVIEW: "Review",
  COMPLETED: "Selesai",
} as const;

export const TASK_PRIORITY_LABELS = {
  LOW: "Rendah",
  MEDIUM: "Sedang",
  HIGH: "Tinggi",
} as const;

export const ACTIVITY_STATUS_LABELS = {
  DRAFT: "Draft",
  SUBMITTED: "Terkirim",
} as const;

export const INTERNSHIP_STATUS_LABELS = {
  UPCOMING: "Akan Datang",
  ACTIVE: "Aktif",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
} as const;

export const REVIEW_STATUS_LABELS = {
  DRAFT: "Draft",
  FINAL: "Final",
} as const;

export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "COMPLETED"] as const;
export const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export const INTERNSHIP_STATUSES = ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

export const PAGE_SIZE = {
  tasks: 20,
  activities: 20,
  interns: 20,
  users: 20,
  feedback: 20,
} as const;
