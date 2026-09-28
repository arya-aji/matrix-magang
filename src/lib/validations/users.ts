import { z } from "zod";

import { isoDateSchema } from "./tasks";

export const roleSchema = z.enum(["ADMIN", "MENTOR", "INTERN"]);

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(120, "Maksimal 120 karakter"),
  email: z.email("Email tidak valid").max(255),
  password: z.string().min(8, "Minimal 8 karakter").max(200),
  role: roleSchema,
  avatarUrl: z.url("URL tidak valid").optional().nullable(),
});

export const updateUserSchema = z.object({
  userId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  email: z.email("Email tidak valid").max(255),
  role: roleSchema,
  isActive: z.coerce.boolean().default(true),
  avatarUrl: z.url("URL tidak valid").optional().nullable(),
});

export const resetPasswordSchema = z.object({
  userId: z.uuid(),
  password: z.string().min(8, "Minimal 8 karakter").max(200),
});

export const createInternSchema = z.object({
  userId: z.uuid("Pilih user dengan role INTERN"),
  mentorId: z.uuid().optional().nullable(),
  departmentId: z.uuid().optional().nullable(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]).default("ACTIVE"),
});

export const updateInternshipSchema = createInternSchema.extend({
  internshipId: z.uuid(),
});

export const departmentSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(1, "Nama wajib diisi").max(120, "Maksimal 120 karakter"),
  description: z.string().trim().max(2000).optional(),
  isActive: z.coerce.boolean().default(true),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateInternInput = z.infer<typeof createInternSchema>;
export type UpdateInternshipInput = z.infer<typeof updateInternshipSchema>;
export type DepartmentInput = z.infer<typeof departmentSchema>;
