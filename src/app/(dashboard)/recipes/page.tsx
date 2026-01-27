import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RecipeLibrary } from "@/components/recipes/recipe-library";
import { PageTracker } from "@/components/tracking/page-tracker";
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
      <PageTracker event="recipes_view" />
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Recipes</h1>
        <Link href="/extract">
          <Button>Extract new recipe</Button>
        </Link>
      </div>

      <RecipeLibrary recipes={recipes} />
    </div>
  );
}
