import { z } from "zod";

/** `YYYY-MM-DD` business date. */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
  .refine((value) => !Number.isNaN(Date.parse(`${value}T00:00:00Z`)), "Tanggal tidak valid");

export const optionalIsoDateSchema = isoDateSchema.optional().nullable();

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "REVIEW", "COMPLETED"]);

export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

/**
 * A task can be assigned to one or more interns (PRD extension: "setiap tugas
 * bisa dikerjakan lebih dari 1 orang").
 */
export const assigneeIdsSchema = z
  .array(z.uuid("Assignee tidak valid"))
  .min(1, "Pilih minimal satu intern")
  .max(20, "Maksimal 20 intern per tugas");

export const createTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Judul wajib diisi").max(200, "Maksimal 200 karakter"),
    description: z.string().trim().max(5000, "Maksimal 5000 karakter").optional(),
    assigneeIds: assigneeIdsSchema,
    priority: taskPrioritySchema.default("MEDIUM"),
    startDate: optionalIsoDateSchema,
    dueDate: optionalIsoDateSchema,
  })
  .refine(
    (data) => !data.startDate || !data.dueDate || data.dueDate >= data.startDate,
    { message: "Tenggat tidak boleh sebelum tanggal mulai", path: ["dueDate"] },
  );

export const updateTaskSchema = z
  .object({
    taskId: z.uuid(),
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).optional(),
    assigneeIds: assigneeIdsSchema,
    priority: taskPrioritySchema,
    startDate: optionalIsoDateSchema,
    dueDate: optionalIsoDateSchema,
  })
  .refine(
    (data) => !data.startDate || !data.dueDate || data.dueDate >= data.startDate,
    { message: "Tenggat tidak boleh sebelum tanggal mulai", path: ["dueDate"] },
  );

export const updateTaskProgressSchema = z
  .object({
    taskId: z.uuid("Task tidak valid"),
    progress: z.coerce
      .number()
      .int("Progress harus bilangan bulat")
      .min(0, "Progress minimal 0")
      .max(100, "Progress maksimal 100")
      .optional(),
    status: taskStatusSchema.optional(),
    comment: z.string().trim().max(2000, "Maksimal 2000 karakter").optional(),
  })
  .refine((data) => data.progress !== undefined || data.status !== undefined || !!data.comment, {
    message: "Tidak ada perubahan yang dikirim",
  });

export const taskFilterSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.uuid().optional(),
  dueBefore: isoDateSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskProgressInput = z.infer<typeof updateTaskProgressSchema>;
export type TaskFilterInput = z.infer<typeof taskFilterSchema>;
