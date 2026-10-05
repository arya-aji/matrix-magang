/**
 * Domain constants and Indonesian UI labels.
 *
 * Values are derived from the database enum definitions so the two can never
 * drift apart.
 */

export const APP_NAME = "INMA";
export const APP_TAGLINE = "Monitoring Target Entri Dokumen";

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  INTERN: "Intern",
};

export const ENTRY_KIND_LABELS = {
  USAHA: "Usaha",
  KELUARGA: "Keluarga",
} as const;

export const INTERNSHIP_STATUS_LABELS = {
  UPCOMING: "Akan Datang",
  ACTIVE: "Aktif",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
} as const;

export const ENTRY_KINDS = ["USAHA", "KELUARGA"] as const;
export const INTERNSHIP_STATUSES = ["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"] as const;

export const PAGE_SIZE = {
  entries: 100,
  interns: 20,
  users: 20,
} as const;
