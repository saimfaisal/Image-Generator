import { z } from "zod";

export const generationCreateSchema = z.object({
  prompt: z.string().trim().min(3, "Prompt must be at least 3 characters.").max(4000, "Prompt must be 4000 characters or fewer."),
  aspectRatio: z.enum(["1:1", "16:9", "9:16", "4:3", "3:4"]).default("1:1"),
  quality: z.enum(["standard", "high"]).default("standard"),
  imageCount: z.coerce.number().int().min(1).max(4).default(1),
  model: z.string().trim().min(1).max(80).optional(),
  projectId: z.string().cuid().nullable().optional(),
});
