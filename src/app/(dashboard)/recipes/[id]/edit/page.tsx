import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { getSession } from "@/lib/session";
import { getRecipeById } from "@/models/recipe";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe || recipe.userId !== session.user.id) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/recipes/${recipe._id}`}
          className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
        >
          ← Back to recipe
        </Link>
        <h1 className="text-3xl font-bold">Edit Recipe</h1>
      </div>

      <RecipeForm recipe={recipe} />
    </div>
  );
}
