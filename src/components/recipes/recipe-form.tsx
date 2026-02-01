"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { DietaryTag } from "@/components/ui/dietary-tag";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackEvent } from "@/lib/tracking";
import type { Ingredient, Instruction, Recipe } from "@/types/recipe";

const KNOWN_DIETARY_TAGS = [
  "vegan",
  "vegetarian",
  "gluten-free",
  "dairy-free",
  "keto",
  "pescatarian",
  "nut-free",
  "egg-free",
  "paleo",
  "low-carb",
] as const;

interface RecipeFormProps {
  recipe: Recipe;
}

export function RecipeForm({ recipe }: RecipeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(recipe.title);
  const [description, setDescription] = useState(recipe.description || "");
  const [cuisineType, setCuisineType] = useState(recipe.cuisineType || "");
  const [difficulty, setDifficulty] = useState(recipe.difficulty || "");
  const [prepTime, setPrepTime] = useState(recipe.prepTime || "");
  const [cookTime, setCookTime] = useState(recipe.cookTime || "");
  const [totalTime, setTotalTime] = useState(recipe.totalTime || "");
  const [servings, setServings] = useState(recipe.servings || "");
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe.ingredients,
  );
  const [instructions, setInstructions] = useState<Instruction[]>(
    recipe.instructions,
  );
  const [equipment, setEquipment] = useState<string[]>(recipe.equipment);
  const [tipsAndNotes, setTipsAndNotes] = useState<string[]>(
    recipe.tipsAndNotes,
  );
  const [dietaryTags, setDietaryTags] = useState<string[]>(recipe.dietaryTags);

  const [nutritionPerServing, setNutritionPerServing] = useState({
    calories: recipe.nutrition?.perServing?.calories?.toString() || "",
    protein: recipe.nutrition?.perServing?.protein?.toString() || "",
    carbs: recipe.nutrition?.perServing?.carbs?.toString() || "",
    fat: recipe.nutrition?.perServing?.fat?.toString() || "",
    fiber: recipe.nutrition?.perServing?.fiber?.toString() || "",
    sugar: recipe.nutrition?.perServing?.sugar?.toString() || "",
    sodium: recipe.nutrition?.perServing?.sodium?.toString() || "",
  });

  const [nutritionPer100g, setNutritionPer100g] = useState({
    calories: recipe.nutrition?.per100g?.calories?.toString() || "",
    protein: recipe.nutrition?.per100g?.protein?.toString() || "",
    carbs: recipe.nutrition?.per100g?.carbs?.toString() || "",
    fat: recipe.nutrition?.per100g?.fat?.toString() || "",
    fiber: recipe.nutrition?.per100g?.fiber?.toString() || "",
    sugar: recipe.nutrition?.per100g?.sugar?.toString() || "",
    sodium: recipe.nutrition?.per100g?.sodium?.toString() || "",
  });

  const buildNutritionObject = () => {
    const hasPerServing = Object.values(nutritionPerServing).some(
      (v) => v !== "",
    );
    const hasPer100g = Object.values(nutritionPer100g).some((v) => v !== "");

    if (!hasPerServing && !hasPer100g) return undefined;

    return {
      perServing: hasPerServing
        ? {
            calories: nutritionPerServing.calories
              ? parseFloat(nutritionPerServing.calories)
              : undefined,
            protein: nutritionPerServing.protein
              ? parseFloat(nutritionPerServing.protein)
              : undefined,
            carbs: nutritionPerServing.carbs
              ? parseFloat(nutritionPerServing.carbs)
              : undefined,
            fat: nutritionPerServing.fat
              ? parseFloat(nutritionPerServing.fat)
              : undefined,
            fiber: nutritionPerServing.fiber
              ? parseFloat(nutritionPerServing.fiber)
              : undefined,
            sugar: nutritionPerServing.sugar
              ? parseFloat(nutritionPerServing.sugar)
              : undefined,
            sodium: nutritionPerServing.sodium
              ? parseFloat(nutritionPerServing.sodium)
              : undefined,
          }
        : undefined,
      per100g: hasPer100g
        ? {
            calories: nutritionPer100g.calories
              ? parseFloat(nutritionPer100g.calories)
              : undefined,
            protein: nutritionPer100g.protein
              ? parseFloat(nutritionPer100g.protein)
              : undefined,
            carbs: nutritionPer100g.carbs
              ? parseFloat(nutritionPer100g.carbs)
              : undefined,
            fat: nutritionPer100g.fat
              ? parseFloat(nutritionPer100g.fat)
              : undefined,
            fiber: nutritionPer100g.fiber
              ? parseFloat(nutritionPer100g.fiber)
              : undefined,
            sugar: nutritionPer100g.sugar
              ? parseFloat(nutritionPer100g.sugar)
              : undefined,
            sodium: nutritionPer100g.sodium
              ? parseFloat(nutritionPer100g.sodium)
              : undefined,
          }
        : undefined,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const filteredIngredients = ingredients
        .filter((i) => i.name.trim() !== "")
        .map((i) => ({
          name: i.name,
          quantity: i.quantity || undefined,
          unit: i.unit || undefined,
          notes: i.notes || undefined,
          category: i.category || undefined,
        }));
      const filteredInstructions = instructions
        .filter((i) => i.description.trim() !== "")
        .map((inst, idx) => ({
          stepNumber: idx + 1,
          description: inst.description,
          duration: inst.duration || undefined,
          technique: inst.technique || undefined,
        }));
      const filteredEquipment = equipment.filter((e) => e.trim() !== "");
      const filteredTips = tipsAndNotes.filter((t) => t.trim() !== "");

      const response = await fetch(`/api/recipes/${recipe._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          cuisineType: cuisineType || undefined,
          difficulty: difficulty || undefined,
          prepTime: prepTime || undefined,
          cookTime: cookTime || undefined,
          totalTime: totalTime || undefined,
          servings: servings || undefined,
          nutrition: buildNutritionObject(),
          dietaryTags,
          ingredients: filteredIngredients,
          instructions: filteredInstructions,
          equipment: filteredEquipment,
          tipsAndNotes: filteredTips,
        }),
      });

      if (response.ok) {
        trackEvent("recipe_edited", { recipeId: recipe._id });
        router.push(`/recipes/${recipe._id}`);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update recipe");
        if (data.details) {
          console.error("Validation errors:", data.details);
        }
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "" }]);
  };

  const updateIngredient = (
    index: number,
    field: keyof Ingredient,
    value: string,
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const addInstruction = () => {
    setInstructions([
      ...instructions,
      { stepNumber: instructions.length + 1, description: "" },
    ]);
  };

  const updateInstruction = (index: number, description: string) => {
    const updated = [...instructions];
    updated[index] = { ...updated[index], description };
    setInstructions(updated);
  };

  const removeInstruction = (index: number) => {
    const updated = instructions.filter((_, i) => i !== index);
    setInstructions(updated.map((inst, i) => ({ ...inst, stepNumber: i + 1 })));
  };

  const addEquipment = () => {
    setEquipment([...equipment, ""]);
  };

  const updateEquipment = (index: number, value: string) => {
    const updated = [...equipment];
    updated[index] = value;
    setEquipment(updated);
  };

  const removeEquipment = (index: number) => {
    setEquipment(equipment.filter((_, i) => i !== index));
  };

  const addTip = () => {
    setTipsAndNotes([...tipsAndNotes, ""]);
  };

  const updateTip = (index: number, value: string) => {
    const updated = [...tipsAndNotes];
    updated[index] = value;
    setTipsAndNotes(updated);
  };

  const removeTip = (index: number) => {
    setTipsAndNotes(tipsAndNotes.filter((_, i) => i !== index));
  };

  const toggleDietaryTag = (tag: string) => {
    if (dietaryTags.includes(tag)) {
      setDietaryTags(dietaryTags.filter((t) => t !== tag));
    } else {
      setDietaryTags([...dietaryTags, tag]);
    }
  };

  const removeCustomDietaryTag = (tag: string) => {
    setDietaryTags(dietaryTags.filter((t) => t !== tag));
  };

  const customDietaryTags = dietaryTags.filter(
    (tag) => !KNOWN_DIETARY_TAGS.includes(tag.toLowerCase() as typeof KNOWN_DIETARY_TAGS[number]),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-md text-sm"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cuisineType">Cuisine</Label>
              <Input
                id="cuisineType"
                value={cuisineType}
                onChange={(e) => setCuisineType(e.target.value)}
                placeholder="Italian, Mexican..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servings">Servings</Label>
              <Input
                id="servings"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                placeholder="4 servings"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalTime">Total Time</Label>
              <Input
                id="totalTime"
                value={totalTime}
                onChange={(e) => setTotalTime(e.target.value)}
                placeholder="30 minutes"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prepTime">Prep Time</Label>
              <Input
                id="prepTime"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
                placeholder="10 minutes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cookTime">Cook Time</Label>
              <Input
                id="cookTime"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
                placeholder="20 minutes"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dietary Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {KNOWN_DIETARY_TAGS.map((tag) => {
              const isChecked = dietaryTags.some(
                (t) => t.toLowerCase() === tag.toLowerCase(),
              );
              return (
                <label
                  key={tag}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleDietaryTag(tag)}
                  />
                  <DietaryTag tag={tag} />
                </label>
              );
            })}
          </div>
          {customDietaryTags.length > 0 && (
            <div className="pt-3 border-t">
              <p className="text-sm text-muted-foreground mb-2">
                Custom tags from extraction (click to remove):
              </p>
              <div className="flex flex-wrap gap-2">
                {customDietaryTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => removeCustomDietaryTag(tag)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors cursor-pointer"
                  >
                    {tag}
                    <span className="ml-1">×</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nutrition Information (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-base mb-3 block">Per Serving</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caloriesPerServing">Calories</Label>
                <Input
                  id="caloriesPerServing"
                  type="number"
                  value={nutritionPerServing.calories}
                  onChange={(e) =>
                    setNutritionPerServing({
                      ...nutritionPerServing,
                      calories: e.target.value,
                    })
                  }
                  placeholder="e.g., 350"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proteinPerServing">Protein (g)</Label>
                <Input
                  id="proteinPerServing"
                  type="number"
                  value={nutritionPerServing.protein}
                  onChange={(e) =>
                    setNutritionPerServing({
                      ...nutritionPerServing,
                      protein: e.target.value,
                    })
                  }
                  placeholder="e.g., 25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbsPerServing">Carbs (g)</Label>
                <Input
                  id="carbsPerServing"
                  type="number"
                  value={nutritionPerServing.carbs}
                  onChange={(e) =>
                    setNutritionPerServing({
                      ...nutritionPerServing,
                      carbs: e.target.value,
                    })
                  }
                  placeholder="e.g., 30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatPerServing">Fat (g)</Label>
                <Input
                  id="fatPerServing"
                  type="number"
                  value={nutritionPerServing.fat}
                  onChange={(e) =>
                    setNutritionPerServing({
                      ...nutritionPerServing,
                      fat: e.target.value,
                    })
                  }
                  placeholder="e.g., 15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiberPerServing">Fiber (g)</Label>
                <Input
                  id="fiberPerServing"
                  type="number"
                  value={nutritionPerServing.fiber}
                  onChange={(e) =>
                    setNutritionPerServing({
                      ...nutritionPerServing,
                      fiber: e.target.value,
                    })
                  }
                  placeholder="e.g., 5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sugarPerServing">Sugar (g)</Label>
                <Input
                  id="sugarPerServing"
                  type="number"
                  value={nutritionPerServing.sugar}
                  onChange={(e) =>
                    setNutritionPerServing({
                      ...nutritionPerServing,
                      sugar: e.target.value,
                    })
                  }
                  placeholder="e.g., 10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sodiumPerServing">Sodium (mg)</Label>
                <Input
                  id="sodiumPerServing"
                  type="number"
                  value={nutritionPerServing.sodium}
                  onChange={(e) =>
                    setNutritionPerServing({
                      ...nutritionPerServing,
                      sodium: e.target.value,
                    })
                  }
                  placeholder="e.g., 400"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Label className="text-base mb-3 block">Per 100g</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caloriesPer100g">Calories</Label>
                <Input
                  id="caloriesPer100g"
                  type="number"
                  value={nutritionPer100g.calories}
                  onChange={(e) =>
                    setNutritionPer100g({
                      ...nutritionPer100g,
                      calories: e.target.value,
                    })
                  }
                  placeholder="e.g., 200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proteinPer100g">Protein (g)</Label>
                <Input
                  id="proteinPer100g"
                  type="number"
                  value={nutritionPer100g.protein}
                  onChange={(e) =>
                    setNutritionPer100g({
                      ...nutritionPer100g,
                      protein: e.target.value,
                    })
                  }
                  placeholder="e.g., 15"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbsPer100g">Carbs (g)</Label>
                <Input
                  id="carbsPer100g"
                  type="number"
                  value={nutritionPer100g.carbs}
                  onChange={(e) =>
                    setNutritionPer100g({
                      ...nutritionPer100g,
                      carbs: e.target.value,
                    })
                  }
                  placeholder="e.g., 20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fatPer100g">Fat (g)</Label>
                <Input
                  id="fatPer100g"
                  type="number"
                  value={nutritionPer100g.fat}
                  onChange={(e) =>
                    setNutritionPer100g({
                      ...nutritionPer100g,
                      fat: e.target.value,
                    })
                  }
                  placeholder="e.g., 8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fiberPer100g">Fiber (g)</Label>
                <Input
                  id="fiberPer100g"
                  type="number"
                  value={nutritionPer100g.fiber}
                  onChange={(e) =>
                    setNutritionPer100g({
                      ...nutritionPer100g,
                      fiber: e.target.value,
                    })
                  }
                  placeholder="e.g., 3"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sugarPer100g">Sugar (g)</Label>
                <Input
                  id="sugarPer100g"
                  type="number"
                  value={nutritionPer100g.sugar}
                  onChange={(e) =>
                    setNutritionPer100g({
                      ...nutritionPer100g,
                      sugar: e.target.value,
                    })
                  }
                  placeholder="e.g., 6"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sodiumPer100g">Sodium (mg)</Label>
                <Input
                  id="sodiumPer100g"
                  type="number"
                  value={nutritionPer100g.sodium}
                  onChange={(e) =>
                    setNutritionPer100g({
                      ...nutritionPer100g,
                      sodium: e.target.value,
                    })
                  }
                  placeholder="e.g., 250"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ingredients</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addIngredient}
          >
            Add Ingredient
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {ingredients.length === 0 ? (
            <p className="text-gray-500 text-sm">No ingredients added yet</p>
          ) : (
            ingredients.map((ingredient, index) => (
              <div key={index} className="flex gap-2 items-start">
                <Input
                  value={ingredient.quantity || ""}
                  onChange={(e) =>
                    updateIngredient(index, "quantity", e.target.value)
                  }
                  placeholder="Qty"
                  className="w-20"
                />
                <Input
                  value={ingredient.unit || ""}
                  onChange={(e) =>
                    updateIngredient(index, "unit", e.target.value)
                  }
                  placeholder="Unit"
                  className="w-24"
                />
                <Input
                  value={ingredient.name}
                  onChange={(e) =>
                    updateIngredient(index, "name", e.target.value)
                  }
                  placeholder="Ingredient name"
                  className="flex-1"
                />
                <Input
                  value={ingredient.notes || ""}
                  onChange={(e) =>
                    updateIngredient(index, "notes", e.target.value)
                  }
                  placeholder="Notes"
                  className="w-32"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeIngredient(index)}
                  className="text-red-500"
                >
                  ×
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Instructions</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addInstruction}
          >
            Add Step
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {instructions.length === 0 ? (
            <p className="text-gray-500 text-sm">No instructions added yet</p>
          ) : (
            instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-medium text-gray-600 mt-1">
                  {instruction.stepNumber}
                </span>
                <textarea
                  value={instruction.description}
                  onChange={(e) => updateInstruction(index, e.target.value)}
                  placeholder="Describe this step..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm"
                  rows={2}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeInstruction(index)}
                  className="text-red-500"
                >
                  ×
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Equipment</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addEquipment}
          >
            Add Equipment
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {equipment.length === 0 ? (
            <p className="text-gray-500 text-sm">No equipment listed</p>
          ) : (
            equipment.map((item, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={item}
                  onChange={(e) => updateEquipment(index, e.target.value)}
                  placeholder="Equipment name"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeEquipment(index)}
                  className="text-red-500"
                >
                  ×
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tips & Notes</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addTip}>
            Add Tip
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {tipsAndNotes.length === 0 ? (
            <p className="text-gray-500 text-sm">No tips added</p>
          ) : (
            tipsAndNotes.map((tip, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={tip}
                  onChange={(e) => updateTip(index, e.target.value)}
                  placeholder="Add a tip or note"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeTip(index)}
                  className="text-red-500"
                >
                  ×
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
