import { z } from "zod";

export const updateSettingsSchema = z.object({
  dailyTarget: z.coerce
    .number()
    .int("Target harus bilangan bulat")
    .min(1, "Target minimal 1")
    .max(10_000, "Target maksimal 10000"),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
