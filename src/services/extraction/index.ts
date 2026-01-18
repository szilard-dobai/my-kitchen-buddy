import {
  updateExtractionJobStatus,
  completeExtractionJob,
  failExtractionJob,
} from "@/models/extraction-job";
import { createRecipe } from "@/models/recipe";
import type { ExtractionJob } from "@/types/extraction-job";
import { extractRecipeFromTranscript } from "./recipe-extractor";
import { getTranscript, getMetadata } from "./supadata";

export async function processExtraction(job: ExtractionJob): Promise<void> {
  const { id, userId, sourceUrl, platform } = job;

  try {
    // Step 1: Fetch transcript and metadata in parallel
    await updateExtractionJobStatus(
      id,
      "fetching_transcript",
      10,
      "Fetching video data..."
    );

    const [transcriptResult, metadataResult] = await Promise.all([
      getTranscript(sourceUrl),
      getMetadata(sourceUrl),
    ]);

    if (transcriptResult.error || !transcriptResult.transcript) {
      await failExtractionJob(
        id,
        transcriptResult.error || "Could not fetch transcript"
      );
      return;
    }

    await updateExtractionJobStatus(
      id,
      "fetching_transcript",
      30,
      "Video data received"
    );

    // Step 2: Extract recipe with AI (70% progress)
    await updateExtractionJobStatus(
      id,
      "analyzing",
      50,
      "Analyzing with AI..."
    );

    const extractionResult = await extractRecipeFromTranscript(
      transcriptResult.transcript,
      sourceUrl,
      platform,
      metadataResult.description
    );

    if (extractionResult.error || !extractionResult.recipe) {
      await failExtractionJob(
        id,
        extractionResult.error || "Could not extract recipe"
      );
      return;
    }

    await updateExtractionJobStatus(
      id,
      "analyzing",
      80,
      "Recipe extracted, saving..."
    );

    // Step 3: Save recipe to database
    const recipe = await createRecipe({
      userId,
      title: extractionResult.recipe.title || "Untitled Recipe",
      description: extractionResult.recipe.description,
      cuisineType: extractionResult.recipe.cuisineType,
      difficulty: extractionResult.recipe.difficulty,
      prepTime: extractionResult.recipe.prepTime,
      cookTime: extractionResult.recipe.cookTime,
      totalTime: extractionResult.recipe.totalTime,
      servings: extractionResult.recipe.servings,
      caloriesPerServing: extractionResult.recipe.caloriesPerServing,
      dietaryTags: extractionResult.recipe.dietaryTags || [],
      mealType: extractionResult.recipe.mealType,
      ingredients: extractionResult.recipe.ingredients || [],
      instructions: extractionResult.recipe.instructions || [],
      equipment: extractionResult.recipe.equipment || [],
      tipsAndNotes: extractionResult.recipe.tipsAndNotes || [],
      source: extractionResult.recipe.source || {
        url: sourceUrl,
        platform,
      },
      extractionMetadata: {
        extractedAt: new Date(),
        confidenceScore: extractionResult.confidence,
      },
    });

    // Step 4: Complete the job
    await completeExtractionJob(id, recipe._id!);
  } catch (error) {
    console.error("Extraction processing error:", error);
    await failExtractionJob(
      id,
      error instanceof Error ? error.message : "An unexpected error occurred"
    );
  }
}
