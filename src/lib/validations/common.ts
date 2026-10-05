import { z } from "zod";

/** `YYYY-MM-DD` business date. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Tanggal tidak valid");

export const optionalIsoDateSchema = isoDateSchema.optional().nullable();
