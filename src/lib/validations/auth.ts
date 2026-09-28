import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Email tidak valid").max(255),
  password: z.string().min(1, "Password wajib diisi").max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
