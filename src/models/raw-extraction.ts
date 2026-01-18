import getDb from "@/lib/db";
import type { RawExtraction } from "@/types/raw-extraction";
import type { CreateRecipeInput } from "@/types/recipe";

const COLLECTION_NAME = "raw_extractions";

async function getRawExtractionsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function findRawExtractionByUrl(
  normalizedUrl: string
): Promise<RawExtraction | null> {
  const collection = await getRawExtractionsCollection();
  const doc = await collection.findOne({ normalizedUrl });

  if (!doc) return null;

  return {
    _id: doc._id.toString(),
    normalizedUrl: doc.normalizedUrl,
    recipe: doc.recipe,
    confidence: doc.confidence,
    createdAt: doc.createdAt,
  } as RawExtraction;
}

export async function createRawExtraction(
  normalizedUrl: string,
  recipe: Partial<CreateRecipeInput>,
  confidence: number
): Promise<RawExtraction> {
  const collection = await getRawExtractionsCollection();

  const doc = {
    normalizedUrl,
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
