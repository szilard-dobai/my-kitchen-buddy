import { z } from "zod";

const tagNameRegex = /^[a-zA-Z0-9_]+$/;

export const createTagSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(30, "Name must be 30 characters or less")
    .regex(tagNameRegex, "Only letters, numbers, and underscores allowed"),
});

export const updateTagSchema = createTagSchema.partial();

export type CreateTagBody = z.infer<typeof createTagSchema>;
export type UpdateTagBody = z.infer<typeof updateTagSchema>;
