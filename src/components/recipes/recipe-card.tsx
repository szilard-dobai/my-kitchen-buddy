import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Recipe } from "@/types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const platformColors = {
    tiktok: "bg-pink-100 text-pink-800",
    instagram: "bg-purple-100 text-purple-800",
    youtube: "bg-red-100 text-red-800",
    other: "bg-gray-100 text-gray-800",
  };

  const difficultyColors = {
    Easy: "bg-green-100 text-green-800",
    Medium: "bg-yellow-100 text-yellow-800",
    Hard: "bg-red-100 text-red-800",
  };

  return (
    <Link href={`/recipes/${recipe._id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-2">{recipe.title}</CardTitle>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                platformColors[recipe.source.platform]
              }`}
            >
              {recipe.source.platform}
            </span>
            {recipe.difficulty && (
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  difficultyColors[recipe.difficulty]
                }`}
              >
                {recipe.difficulty}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recipe.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {recipe.description}
            </p>
          )}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
            {recipe.totalTime && (
              <span>{recipe.totalTime}</span>
            )}
            {recipe.servings && (
              <span>{recipe.servings}</span>
            )}
            {recipe.ingredients.length > 0 && (
              <span>{recipe.ingredients.length} ingredients</span>
            )}
          </div>
          {recipe.dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {recipe.dietaryTags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                >
                  {tag}
                </span>
              ))}
              {recipe.dietaryTags.length > 3 && (
                <span className="text-xs text-gray-400">
                  +{recipe.dietaryTags.length - 3} more
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
