import type { Recipe } from "@/types/recipe";

export const mockRecipe: Recipe = {
  _id: "recipe-123",
  userId: "user-123",
  title: "Test Pasta Recipe",
  description: "A delicious test pasta recipe from TikTok",
  cuisineType: "Italian",
  difficulty: "Easy",
  prepTime: "10 minutes",
  cookTime: "20 minutes",
  totalTime: "30 minutes",
  servings: "4",
  dietaryTags: ["vegetarian"],
  ingredients: [
    { name: "Pasta", quantity: "500", unit: "g" },
    { name: "Tomato sauce", quantity: "400", unit: "ml" },
    { name: "Parmesan cheese", quantity: "100", unit: "g", notes: "grated" },
  ],
  instructions: [
    {
      stepNumber: 1,
      description: "Boil water and cook pasta",
      duration: "10 minutes",
    },
    { stepNumber: 2, description: "Heat tomato sauce in a pan" },
    {
      stepNumber: 3,
      description: "Mix pasta with sauce and serve with cheese",
    },
  ],
  equipment: ["Large pot", "Pan", "Colander"],
  tipsAndNotes: ["Add pasta water to sauce for better consistency"],
  source: {
    url: "https://www.tiktok.com/@testuser/video/123456",
    platform: "tiktok",
    authorUsername: "testuser",
    authorId: "author-123",
    authorAvatarUrl: "https://example.com/avatar.jpg",
    thumbnailUrl: "https://example.com/thumbnail.jpg",
  },
  extractionMetadata: {
    extractedAt: new Date("2024-01-15"),
    confidenceScore: 0.85,
  },
  collectionIds: [],
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-15"),
};

export const mockRecipeWithNutrition: Recipe = {
  ...mockRecipe,
  _id: "recipe-456",
  title: "Healthy Salad Recipe",
  nutrition: {
    perServing: {
      calories: 350,
      protein: 25,
      carbs: 30,
      fat: 15,
      fiber: 8,
      sugar: 5,
      sodium: 400,
    },
    per100g: {
      calories: 120,
      protein: 8,
      carbs: 10,
      fat: 5,
      fiber: 3,
      sugar: 2,
      sodium: 150,
    },
  },
};

export const mockRecipeInstagram: Recipe = {
  ...mockRecipe,
  _id: "recipe-789",
  title: "Instagram Smoothie Bowl",
  source: {
    url: "https://www.instagram.com/p/ABC123/",
    platform: "instagram",
    authorUsername: "healthyfoodie",
    authorAvatarUrl: "https://example.com/ig-avatar.jpg",
    thumbnailUrl: "https://example.com/ig-thumbnail.jpg",
  },
  createdAt: new Date("2024-01-10"),
  updatedAt: new Date("2024-01-10"),
};

export const mockRecipeYouTube: Recipe = {
  ...mockRecipe,
  _id: "recipe-101",
  title: "YouTube Cooking Tutorial",
  difficulty: "Hard",
  source: {
    url: "https://www.youtube.com/watch?v=xyz789",
    platform: "youtube",
    authorUsername: "chefpro",
    thumbnailUrl: "https://i.ytimg.com/vi/xyz789/maxresdefault.jpg",
  },
  createdAt: new Date("2024-01-05"),
  updatedAt: new Date("2024-01-05"),
};

export const mockRecipeList: Recipe[] = [
  mockRecipe,
  mockRecipeWithNutrition,
  mockRecipeInstagram,
  mockRecipeYouTube,
  {
    ...mockRecipe,
    _id: "recipe-201",
    title: "Spicy Thai Curry",
    cuisineType: "Thai",
    difficulty: "Medium",
    dietaryTags: ["gluten-free", "dairy-free"],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    ...mockRecipe,
    _id: "recipe-202",
    title: "Classic French Omelette",
    cuisineType: "French",
    difficulty: "Easy",
    dietaryTags: ["vegetarian", "keto"],
    createdAt: new Date("2024-01-18"),
    updatedAt: new Date("2024-01-18"),
  },
];

export const mockEmptyRecipe: Recipe = {
  _id: "recipe-empty",
  userId: "user-123",
  title: "Minimal Recipe",
  dietaryTags: [],
  ingredients: [],
  instructions: [],
  equipment: [],
  tipsAndNotes: [],
  collectionIds: [],
  source: {
    url: "https://www.tiktok.com/@minimal/video/999",
    platform: "tiktok",
  },
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-01"),
};
