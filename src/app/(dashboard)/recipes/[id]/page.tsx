import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/lib/session";
import { getRecipeById } from "@/models/recipe";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe || recipe.userId !== session.user.id) {
    notFound();
  }

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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/recipes"
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            ← Back to recipes
          </Link>
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={`text-sm px-3 py-1 rounded-full ${platformColors[recipe.source.platform]
                }`}
            >
              {recipe.source.platform}
            </span>
            {recipe.difficulty && (
              <span
                className={`text-sm px-3 py-1 rounded-full ${difficultyColors[recipe.difficulty]
                  }`}
              >
                {recipe.difficulty}
              </span>
            )}
            {recipe.dietaryTags.map((tag) => (
              <span
                key={tag}
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/recipes/${recipe._id}/edit`}>
            <Button variant="outline">Edit</Button>
          </Link>
          <DeleteRecipeButton recipeId={recipe._id!} />
        </div>
      </div>

      {recipe.description && (
        <p className="text-gray-600 mb-6">{recipe.description}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {recipe.prepTime && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Prep Time</p>
            <p className="font-medium">{recipe.prepTime}</p>
          </div>
        )}
        {recipe.cookTime && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Cook Time</p>
            <p className="font-medium">{recipe.cookTime}</p>
          </div>
        )}
        {recipe.totalTime && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Time</p>
            <p className="font-medium">{recipe.totalTime}</p>
          </div>
        )}
        {recipe.servings && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Servings</p>
            <p className="font-medium">{recipe.servings}</p>
          </div>
        )}
      </div>

      {recipe.nutrition && (recipe.nutrition.perServing || recipe.nutrition.per100g) && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Nutrition Information</CardTitle>
          </CardHeader>
          <CardContent>
            {recipe.nutrition.perServing && (
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">Per Serving</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recipe.nutrition.perServing.calories !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.perServing.calories}</p>
                      <p className="text-xs text-gray-500 mt-1">Calories</p>
                    </div>
                  )}
                  {recipe.nutrition.perServing.protein !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.perServing.protein}g</p>
                      <p className="text-xs text-gray-500 mt-1">Protein</p>
                    </div>
                  )}
                  {recipe.nutrition.perServing.carbs !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.perServing.carbs}g</p>
                      <p className="text-xs text-gray-500 mt-1">Carbs</p>
                    </div>
                  )}
                  {recipe.nutrition.perServing.fat !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.perServing.fat}g</p>
                      <p className="text-xs text-gray-500 mt-1">Fat</p>
                    </div>
                  )}
                  {recipe.nutrition.perServing.fiber !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.perServing.fiber}g</p>
                      <p className="text-xs text-gray-500 mt-1">Fiber</p>
                    </div>
                  )}
                  {recipe.nutrition.perServing.sugar !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.perServing.sugar}g</p>
                      <p className="text-xs text-gray-500 mt-1">Sugar</p>
                    </div>
                  )}
                  {recipe.nutrition.perServing.sodium !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.perServing.sodium}mg</p>
                      <p className="text-xs text-gray-500 mt-1">Sodium</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {recipe.nutrition.per100g && (
              <div className={recipe.nutrition.perServing ? "mt-4 pt-4 border-t" : ""}>
                <p className="text-sm font-medium text-gray-600 mb-3">Per 100g</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {recipe.nutrition.per100g.calories !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.per100g.calories}</p>
                      <p className="text-xs text-gray-500 mt-1">Calories</p>
                    </div>
                  )}
                  {recipe.nutrition.per100g.protein !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.per100g.protein}g</p>
                      <p className="text-xs text-gray-500 mt-1">Protein</p>
                    </div>
                  )}
                  {recipe.nutrition.per100g.carbs !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.per100g.carbs}g</p>
                      <p className="text-xs text-gray-500 mt-1">Carbs</p>
                    </div>
                  )}
                  {recipe.nutrition.per100g.fat !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.per100g.fat}g</p>
                      <p className="text-xs text-gray-500 mt-1">Fat</p>
                    </div>
                  )}
                  {recipe.nutrition.per100g.fiber !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.per100g.fiber}g</p>
                      <p className="text-xs text-gray-500 mt-1">Fiber</p>
                    </div>
                  )}
                  {recipe.nutrition.per100g.sugar !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.per100g.sugar}g</p>
                      <p className="text-xs text-gray-500 mt-1">Sugar</p>
                    </div>
                  )}
                  {recipe.nutrition.per100g.sodium !== undefined && (
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <p className="text-2xl font-bold text-gray-800">{recipe.nutrition.per100g.sodium}mg</p>
                      <p className="text-xs text-gray-500 mt-1">Sodium</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Ingredients</CardTitle>
          </CardHeader>
          <CardContent>
            {recipe.ingredients.length === 0 ? (
              <p className="text-gray-500 text-sm">No ingredients listed</p>
            ) : (
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-gray-400">•</span>
                    <span>
                      {ingredient.quantity && (
                        <span className="font-medium">
                          {ingredient.quantity}
                          {ingredient.unit && ` ${ingredient.unit}`}{" "}
                        </span>
                      )}
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="text-gray-500 text-sm">
                          {" "}
                          ({ingredient.notes})
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            {recipe.instructions.length === 0 ? (
              <p className="text-gray-500 text-sm">No instructions listed</p>
            ) : (
              <ol className="space-y-4">
                {recipe.instructions.map((instruction) => (
                  <li key={instruction.stepNumber} className="flex gap-4">
                    <span className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-medium text-gray-600">
                      {instruction.stepNumber}
                    </span>
                    <div className="flex-1">
                      <p>{instruction.description}</p>
                      {(instruction.duration || instruction.technique) && (
                        <p className="text-sm text-gray-500 mt-1">
                          {instruction.technique && (
                            <span className="mr-3">
                              Technique: {instruction.technique}
                            </span>
                          )}
                          {instruction.duration && (
                            <span>Time: {instruction.duration}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      {(recipe.equipment.length > 0 || recipe.tipsAndNotes.length > 0) && (
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          {recipe.equipment.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {recipe.equipment.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-gray-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {recipe.tipsAndNotes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tips & Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recipe.tipsAndNotes.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500">💡</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {recipe.source.url && (
        <div className="mt-8 pt-6 border-t">
          <p className="text-sm text-gray-500">
            Source:{" "}
            <a
              href={recipe.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {recipe.source.url}
            </a>
            {recipe.source.authorUsername && (
              <span> by {recipe.source.authorUsername}</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
