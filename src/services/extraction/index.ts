import {
  completeExtractionJob,
  failExtractionJob,
  updateExtractionJobStatus,
} from "@/models/extraction-job";
import {
  createRawExtraction,
  findRawExtractionByUrl,
} from "@/models/raw-extraction";
import { createRecipe } from "@/models/recipe";
import type { ExtractionJob } from "@/types/extraction-job";
import type { CreateRecipeInput } from "@/types/recipe";
import { normalizeUrl } from "./platform-detector";
import { extractRecipeFromTranscript } from "./recipe-extractor";
import { getMetadata, getTranscript } from "./supadata";

export async function processExtraction(job: ExtractionJob): Promise<void> {
  const { id, userId, sourceUrl, platform } = job;
  const normalizedUrl = normalizeUrl(sourceUrl);

  try {
    await updateExtractionJobStatus(id, "fetching_transcript", 10, "Checking cache...");

    const cached = await findRawExtractionByUrl(normalizedUrl);

    let extractedRecipe: Partial<CreateRecipeInput>;
    let confidence: number;

    if (cached) {
      await updateExtractionJobStatus(id, "analyzing", 80, "Using cached extraction...");
      extractedRecipe = cached.recipe;
      confidence = cached.confidence;
    } else {
      await updateExtractionJobStatus(id, "fetching_transcript", 10, "Fetching video data...");

      const [transcriptResult, metadataResult] = await Promise.all([
        getTranscript(sourceUrl),
        getMetadata(sourceUrl),
      ]);

      if (transcriptResult.error || !transcriptResult.transcript) {
        await failExtractionJob(id, transcriptResult.error || "Could not fetch transcript");
        return;
      }

      await updateExtractionJobStatus(id, "fetching_transcript", 30, "Video data received");
      await updateExtractionJobStatus(id, "analyzing", 50, "Analyzing with AI...");

      const extractionResult = await extractRecipeFromTranscript(
        transcriptResult.transcript,
        sourceUrl,
        platform,
        metadataResult.description
      );

      if (extractionResult.error || !extractionResult.recipe) {
        await failExtractionJob(id, extractionResult.error || "Could not extract recipe");
        return;
      }

      extractedRecipe = extractionResult.recipe;
      confidence = extractionResult.confidence || 0.8;

      await createRawExtraction(normalizedUrl, extractedRecipe, confidence);
      await updateExtractionJobStatus(id, "analyzing", 80, "Recipe extracted, saving...");
    }

    const recipe = await createRecipe({
      userId,
      title: extractedRecipe.title || "Untitled Recipe",
      description: extractedRecipe.description,
      cuisineType: extractedRecipe.cuisineType,
      difficulty: extractedRecipe.difficulty,
      prepTime: extractedRecipe.prepTime,
      cookTime: extractedRecipe.cookTime,
      totalTime: extractedRecipe.totalTime,
      servings: extractedRecipe.servings,
      caloriesPerServing: extractedRecipe.caloriesPerServing,
      dietaryTags: extractedRecipe.dietaryTags || [],
      mealType: extractedRecipe.mealType,
      ingredients: extractedRecipe.ingredients || [],
      instructions: extractedRecipe.instructions || [],
      equipment: extractedRecipe.equipment || [],
      tipsAndNotes: extractedRecipe.tipsAndNotes || [],
      source: extractedRecipe.source || {
        url: sourceUrl,
        platform,
      },
      extractionMetadata: {
        extractedAt: new Date(),
        confidenceScore: confidence,
      },
    });

    await completeExtractionJob(id, recipe._id!);
  } catch (error) {
    console.error("Extraction processing error:", error);
    await failExtractionJob(
      id,
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}
