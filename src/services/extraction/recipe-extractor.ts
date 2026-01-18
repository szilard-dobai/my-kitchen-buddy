import OpenAI from "openai";
import type { CreateRecipeInput } from "@/types/recipe";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are a recipe extraction system. Given a transcript from a cooking video (and optionally the post description/caption), extract the recipe information.

RULES:
1. Extract instructions that ARE verbally described - if someone says "slice the apple, add sugar, bake it", those ARE instructions to extract
2. DO NOT invent specific quantities/measurements not mentioned - if they say "add sugar" without an amount, quantity should be null
3. DO NOT add extra steps beyond what was described - stick to what was actually said
4. DO NOT infer cooking times, temperatures, or serving sizes unless explicitly stated

Extract into this JSON structure:
{
  "title": "Recipe name (from transcript, or brief description based on the dish)",
  "description": "Brief description if mentioned or can be derived from context",
  "cuisineType": "Only if mentioned or clearly evident",
  "difficulty": "Only if mentioned",
  "prepTime": "Only if explicitly mentioned",
  "cookTime": "Only if explicitly mentioned",
  "totalTime": "Only if explicitly mentioned",
  "servings": "Only if explicitly mentioned",
  "dietaryTags": ["Only tags explicitly mentioned or clearly evident (e.g., 'vegan' if all ingredients are plant-based)"],
  "mealType": "Only if mentioned or clearly evident (e.g., 'dessert' for a sweet dish)",
  "ingredients": [
    {
      "name": "ingredient name as mentioned",
      "quantity": "ONLY if explicitly stated (e.g., '2', '1/2'), otherwise null",
      "unit": "ONLY if explicitly stated (e.g., 'cups', 'tablespoons'), otherwise null",
      "notes": "preparation notes if mentioned (e.g., 'sliced into rings', 'room temperature')"
    }
  ],
  "instructions": [
    {
      "stepNumber": 1,
      "description": "Step based on what was verbally described - extract the actions mentioned"
    }
  ],
  "equipment": ["Equipment explicitly mentioned (e.g., 'oven', 'pan')"],
  "tipsAndNotes": ["Only tips explicitly shared"],
  "confidence": 0.0-1.0,
  "extractionNotes": "Note what information was missing (e.g., 'No quantities specified', 'Cooking temperature not mentioned')"
}

GUIDELINES:
- Extract instructions from verbal descriptions of actions (e.g., "slice, coat, bake" = real steps)
- The post description often contains ingredient lists or recipe details - use this information
- Leave quantity/unit as null when amounts aren't specified - don't guess "1 cup" or "2 tablespoons"
- Set confidence based on how complete the information is (high if detailed, lower if sparse)
- Use extractionNotes to document what's missing so users know what to fill in

Return ONLY valid JSON.`;

interface ExtractionResult {
  recipe: Partial<CreateRecipeInput> | null;
  error?: string;
  confidence?: number;
}

export async function extractRecipeFromTranscript(
  transcript: string,
  sourceUrl: string,
  platform: "tiktok" | "instagram" | "youtube" | "other",
  postDescription?: string
): Promise<ExtractionResult> {
  if (!transcript || transcript.trim().length < 50 || (postDescription && postDescription.trim().length < 50)) {
    return {
      recipe: null,
      error: "Transcript is too short to extract a recipe",
    };
  }

  let userMessage = `Extract the recipe from this video transcript:\n\n${transcript}`;
  if (postDescription) {
    userMessage += `\n\n---\n\nPost description/caption:\n\n${postDescription}`;
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
          content: userMessage,
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
