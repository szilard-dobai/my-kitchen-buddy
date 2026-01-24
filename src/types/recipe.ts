export interface Ingredient {
  name: string;
  quantity?: string;
  unit?: string;
  notes?: string;
  category?: string;
}

export interface Instruction {
  stepNumber: number;
  description: string;
  duration?: string;
  technique?: string;
}

export interface NutritionInfo {
  perServing?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  per100g?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
}

export interface RecipeSource {
  url: string;
  platform: "tiktok" | "instagram" | "youtube" | "other";
  authorUsername?: string;
  authorId?: string;
  thumbnailUrl?: string;
}

export interface ExtractionMetadata {
  extractedAt: Date;
  confidenceScore?: number;
}

export interface Recipe {
  _id?: string;
  userId: string;
  title: string;
  description?: string;
  cuisineType?: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  caloriesPerServing?: number;
  nutrition?: NutritionInfo;
  dietaryTags: string[];
  mealType?: string;
  ingredients: Ingredient[];
  instructions: Instruction[];
  tipsAndNotes: string[];
  equipment: string[];
  source: RecipeSource;
  extractionMetadata?: ExtractionMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateRecipeInput = Omit<Recipe, "_id" | "createdAt" | "updatedAt">;

export type UpdateRecipeInput = Partial<Omit<Recipe, "_id" | "userId" | "createdAt" | "updatedAt">>;
