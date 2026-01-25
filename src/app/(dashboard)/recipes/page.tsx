import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { getRecipesByUserId } from "@/models/recipe";

export const metadata: Metadata = {
  title: "My Recipes",
  description: "Browse and manage your saved recipe collection.",
};

export default async function RecipesPage() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const recipes = await getRecipesByUserId(session.user.id);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">My Recipes</h1>
        <Link href="/extract">
          <Button>Extract new recipe</Button>
        </Link>
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-4">No recipes yet.</p>
          <p>
            <Link href="/extract" className="text-blue-600 hover:underline">
              Extract your first recipe
            </Link>{" "}
            from a social media video.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe) => (
            <RecipeCard key={recipe._id} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
