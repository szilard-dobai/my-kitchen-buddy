import type { PlanTier } from "./subscription";

export interface Collection {
  _id?: string;
  userId: string;
  name: string;
  color: string;
  recipeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeCollection {
  _id?: string;
  recipeId: string;
  collectionId: string;
  userId: string;
  addedAt: Date;
}

export type CreateCollectionInput = Omit<
  Collection,
  "_id" | "recipeCount" | "createdAt" | "updatedAt"
>;

export type UpdateCollectionInput = Partial<
  Omit<Collection, "_id" | "userId" | "createdAt" | "updatedAt">
>;

export const COLLECTION_LIMITS: Record<PlanTier, number> = {
  free: 3,
  pro: Infinity,
};

export const COLLECTION_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
] as const;

export const DEFAULT_COLLECTION_COLOR = COLLECTION_COLORS[5]; // blue
