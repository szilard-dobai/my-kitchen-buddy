import type { RecipeTag, Tag } from "@/types/tag";

export const mockTag: Tag = {
  _id: "tag-123",
  userId: "user-123",
  name: "quickeasy",
  recipeCount: 3,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};

export const mockTag2: Tag = {
  _id: "tag-456",
  userId: "user-123",
  name: "familyfavorite",
  recipeCount: 2,
  createdAt: new Date("2024-01-02"),
  updatedAt: new Date("2024-01-16"),
};

export const mockTag3: Tag = {
  _id: "tag-789",
  userId: "user-123",
  name: "budgetfriendly",
  recipeCount: 0,
  createdAt: new Date("2024-01-03"),
  updatedAt: new Date("2024-01-17"),
};

export const mockRecipeTag: RecipeTag = {
  _id: "rt-123",
  recipeId: "recipe-123",
  tagId: "tag-123",
  userId: "user-123",
  addedAt: new Date("2024-01-10"),
};

export const mockOtherUserTag: Tag = {
  _id: "tag-other",
  userId: "user-other",
  name: "otherusertag",
  recipeCount: 0,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-15"),
};

export const mockTagList: Tag[] = [mockTag, mockTag2, mockTag3];
