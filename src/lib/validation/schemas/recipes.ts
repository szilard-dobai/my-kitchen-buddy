import { z } from "zod";

const ingredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
  category: z.string().optional(),
});

const instructionSchema = z.object({
  stepNumber: z.number().int().positive(),
  description: z.string().min(1),
  duration: z.string().optional(),
  technique: z.string().optional(),
});

const nutritionValueSchema = z.object({
  calories: z.number().optional(),
  protein: z.number().optional(),
  carbs: z.number().optional(),
  fat: z.number().optional(),
  fiber: z.number().optional(),
  sugar: z.number().optional(),
  sodium: z.number().optional(),
});

const nutritionSchema = z.object({
  perServing: nutritionValueSchema.optional(),
  per100g: nutritionValueSchema.optional(),
});

const sourceSchema = z.object({
  url: z.string(),
  platform: z.enum(["tiktok", "instagram", "youtube", "other"]),
  authorUsername: z.string().optional(),
  authorId: z.string().optional(),
  authorAvatarUrl: z.string().optional(),
  thumbnailUrl: z.string().optional(),
});

const extractionMetadataSchema = z.object({
  extractedAt: z.coerce.date(),
  confidenceScore: z.number().optional(),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  cuisineType: z.string().optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  prepTime: z.string().optional(),
  cookTime: z.string().optional(),
  totalTime: z.string().optional(),
  servings: z.string().optional(),
  caloriesPerServing: z.number().optional(),
  nutrition: nutritionSchema.optional(),
  dietaryTags: z.array(z.string()).default([]),
  mealType: z.string().optional(),
  ingredients: z.array(ingredientSchema).default([]),
  instructions: z.array(instructionSchema).default([]),
  tipsAndNotes: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  source: sourceSchema.optional(),
  extractionMetadata: extractionMetadataSchema.optional(),
});

export const updateRecipeSchema = createRecipeSchema.partial();

export type CreateRecipeBody = z.infer<typeof createRecipeSchema>;
export type UpdateRecipeBody = z.infer<typeof updateRecipeSchema>;
