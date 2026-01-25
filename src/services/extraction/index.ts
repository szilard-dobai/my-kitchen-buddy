import { upsertAuthor } from "@/models/author";
import {
  completeExtractionJob,
  failExtractionJob,
  findInProgressJobByUrl,
  updateExtractionJobStatus,
  waitForJobCompletion,
} from "@/models/extraction-job";
import {
  createRawExtraction,
  findRawExtractionByUrl,
} from "@/models/raw-extraction";
import { createRecipe } from "@/models/recipe";
import {
  createOrUpdateMetadataCache,
  findMetadataCacheByUrl,
} from "@/models/video-metadata-cache";
import {
  sendError,
  sendRecipePreview,
  sendStatusUpdate,
} from "@/services/telegram/notifications";
import type { ExtractionJob } from "@/types/extraction-job";
import type { CreateRecipeInput } from "@/types/recipe";
import { normalizeUrl } from "./platform-detector";
import { extractRecipeFromTranscript } from "./recipe-extractor";
import { getMetadata, getTranscript } from "./supadata";

export async function processExtraction(job: ExtractionJob): Promise<void> {
  const { id, userId, sourceUrl, platform, telegramChatId, targetLanguage } = job;
  const normalizedUrl = normalizeUrl(sourceUrl);

  async function notifyTelegram(message: string) {
    if (telegramChatId) {
      await sendStatusUpdate(telegramChatId, message);
    }
  }

  try {
    await updateExtractionJobStatus(id, "fetching_transcript", 10, "Checking cache...");

    let extractedRecipe: Partial<CreateRecipeInput> | undefined;
    let confidence: number | undefined;

    const cached = await findRawExtractionByUrl(normalizedUrl);

    if (cached) {
      await updateExtractionJobStatus(id, "analyzing", 80, "Using cached extraction...");
      extractedRecipe = cached.recipe;
      confidence = cached.confidence;
    } else {
      const inProgressJob = await findInProgressJobByUrl(normalizedUrl);

      if (inProgressJob && inProgressJob.id !== id) {
        await updateExtractionJobStatus(id, "fetching_transcript", 10, "Waiting for in-progress extraction...");
        await notifyTelegram("Another extraction is in progress, waiting...");

        try {
          const completedJob = await waitForJobCompletion(inProgressJob.id, 300000);

          if (completedJob.status === "completed") {
            const nowCached = await findRawExtractionByUrl(normalizedUrl);
            if (nowCached) {
              extractedRecipe = nowCached.recipe;
              confidence = nowCached.confidence;
              await updateExtractionJobStatus(id, "analyzing", 80, "Using completed extraction...");
            } else {
              throw new Error("Cache not found after job completion");
            }
          } else {
            throw new Error("In-progress job failed, retrying extraction");
          }
        } catch (error) {
          console.warn("Piggyback failed, falling back to normal extraction:", error);
        }
      }

      if (!extractedRecipe) {
        await updateExtractionJobStatus(id, "fetching_transcript", 10, "Fetching video data...");
        await notifyTelegram("Fetching video data...");

        let cachedMetadata = await findMetadataCacheByUrl(normalizedUrl);

        let metadataDescription: string | undefined;

        if (cachedMetadata) {
          await updateExtractionJobStatus(id, "fetching_transcript", 15, "Using cached metadata...");
          metadataDescription = cachedMetadata.metadata.description;
        }

        const transcriptResult = await getTranscript(sourceUrl);

        if (transcriptResult.error || !transcriptResult.transcript) {
          const errorMsg = transcriptResult.error || "Could not fetch transcript";
          await failExtractionJob(id, errorMsg);
          if (telegramChatId) await sendError(telegramChatId, errorMsg);
          return;
        }

        if (!cachedMetadata) {
          const metadataResult = await getMetadata(sourceUrl);
          metadataDescription = metadataResult.description;

          if (!metadataResult.error) {
            let authorId: string | undefined;

            if (metadataResult.author?.username) {
              const author = await upsertAuthor({
                platform,
                username: metadataResult.author.username,
                displayName: metadataResult.author.displayName,
                avatarUrl: metadataResult.author.avatarUrl,
                verified: metadataResult.author.verified,
              });
              authorId = author._id;
            }

            cachedMetadata = await createOrUpdateMetadataCache(
              normalizedUrl,
              platform,
              {
                title: metadataResult.title,
                description: metadataResult.description,
                author: metadataResult.author,
                media: metadataResult.media,
                tags: metadataResult.tags,
              },
              authorId
            );
          }
        }

        await updateExtractionJobStatus(id, "fetching_transcript", 30, "Video data received");
        await updateExtractionJobStatus(id, "analyzing", 50, "Analyzing with AI...");
        await notifyTelegram("Analyzing recipe...");

        const extractionResult = await extractRecipeFromTranscript(
          transcriptResult.transcript,
          sourceUrl,
          platform,
          metadataDescription,
          targetLanguage
        );

        if (extractionResult.error || !extractionResult.recipe) {
          const errorMsg = extractionResult.error || "Could not extract recipe";
          await failExtractionJob(id, errorMsg);
          if (telegramChatId) await sendError(telegramChatId, errorMsg);
          return;
        }

        extractedRecipe = extractionResult.recipe;
        confidence = extractionResult.confidence || 0.8;

        await createRawExtraction(normalizedUrl, extractedRecipe, confidence);
        await updateExtractionJobStatus(id, "analyzing", 80, "Recipe extracted, saving...");
      }
    }

    const metadataForRecipe = await findMetadataCacheByUrl(normalizedUrl);

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
      nutrition: extractedRecipe.nutrition,
      dietaryTags: extractedRecipe.dietaryTags || [],
      mealType: extractedRecipe.mealType,
      ingredients: extractedRecipe.ingredients || [],
      instructions: extractedRecipe.instructions || [],
      equipment: extractedRecipe.equipment || [],
      tipsAndNotes: extractedRecipe.tipsAndNotes || [],
      source: {
        url: sourceUrl,
        platform,
        authorUsername:
          extractedRecipe.source?.authorUsername ||
          metadataForRecipe?.metadata.author?.username,
        authorId: metadataForRecipe?.authorId,
        authorAvatarUrl: metadataForRecipe?.metadata.author?.avatarUrl,
        thumbnailUrl: metadataForRecipe?.metadata.media?.thumbnailUrl,
      },
      extractionMetadata: {
        extractedAt: new Date(),
        confidenceScore: confidence,
      },
    });

    await completeExtractionJob(id, recipe._id!);

    if (telegramChatId) {
      await sendRecipePreview(telegramChatId, recipe);
    }
  } catch (error) {
    console.error("Extraction processing error:", error);
    const errorMsg = error instanceof Error ? error.message : "An unexpected error occurred";
    await failExtractionJob(id, errorMsg);
    if (telegramChatId) await sendError(telegramChatId, errorMsg);
  }
}
