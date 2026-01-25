import getDb from "@/lib/db";
import type { DetectedLanguageCode } from "@/types/detected-language";
import type { TargetLanguage } from "@/types/extraction-job";
import type { RawExtraction } from "@/types/raw-extraction";
import type { CreateRecipeInput } from "@/types/recipe";

const COLLECTION_NAME = "raw_extractions";

async function getRawExtractionsCollection() {
  const db = await getDb();
  const collection = db.collection(COLLECTION_NAME);
  await collection.createIndex(
    { normalizedUrl: 1, targetLanguage: 1 },
    { unique: true },
  );
  return collection;
}

export async function findRawExtraction(
  normalizedUrl: string,
  targetLanguage: TargetLanguage,
): Promise<RawExtraction | null> {
  const collection = await getRawExtractionsCollection();
  const doc = await collection.findOne({ normalizedUrl, targetLanguage });

  if (!doc) return null;

  return {
    _id: doc._id.toString(),
    normalizedUrl: doc.normalizedUrl,
    targetLanguage: doc.targetLanguage,
    detectedLanguage: doc.detectedLanguage,
    recipe: doc.recipe,
    confidence: doc.confidence,
    createdAt: doc.createdAt,
  } as RawExtraction;
}

export async function createRawExtraction(
  normalizedUrl: string,
  targetLanguage: TargetLanguage,
  detectedLanguage: DetectedLanguageCode,
  recipe: Partial<CreateRecipeInput>,
  confidence: number,
): Promise<RawExtraction> {
  const collection = await getRawExtractionsCollection();

  const doc = {
    normalizedUrl,
    targetLanguage,
    detectedLanguage,
    recipe,
    confidence,
    createdAt: new Date(),
  };

  const result = await collection.insertOne(doc);

  return {
    ...doc,
    _id: result.insertedId.toString(),
  };
}
