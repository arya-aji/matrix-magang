import { z } from "zod";

import { isoDateSchema } from "./tasks";

export const performanceCriterionSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Nama wajib diisi").max(100, "Maksimal 100 karakter"),
  description: z.string().trim().max(2000).optional(),
  weight: z.coerce.number().int("Bobot harus bilangan bulat").min(0).max(100),
  isActive: z.coerce.boolean().default(true),
});

export const createReviewSchema = z.object({
  internId: z.uuid("Intern tidak valid"),
  periodStart: isoDateSchema,
  periodEnd: isoDateSchema,
  summary: z.string().trim().max(5000).optional(),
});

export const updateReviewScoreSchema = z.object({
  reviewId: z.uuid(),
  criterionId: z.uuid(),
  score: z.coerce.number().int().min(1, "Nilai minimal 1").max(5, "Nilai maksimal 5"),
  comment: z.string().trim().max(2000).optional(),
});

export const finalizeReviewSchema = z.object({
  reviewId: z.uuid(),
  summary: z.string().trim().max(5000).optional(),
});

export type PerformanceCriterionInput = z.infer<typeof performanceCriterionSchema>;
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewScoreInput = z.infer<typeof updateReviewScoreSchema>;
