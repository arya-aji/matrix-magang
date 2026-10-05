import { z } from "zod";

import { isoDateSchema } from "./common";

export const entryKindSchema = z.enum(["USAHA", "KELUARGA"]);

/** One document-entry row: a single name entered by an intern. */
export const createEntrySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nama wajib diisi")
    .max(200, "Maksimal 200 karakter"),
  kind: entryKindSchema,
  note: z.string().trim().max(2000, "Maksimal 2000 karakter").optional(),
  entryDate: isoDateSchema.optional(),
});

export const deleteEntrySchema = z.object({
  entryId: z.uuid("Entri tidak valid"),
});

export type CreateEntryInput = z.infer<typeof createEntrySchema>;
export type DeleteEntryInput = z.infer<typeof deleteEntrySchema>;
