import OpenAI from "openai";
import type { TargetLanguage } from "@/types/extraction-job";
import type { CreateRecipeInput } from "@/types/recipe";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function detectTranscriptLanguage(transcript: string): string {
  const sample = ` ${transcript.slice(0, 500).toLowerCase()} `;

  const patterns: Array<{ lang: string; markers: string[] }> = [
    { lang: "English", markers: [" the ", " and ", " you ", " that ", " this ", " with ", " have ", " for ", " are ", " but ", " not ", " what ", " all ", " were ", " when ", " your ", " can ", " there ", " an ", " which "] },
    { lang: "Hungarian", markers: ["és", "azt", "egy", "nem", "hogy", "van", "meg", "csak", "már", "ezt", "ő", "ű", "ö", "ü"] },
    { lang: "German", markers: ["und", "der", "die", "das", "ist", "nicht", "ein", "eine", "auch", "mit", "für", "ß", "ä", "ö", "ü"] },
    { lang: "French", markers: ["le", "la", "les", "de", "et", "est", "un", "une", "que", "pour", "dans", "avec", "ç", "é", "è", "ê", "à"] },
    { lang: "Spanish", markers: ["el", "la", "los", "las", "de", "que", "es", "un", "una", "con", "para", "ñ", "á", "é", "í", "ó", "ú"] },
    { lang: "Italian", markers: ["il", "la", "di", "che", "è", "un", "una", "per", "con", "non", "gli", "à", "ò", "ù"] },
    { lang: "Portuguese", markers: ["de", "que", "o", "a", "os", "as", "um", "uma", "para", "com", "não", "ã", "õ", "ç"] },
    { lang: "Dutch", markers: ["de", "het", "een", "van", "en", "dat", "is", "niet", "op", "te", "ij", "aan"] },
    { lang: "Polish", markers: ["nie", "się", "że", "to", "jest", "na", "do", "jak", "tak", "za", "ą", "ę", "ć", "ł", "ń", "ó", "ś", "ź", "ż"] },
    { lang: "Romanian", markers: ["de", "și", "la", "în", "cu", "nu", "pe", "un", "o", "că", "ă", "â", "î", "ș", "ț"] },
    { lang: "Czech", markers: ["je", "že", "na", "to", "se", "ne", "ale", "tak", "jak", "ř", "ě", "š", "č", "ž", "ů", "ý"] },
    { lang: "Russian", markers: ["и", "в", "не", "на", "что", "он", "с", "как", "это", "а", "но", "по", "она"] },
    { lang: "Ukrainian", markers: ["і", "в", "не", "на", "що", "він", "з", "як", "це", "а", "але", "та", "ї", "є"] },
    { lang: "Japanese", markers: ["の", "は", "を", "に", "が", "と", "で", "た", "し", "て", "も", "ます", "です"] },
    { lang: "Korean", markers: ["은", "는", "이", "가", "을", "를", "에", "의", "로", "와", "과", "도", "하고"] },
    { lang: "Chinese", markers: ["的", "是", "了", "在", "不", "有", "和", "人", "这", "我", "他", "们"] },
    { lang: "Arabic", markers: ["في", "من", "على", "إلى", "أن", "هذا", "و", "ما", "لا", "التي", "الذي"] },
    { lang: "Turkish", markers: ["ve", "bir", "bu", "için", "ile", "de", "da", "ne", "var", "ı", "ş", "ğ", "ü", "ö", "ç"] },
    { lang: "Albanian", markers: ["dhe", "një", "për", "që", "në", "është", "me", "të", "ka", "ë"] },
  ];

  let bestMatch = { lang: "the same language as the transcript", score: 0 };

  for (const { lang, markers } of patterns) {
    let score = 0;
    for (const marker of markers) {
      if (sample.includes(marker)) {
        score++;
      }
    }
    if (score > bestMatch.score) {
      bestMatch = { lang, score };
    }
  }

  if (bestMatch.score >= 3) {
    return bestMatch.lang;
  }

  return "the same language as the transcript";
}

function buildSystemPrompt(targetLanguage: TargetLanguage, detectedLanguage: string): string {
  const languageInstruction =
    targetLanguage === "en"
      ? "LANGUAGE: Translate ALL text output (title, description, ingredients, instructions, tips, etc.) to English, regardless of the source language."
      : `CRITICAL LANGUAGE REQUIREMENT - THIS IS MANDATORY:
- The transcript appears to be in ${detectedLanguage}.
- You MUST output ALL text in ${detectedLanguage} ONLY.
- DO NOT translate ANY part of the output to English, French, Albanian, or any other language.
- Every single field (title, description, ALL ingredients, ALL instructions, ALL tips) MUST be in ${detectedLanguage}.
- If you are uncertain, keep the EXACT original words from the transcript.
- VIOLATION OF THIS RULE IS UNACCEPTABLE. Double-check your output before responding.`;

  return `You are a recipe extraction system. Given a transcript from a cooking video (and optionally the post description/caption), extract the recipe information.

${languageInstruction}

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
  targetLanguage: TargetLanguage = "original"
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

    if (!extracted.title) {
      return {
        recipe: null,
        error: "Could not extract a recipe from this transcript. The video may not contain a recipe.",
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
