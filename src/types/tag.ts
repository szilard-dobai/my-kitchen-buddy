import type { PlanTier } from "./subscription";

export interface Tag {
  _id?: string;
  userId: string;
  name: string;
  color?: string;
  recipeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecipeTag {
  _id?: string;
  recipeId: string;
  tagId: string;
  userId: string;
  addedAt: Date;
}

export type CreateTagInput = Omit<
  Tag,
  "_id" | "recipeCount" | "createdAt" | "updatedAt"
>;

export type UpdateTagInput = Partial<
  Omit<Tag, "_id" | "userId" | "createdAt" | "updatedAt">
>;

export const TAG_LIMITS: Record<PlanTier, number> = {
  free: 5,
  pro: Infinity,
};

export const TAG_COLORS = [
  "#EF4444", // red
  "#F97316", // orange
  "#EAB308", // yellow
  "#22C55E", // green
  "#14B8A6", // teal
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
] as const;

export const DEFAULT_TAG_COLOR = TAG_COLORS[5]; // blue
