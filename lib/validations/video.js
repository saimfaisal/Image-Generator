import { z } from "zod";

export const videoCreateSchema = z.object({
  prompt: z.string().trim().min(3).max(4000),
  aspectRatio: z.enum(["16:9", "9:16"]).default("16:9"),
  durationSeconds: z.coerce.number().int().min(4).max(8).default(8),
  resolution: z.enum(["720p", "1080p"]).default("720p"),
  projectId: z.string().cuid().nullable().optional(),
  model: z.string().trim().min(1).max(100).optional(),
});
