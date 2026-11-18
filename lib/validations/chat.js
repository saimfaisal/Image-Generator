import { z } from "zod";

export const conversationCreateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  projectId: z.string().cuid().nullable().optional(),
});

export const chatMessageSchema = z.object({
  content: z.string().trim().min(1, "Message cannot be empty.").max(12_000, "Message must be 12,000 characters or fewer."),
  stream: z.boolean().default(false),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
