import { franc } from "franc-min";
import OpenAI from "openai";
import type { DetectedLanguageCode } from "@/types/detected-language";
import { getLanguageDisplayName } from "@/types/detected-language";
import type { TargetLanguage } from "@/types/extraction-job";
import type { CreateRecipeInput } from "@/types/recipe";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ISO_639_3_TO_1: Record<string, DetectedLanguageCode> = {
  eng: "en",
  hun: "hu",
  deu: "de",
  fra: "fr",
  spa: "es",
  ita: "it",
  por: "pt",
  nld: "nl",
  pol: "pl",
  ron: "ro",
  ces: "cs",
  rus: "ru",
  ukr: "uk",
  jpn: "ja",
  kor: "ko",
  zho: "zh",
  cmn: "zh",
  ara: "ar",
  tur: "tr",
  sqi: "sq",
};

export function detectTranscriptLanguage(
  transcript: string,
): DetectedLanguageCode {
  const iso639_3 = franc(transcript);

  if (iso639_3 === "und") {
    return "unknown";
  }

  return ISO_639_3_TO_1[iso639_3] || "unknown";
}

function isNonRecipeContent(extracted: Record<string, unknown>): {
  isNonRecipe: boolean;
  reason?: string;
} {
  if (extracted.isRecipe === false) {
    const reason =
      (typeof extracted.reason === "string" && extracted.reason) ||
      "This video does not contain recipe instructions.";
    return {
      isNonRecipe: true,
      reason,
    };
  }

  const hasTitle =
    typeof extracted.title === "string" && extracted.title.length > 0;
  const hasIngredients =
    Array.isArray(extracted.ingredients) && extracted.ingredients.length > 0;
  const hasInstructions =
    Array.isArray(extracted.instructions) && extracted.instructions.length > 0;

  if (!hasTitle) {
    return {
      isNonRecipe: true,
      reason: "Could not identify recipe content in this video.",
    };
  }

  if (!hasIngredients && !hasInstructions) {
    return {
      isNonRecipe: true,
      reason: "No recipe ingredients or instructions found in this video.",
    };
  }

  return { isNonRecipe: false };
}

function buildSystemPrompt(
  targetLanguage: TargetLanguage,
  detectedLanguage: DetectedLanguageCode,
): string {
  const displayName = getLanguageDisplayName(detectedLanguage);
  const languageInstruction =
    targetLanguage === "en"
      ? "LANGUAGE: Translate ALL text output (title, description, ingredients, instructions, tips, etc.) to English, regardless of the source language."
      : `CRITICAL LANGUAGE REQUIREMENT - THIS IS MANDATORY:
- The transcript appears to be in ${displayName}.
- You MUST output ALL text in ${displayName} ONLY.
- DO NOT translate ANY part of the output to English, French, Albanian, or any other language.
- Every single field (title, description, ALL ingredients, ALL instructions, ALL tips) MUST be in ${displayName}.
- If you are uncertain, keep the EXACT original words from the transcript.
- VIOLATION OF THIS RULE IS UNACCEPTABLE. Double-check your output before responding.`;

  return `You are a recipe extraction system. Given a transcript from a cooking video (and optionally the post description/caption), extract the recipe information.

${languageInstruction}

CONTENT TYPE DETECTION:
If the video content is clearly NOT a recipe or cooking tutorial, you MUST indicate this by setting "isRecipe" to false.
Examples of non-recipe content:
- Dance videos, lip-sync videos, comedy skits, pranks
- Product reviews (kitchen gadgets, cookware)
- Restaurant visits, food reviews, taste tests
- Lifestyle vlogs that happen to show food
- ASMR eating videos without cooking instructions

When content is non-recipe, return:
{
  "isRecipe": false,
  "reason": "Brief explanation of why this is not a recipe (e.g., 'This video shows a restaurant visit without cooking instructions')"
}

When content IS a recipe or cooking tutorial, always include "isRecipe": true in your response.

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
  "nutrition": {
    "perServing": {
      "calories": "number (only if explicitly stated per serving)",
      "protein": "number in grams (only if explicitly stated)",
      "carbs": "number in grams (only if explicitly stated)",
      "fat": "number in grams (only if explicitly stated)",
      "fiber": "number in grams (only if explicitly stated)",
      "sugar": "number in grams (only if explicitly stated)",
      "sodium": "number in milligrams (only if explicitly stated)"
    },
    "per100g": {
      "calories": "number (only if per 100g/100ml is stated)",
      "protein": "number in grams (only if explicitly stated)",
      "carbs": "number in grams (only if explicitly stated)",
      "fat": "number in grams (only if explicitly stated)",
      "fiber": "number in grams (only if explicitly stated)",
      "sugar": "number in grams (only if explicitly stated)",
      "sodium": "number in milligrams (only if explicitly stated)"
    }
  },
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
- Extract nutrition information ONLY when explicitly mentioned in transcript or post description
- Don't calculate or estimate nutrition values - only include what is verbally stated
- Support both per-serving and per-100g nutrition labels - if creator says "per 100 grams" or "per 100ml", use per100g object
- If nutrition units are ambiguous or unclear, note this in extractionNotes
- Set confidence based on how complete the information is (high if detailed, lower if sparse)
- Use extractionNotes to document what's missing so users know what to fill in

Return ONLY valid JSON.`;
}

interface ExtractionResult {
  recipe: Partial<CreateRecipeInput> | null;
  error?: string;
  confidence?: number;
}

export async function extractRecipeFromTranscript(
  transcript: string,
  sourceUrl: string,
  platform: "tiktok" | "instagram" | "youtube" | "other",
  postDescription?: string,
  targetLanguage: TargetLanguage = "original",
): Promise<ExtractionResult> {
  if (
    !transcript ||
    transcript.trim().length < 50 ||
    (postDescription && postDescription.trim().length < 50)
  ) {
    return {
      recipe: null,
      error: "Transcript is too short to extract a recipe",
    };
  }

  let userMessage = `Extract the recipe from this video transcript:\n\n${transcript}`;
  if (postDescription) {
    userMessage += `\n\n---\n\nPost description/caption:\n\n${postDescription}`;
  }

  const detectedLanguage = detectTranscriptLanguage(transcript);

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(targetLanguage, detectedLanguage),
        },
        {
          role: "user",
          content: userMessage,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
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

    const nonRecipeCheck = isNonRecipeContent(extracted);
    if (nonRecipeCheck.isNonRecipe) {
      return {
        recipe: null,
        error:
          nonRecipeCheck.reason ||
          "Could not extract a recipe from this transcript. The video may not contain a recipe.",
      };
    }

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
      nutrition: extracted.nutrition || undefined,
      dietaryTags: extracted.dietaryTags || [],
      mealType: extracted.mealType || undefined,
      ingredients: (extracted.ingredients || []).map(
        (ing: Record<string, string>, index: number) => ({
          name: ing.name || `Ingredient ${index + 1}`,
          quantity: ing.quantity || undefined,
          unit: ing.unit || undefined,
          notes: ing.notes || undefined,
          category: ing.category || undefined,
        }),
      ),
      instructions: (extracted.instructions || []).map(
        (inst: Record<string, string | number>, index: number) => ({
          stepNumber: inst.stepNumber || index + 1,
          description: inst.description || "",
          duration: inst.duration || undefined,
          technique: inst.technique || undefined,
        }),
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
      error:
        error instanceof Error ? error.message : "Failed to extract recipe",
    };
  }
}
