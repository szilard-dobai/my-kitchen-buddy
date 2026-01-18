import OpenAI from "openai";
import type { CreateRecipeInput } from "@/types/recipe";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert recipe extraction system. Given a transcript from a cooking video, extract the recipe information into a structured JSON format.

Extract the following information:
- title: The recipe name (infer if not explicitly stated)
- description: Brief description of the dish
- cuisineType: Type of cuisine (e.g., Italian, Mexican, Asian)
- difficulty: Easy, Medium, or Hard
- prepTime: Preparation time (e.g., "10 minutes")
- cookTime: Cooking time (e.g., "20 minutes")
- totalTime: Total time (e.g., "30 minutes")
- servings: Number of servings (e.g., "4 servings")
- dietaryTags: Array of tags (e.g., ["vegetarian", "gluten-free"])
- mealType: breakfast, lunch, dinner, snack, or dessert
- ingredients: Array of {name, quantity, unit, notes, category}
- instructions: Array of {stepNumber, description, duration, technique}
- equipment: Array of equipment needed (e.g., ["oven", "mixing bowl"])
- tipsAndNotes: Array of tips mentioned in the video

Guidelines:
- If information is not mentioned, omit the field or use null
- For ingredients, include ALL ingredients mentioned, even common ones like salt and oil
- For instructions, create clear sequential steps even if the video doesn't explicitly number them
- Infer reasonable values when possible (e.g., cuisine type from ingredients)
- Use standard measurements when quantities are vague (e.g., "a pinch" -> "1/8 tsp")

Return ONLY valid JSON, no additional text.`;

interface ExtractionResult {
  recipe: Partial<CreateRecipeInput> | null;
  error?: string;
  confidence?: number;
}

export async function extractRecipeFromTranscript(
  transcript: string,
  sourceUrl: string,
  platform: "tiktok" | "instagram" | "youtube" | "other"
): Promise<ExtractionResult> {
  if (!transcript || transcript.trim().length < 50) {
    return {
      recipe: null,
      error: "Transcript is too short to extract a recipe",
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: `Extract the recipe from this video transcript:\n\n${transcript}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3, // Lower temperature for more consistent extraction
      max_tokens: 4096,
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return {
        recipe: null,
        error: "No response from AI model",
      };
    }

    const extracted = JSON.parse(content);

    // Validate that we got at least a title
    if (!extracted.title) {
      return {
        recipe: null,
        error: "Could not extract a recipe from this transcript. The video may not contain a recipe.",
      };
    }

    // Build the recipe object
    const recipe: Partial<CreateRecipeInput> = {
      title: extracted.title,
      description: extracted.description || undefined,
      cuisineType: extracted.cuisineType || undefined,
      difficulty: extracted.difficulty || undefined,
      prepTime: extracted.prepTime || undefined,
      cookTime: extracted.cookTime || undefined,
      totalTime: extracted.totalTime || undefined,
      servings: extracted.servings || undefined,
      caloriesPerServing: extracted.caloriesPerServing || undefined,
      dietaryTags: extracted.dietaryTags || [],
      mealType: extracted.mealType || undefined,
      ingredients: (extracted.ingredients || []).map(
        (ing: Record<string, string>, index: number) => ({
          name: ing.name || `Ingredient ${index + 1}`,
          quantity: ing.quantity || undefined,
          unit: ing.unit || undefined,
          notes: ing.notes || undefined,
          category: ing.category || undefined,
        })
      ),
      instructions: (extracted.instructions || []).map(
        (inst: Record<string, string | number>, index: number) => ({
          stepNumber: inst.stepNumber || index + 1,
          description: inst.description || "",
          duration: inst.duration || undefined,
          technique: inst.technique || undefined,
        })
      ),
      equipment: extracted.equipment || [],
      tipsAndNotes: extracted.tipsAndNotes || [],
      source: {
        url: sourceUrl,
        platform,
        authorUsername: extracted.author || undefined,
      },
    };

    return {
      recipe,
      confidence: extracted.confidence || 0.8,
    };
  } catch (error) {
    console.error("Error extracting recipe:", error);

    if (error instanceof SyntaxError) {
      return {
        recipe: null,
        error: "Failed to parse AI response",
      };
    }

    return {
      recipe: null,
      error: error instanceof Error ? error.message : "Failed to extract recipe",
    };
  }
}
