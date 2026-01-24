import { Clock, Flame, Users, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DietaryTag } from '@/components/ui/dietary-tag'
import { DifficultyBadge } from '@/components/ui/difficulty-badge'
import { PlatformBadge } from '@/components/ui/platform-badge'
import type { Recipe } from '@/types/recipe'

interface RecipeCardProps {
    recipe: Recipe
}

export function RecipeCard({ recipe }: RecipeCardProps) {
    const calories =
        recipe.nutrition?.perServing?.calories || recipe.caloriesPerServing

    return (
        <Link href={`/recipes/${recipe._id}`} className="group">
            <Card className="h-full card-shadow hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
                <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                            {recipe.title}
                        </CardTitle>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <PlatformBadge platform={recipe.source.platform} />
                        {recipe.difficulty && (
                            <DifficultyBadge
                                difficulty={
                                    recipe.difficulty as
                                        | 'Easy'
                                        | 'Medium'
                                        | 'Hard'
                                }
                            />
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    {recipe.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {recipe.description}
                        </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        {recipe.totalTime && (
                            <span className="flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />
                                {recipe.totalTime}
                            </span>
                        )}
                        {recipe.servings && (
                            <span className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                {recipe.servings}
                            </span>
                        )}
                        {recipe.ingredients.length > 0 && (
                            <span className="flex items-center gap-1">
                                <UtensilsCrossed className="h-3.5 w-3.5" />
                                {recipe.ingredients.length} ingredients
                            </span>
                        )}
                        {calories && (
                            <span className="flex items-center gap-1">
                                <Flame className="h-3.5 w-3.5" />
                                {calories} cal
                            </span>
                        )}
                    </div>
                    {recipe.dietaryTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                            {recipe.dietaryTags.slice(0, 3).map((tag) => (
                                <DietaryTag key={tag} tag={tag} />
                            ))}
                            {recipe.dietaryTags.length > 3 && (
                                <span className="text-xs text-muted-foreground self-center">
                                    +{recipe.dietaryTags.length - 3} more
                                </span>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    )
}
