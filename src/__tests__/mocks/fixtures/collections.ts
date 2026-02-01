import type { Collection, RecipeCollection } from "@/types/collection";

export const mockCollection: Collection = {
  _id: "col-123",
  userId: "user-123",
  name: "Weeknight Dinners",
  color: "#3B82F6",
  recipeCount: 5,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};

export const mockCollection2: Collection = {
  _id: "col-456",
  userId: "user-123",
  name: "Meal Prep",
  color: "#22C55E",
  recipeCount: 3,
  createdAt: new Date("2024-01-02"),
  updatedAt: new Date("2024-01-16"),
};

export const mockCollection3: Collection = {
  _id: "col-789",
  userId: "user-123",
  name: "Date Night",
  color: "#EC4899",
  recipeCount: 0,
  createdAt: new Date("2024-01-03"),
  updatedAt: new Date("2024-01-17"),
};

export const mockRecipeCollection: RecipeCollection = {
  _id: "rc-123",
  recipeId: "recipe-123",
  collectionId: "col-123",
  userId: "user-123",
  addedAt: new Date("2024-01-10"),
};

export const mockOtherUserCollection: Collection = {
  _id: "col-other",
  userId: "user-other",
  name: "Other User Collection",
  color: "#EF4444",
  recipeCount: 0,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};
