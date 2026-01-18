"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Recipe, Ingredient, Instruction } from "@/types/recipe";

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
  const [ingredients, setIngredients] = useState<Ingredient[]>(recipe.ingredients);
  const [instructions, setInstructions] = useState<Instruction[]>(recipe.instructions);
  const [equipment, setEquipment] = useState<string[]>(recipe.equipment);
  const [tipsAndNotes, setTipsAndNotes] = useState<string[]>(recipe.tipsAndNotes);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
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
          ingredients,
          instructions,
          equipment,
          tipsAndNotes,
        }),
      });

      if (response.ok) {
        router.push(`/recipes/${recipe._id}`);
        router.refresh();
      } else {
        setError("Failed to update recipe");
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

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
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
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
              >
                <option value="">Select...</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ingredients</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
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
                  onChange={(e) => updateIngredient(index, "quantity", e.target.value)}
                  placeholder="Qty"
                  className="w-20"
                />
                <Input
                  value={ingredient.unit || ""}
                  onChange={(e) => updateIngredient(index, "unit", e.target.value)}
                  placeholder="Unit"
                  className="w-24"
                />
                <Input
                  value={ingredient.name}
                  onChange={(e) => updateIngredient(index, "name", e.target.value)}
                  placeholder="Ingredient name"
                  className="flex-1"
                />
                <Input
                  value={ingredient.notes || ""}
                  onChange={(e) => updateIngredient(index, "notes", e.target.value)}
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
          <Button type="button" variant="outline" size="sm" onClick={addInstruction}>
            Add Step
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {instructions.length === 0 ? (
            <p className="text-gray-500 text-sm">No instructions added yet</p>
          ) : (
            instructions.map((instruction, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center font-medium text-gray-600 mt-1">
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
          <Button type="button" variant="outline" size="sm" onClick={addEquipment}>
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
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
