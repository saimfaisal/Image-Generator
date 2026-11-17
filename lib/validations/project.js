import { z } from "zod";

export const projectCreateSchema = z.object({ name: z.string().trim().min(1, "Project name is required.").max(120), description: z.string().trim().max(500).optional().nullable() });
export const projectUpdateSchema = projectCreateSchema.partial();
