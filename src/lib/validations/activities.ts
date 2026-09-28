import { z } from "zod";

import { isoDateSchema } from "./tasks";

export const saveDailyActivitySchema = z
  .object({
    /** Empty id means "create today's activity", otherwise update that row. */
    id: z.uuid().optional(),
    /** Admins may act on behalf of an intern; interns are forced to their own id. */
    internId: z.uuid().optional(),
    activityDate: isoDateSchema.optional(),
    /**
     * The work items the intern worked on, chosen from the mentor-assigned
     * tasks. "Pekerjaan di-setting oleh mentor, magang tinggal memilih."
     */
    taskIds: z.array(z.uuid("Pekerjaan tidak valid")).max(20).default([]),
    /** Optional free-text note; the structured work item is the dropdown. */
    summary: z.string().trim().min(5, "Minimal 5 karakter").max(5000, "Maksimal 5000 karakter").optional(),
    progress: z.coerce.number().int().min(0).max(100).optional(),
    blocker: z.string().trim().max(2000, "Maksimal 2000 karakter").optional(),
    nextStep: z.string().trim().max(2000, "Maksimal 2000 karakter").optional(),
  })
  .refine((data) => data.taskIds.length > 0 || Boolean(data.summary), {
    message: "Pilih minimal satu pekerjaan dari mentor (atau tulis ringkasan).",
    path: ["taskIds"],
  });

export type SaveDailyActivityInput = z.infer<typeof saveDailyActivitySchema>;
