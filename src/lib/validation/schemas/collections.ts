import { z } from "zod";
import { COLLECTION_COLORS } from "@/types/collection";

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be 50 characters or less"),
  color: z
    .string()
    .regex(hexColorRegex, "Color must be a valid hex color")
    .refine(
      (color) =>
        COLLECTION_COLORS.includes(color as (typeof COLLECTION_COLORS)[number]),
      "Color must be one of the allowed colors",
    ),
});

export const updateCollectionSchema = createCollectionSchema.partial();

export type CreateCollectionBody = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionBody = z.infer<typeof updateCollectionSchema>;
