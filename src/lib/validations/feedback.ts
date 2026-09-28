import { z } from "zod";

export const createFeedbackSchema = z.object({
  internId: z.uuid("Intern tidak valid"),
  taskId: z.uuid().optional().nullable(),
  content: z.string().trim().min(2, "Minimal 2 karakter").max(5000, "Maksimal 5000 karakter"),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
