import {
  ArrowLeft,
  ChefHat,
  Clock,
  ExternalLink,
  Lightbulb,
  Timer,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AuthorAvatar } from "@/components/recipes/author-avatar";
import { DeleteRecipeButton } from "@/components/recipes/delete-recipe-button";
import { NutritionCard } from "@/components/recipes/nutrition-card";
import { VideoEmbed } from "@/components/recipes/video-embed";
import { PageTracker } from "@/components/tracking/page-tracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DietaryTag } from "@/components/ui/dietary-tag";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { PlatformBadge } from "@/components/ui/platform-badge";
import { getSession } from "@/lib/session";
import { getRecipeById } from "@/models/recipe";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: RecipePageProps): Promise<Metadata> {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    return {
      title: "Recipe Not Found",
    };
  }

  return {
    title: recipe.title,
    description:
      recipe.description ||
      `${recipe.title} - View ingredients, instructions, and nutrition info.`,
  };
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

  return (
    <div className="max-w-4xl mx-auto">
      <PageTracker event="recipe_detail_view" metadata={{ recipeId: id }} />
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link
            href="/recipes"
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to recipes
          </Link>
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
          <div className="flex flex-wrap gap-2 mt-3">
            <PlatformBadge platform={recipe.source.platform} />
            {recipe.difficulty && (
              <DifficultyBadge
                difficulty={recipe.difficulty as "Easy" | "Medium" | "Hard"}
              />
            )}
            {recipe.dietaryTags.map((tag) => (
              <DietaryTag key={tag} tag={tag} />
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
        <p className="text-muted-foreground mb-6">{recipe.description}</p>
      )}

      <VideoEmbed url={recipe.source.url} platform={recipe.source.platform} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {recipe.prepTime && (
          <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg card-shadow">
            <Timer className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Prep Time</p>
            <p className="font-medium">{recipe.prepTime}</p>
          </div>
        )}
        {recipe.cookTime && (
          <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg card-shadow">
            <Clock className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Cook Time</p>
            <p className="font-medium">{recipe.cookTime}</p>
          </div>
        )}
        {recipe.totalTime && (
          <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg card-shadow">
            <Clock className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Total Time</p>
            <p className="font-medium">{recipe.totalTime}</p>
          </div>
        )}
        {recipe.servings && (
          <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-lg card-shadow">
            <Users className="h-5 w-5 text-primary mb-2" />
            <p className="text-sm text-muted-foreground">Servings</p>
            <p className="font-medium">{recipe.servings}</p>
          </div>
        )}
      </div>

      {recipe.nutrition &&
        (recipe.nutrition.perServing || recipe.nutrition.per100g) && (
          <NutritionCard nutrition={recipe.nutrition} className="mb-8" />
        )}

      <div className="grid md:grid-cols-3 gap-8">
        <Card className="md:col-span-1 card-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChefHat className="h-5 w-5 text-primary" />
              Ingredients
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recipe.ingredients.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No ingredients listed
              </p>
            ) : (
              <ul className="space-y-2">
                {recipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>
                      {ingredient.quantity && (
                        <span className="font-medium">
                          {ingredient.quantity}
                          {ingredient.unit && ` ${ingredient.unit}`}{" "}
                        </span>
                      )}
                      {ingredient.name}
                      {ingredient.notes && (
                        <span className="text-muted-foreground text-sm">
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

        <Card className="md:col-span-2 card-shadow">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            {recipe.instructions.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No instructions listed
              </p>
            ) : (
              <ol className="space-y-4">
                {recipe.instructions.map((instruction) => (
                  <li key={instruction.stepNumber} className="flex gap-4">
                    <span className="shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-medium text-sm">
                      {instruction.stepNumber}
                    </span>
                    <div className="flex-1 pt-1">
                      <p>{instruction.description}</p>
                      {(instruction.duration || instruction.technique) && (
                        <p className="text-sm text-muted-foreground mt-1">
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
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle>Equipment</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {recipe.equipment.map((item, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-primary">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {recipe.tipsAndNotes.length > 0 && (
            <Card className="card-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-500" />
                  Tips & Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {recipe.tipsAndNotes.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-0.5">•</span>
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
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            Source:{" "}
            <a
              href={recipe.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline capitalize"
            >
              {recipe.source.platform}
            </a>
            {recipe.source.authorUsername && (
              <span className="inline-flex items-center gap-1.5">
                by
                <AuthorAvatar
                  src={recipe.source.authorAvatarUrl}
                  alt={recipe.source.authorUsername}
                />
                @{recipe.source.authorUsername}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
