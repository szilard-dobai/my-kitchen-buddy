import { upsertAuthor } from "@/models/author";
import {
  completeExtractionJob,
  failExtractionJob,
  updateExtractionJobStatus,
} from "@/models/extraction-job";
import {
  createRawExtraction,
  findRawExtraction,
} from "@/models/raw-extraction";
import { createRecipe } from "@/models/recipe";
import { incrementExtractionCount } from "@/models/subscription";
import {
  createOrUpdateMetadataCache,
  findMetadataCacheByUrl,
} from "@/models/video-metadata-cache";
import {
  sendError,
  sendRecipePreview,
  sendStatusUpdate,
} from "@/services/telegram/notifications";
import type { DetectedLanguageCode } from "@/types/detected-language";
import type { ExtractionJob, TargetLanguage } from "@/types/extraction-job";
import type { CreateRecipeInput } from "@/types/recipe";
import {
  getInstagramAuthorAvatar,
  getInstagramThumbnail,
  getTikTokAuthorAvatar,
  getYouTubeAuthorAvatar,
  getYouTubeStableThumbnail,
} from "./platform-detector";
import {
  detectTranscriptLanguage,
  extractRecipeFromTranscript,
} from "./recipe-extractor";
import { getMetadata, getTranscript } from "./supadata";

function computeEffectiveTargetLanguage(
  detectedLanguage: DetectedLanguageCode,
  targetLanguage: TargetLanguage,
): TargetLanguage {
  if (detectedLanguage === "en" && targetLanguage === "original") {
    return "en";
  }
  return targetLanguage;
}

export async function processExtraction(job: ExtractionJob): Promise<void> {
  const {
    id,
    userId,
    sourceUrl,
    normalizedUrl,
    platform,
    telegramChatId,
    targetLanguage,
  } = job;

  async function notifyTelegram(message: string) {
    if (telegramChatId) {
      await sendStatusUpdate(telegramChatId, message);
    }
  }

  try {
    await updateExtractionJobStatus(
      id,
      "fetching_transcript",
      10,
      "Fetching video data...",
    );
    await notifyTelegram("Fetching video data...");

    let cachedMetadata = await findMetadataCacheByUrl(normalizedUrl);
    let metadataDescription: string | undefined;

    if (cachedMetadata) {
      await updateExtractionJobStatus(
        id,
        "fetching_transcript",
        15,
        "Using cached metadata...",
      );
      metadataDescription = cachedMetadata.metadata.description;
    } else {
      const metadataResult = await getMetadata(sourceUrl);
      metadataDescription = metadataResult.description;

      if (!metadataResult.error) {
        let authorId: string | undefined;

        const authorUsername =
          metadataResult.author?.username || metadataResult.author?.displayName;

        if (authorUsername) {
          let authorAvatarUrl = metadataResult.author?.avatarUrl;

          if (platform === "instagram") {
            const freshAvatar = await getInstagramAuthorAvatar(sourceUrl);
            if (freshAvatar) {
              authorAvatarUrl = freshAvatar;
            }
          } else if (platform === "tiktok") {
            const freshAvatar = await getTikTokAuthorAvatar(sourceUrl);
            if (freshAvatar) {
              authorAvatarUrl = freshAvatar;
            }
          } else if (platform === "youtube") {
            const freshAvatar = await getYouTubeAuthorAvatar(sourceUrl);
            if (freshAvatar) {
              authorAvatarUrl = freshAvatar;
            }
          }

          const author = await upsertAuthor({
            platform,
            username: authorUsername,
            displayName: metadataResult.author?.displayName,
            avatarUrl: authorAvatarUrl,
            verified: metadataResult.author?.verified,
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
          authorId,
        );
      }
    }

    let transcriptLang: string | undefined;
    if (targetLanguage === "original" && metadataDescription) {
      const descriptionLanguage = detectTranscriptLanguage(metadataDescription);
      if (descriptionLanguage !== "unknown") {
        transcriptLang = descriptionLanguage;
      }
    } else if (targetLanguage === "en") {
      transcriptLang = "en";
    }

    const transcriptResult = await getTranscript(sourceUrl, transcriptLang);

    if (transcriptResult.error || !transcriptResult.transcript) {
      const errorMsg = transcriptResult.error || "Could not fetch transcript";
      await failExtractionJob(id, errorMsg);
      if (telegramChatId) await sendError(telegramChatId, errorMsg);
      return;
    }

    await updateExtractionJobStatus(
      id,
      "fetching_transcript",
      30,
      "Video data received",
    );

    const detectedLanguage = detectTranscriptLanguage(
      transcriptResult.transcript,
    );
    const effectiveTargetLanguage = computeEffectiveTargetLanguage(
      detectedLanguage,
      targetLanguage,
    );

    await updateExtractionJobStatus(id, "analyzing", 40, "Checking cache...");

    let extractedRecipe: Partial<CreateRecipeInput> | undefined;
    let confidence: number | undefined;

    const cached = await findRawExtraction(
      normalizedUrl,
      effectiveTargetLanguage,
    );

    if (cached) {
      await updateExtractionJobStatus(
        id,
        "analyzing",
        80,
        "Using cached extraction...",
      );
      extractedRecipe = cached.recipe;
      confidence = cached.confidence;
    } else {
      await updateExtractionJobStatus(
        id,
        "analyzing",
        50,
        "Analyzing with AI...",
      );
      await notifyTelegram("Analyzing recipe...");

      const extractionResult = await extractRecipeFromTranscript(
        transcriptResult.transcript,
        sourceUrl,
        platform,
        metadataDescription,
        targetLanguage,
      );

      if (extractionResult.error || !extractionResult.recipe) {
        const errorMsg = extractionResult.error || "Could not extract recipe";
        await failExtractionJob(id, errorMsg);
        if (telegramChatId) await sendError(telegramChatId, errorMsg);
        return;
      }

      extractedRecipe = extractionResult.recipe;
      confidence = extractionResult.confidence || 0.8;

      await createRawExtraction(
        normalizedUrl,
        effectiveTargetLanguage,
        detectedLanguage,
        extractedRecipe,
        confidence,
      );
      await updateExtractionJobStatus(
        id,
        "analyzing",
        80,
        "Recipe extracted, saving...",
      );
    }

    const metadataForRecipe = await findMetadataCacheByUrl(normalizedUrl);

    let thumbnailUrl: string | null | undefined;
    let authorAvatarUrl: string | null | undefined;

    if (platform === "youtube") {
      thumbnailUrl = getYouTubeStableThumbnail(sourceUrl);
      const scrapedAvatar = await getYouTubeAuthorAvatar(sourceUrl);
      authorAvatarUrl =
        scrapedAvatar || metadataForRecipe?.metadata.author?.avatarUrl;
    } else if (platform === "instagram") {
      const [freshThumbnail, freshAvatar] = await Promise.all([
        getInstagramThumbnail(sourceUrl),
        getInstagramAuthorAvatar(sourceUrl),
      ]);
      thumbnailUrl =
        freshThumbnail || metadataForRecipe?.metadata.media?.thumbnailUrl;
      authorAvatarUrl =
        freshAvatar || metadataForRecipe?.metadata.author?.avatarUrl;
    } else if (platform === "tiktok") {
      thumbnailUrl = metadataForRecipe?.metadata.media?.thumbnailUrl;
      const scrapedAvatar = await getTikTokAuthorAvatar(sourceUrl);
      authorAvatarUrl =
        scrapedAvatar || metadataForRecipe?.metadata.author?.avatarUrl;
    } else {
      thumbnailUrl = metadataForRecipe?.metadata.media?.thumbnailUrl;
      authorAvatarUrl = metadataForRecipe?.metadata.author?.avatarUrl;
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
          metadataForRecipe?.metadata.author?.username ||
          metadataForRecipe?.metadata.author?.displayName,
        authorId: metadataForRecipe?.authorId,
        authorAvatarUrl: authorAvatarUrl ?? undefined,
        thumbnailUrl: thumbnailUrl ?? undefined,
      },
      extractionMetadata: {
        extractedAt: new Date(),
        confidenceScore: confidence,
      },
    });

    await completeExtractionJob(id, recipe._id!);
    await incrementExtractionCount(userId);

    if (telegramChatId) {
      await sendRecipePreview(telegramChatId, recipe);
    }
  } catch (error) {
    console.error("Extraction processing error:", error);
    const errorMsg =
      error instanceof Error ? error.message : "An unexpected error occurred";
    await failExtractionJob(id, errorMsg);
    if (telegramChatId) await sendError(telegramChatId, errorMsg);
  }
}
