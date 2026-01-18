import { ObjectId } from "mongodb";
import { nanoid } from "nanoid";
import getDb from "@/lib/db";
import type {
  ExtractionJob,
  CreateExtractionJobInput,
  ExtractionStatus,
} from "@/types/extraction-job";

const COLLECTION_NAME = "extractionJobs";

export async function getExtractionJobsCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function createExtractionJob(
  input: CreateExtractionJobInput
): Promise<ExtractionJob> {
  const collection = await getExtractionJobsCollection();
  const now = new Date();

  const job: Omit<ExtractionJob, "_id"> = {
    id: nanoid(10),
    userId: input.userId,
    sourceUrl: input.sourceUrl,
    platform: input.platform,
    status: "pending",
    progress: 0,
    telegramChatId: input.telegramChatId,
    targetLanguage: input.targetLanguage || "original",
    createdAt: now,
    updatedAt: now,
  };

  const result = await collection.insertOne(job);

  return {
    ...job,
    _id: result.insertedId.toString(),
  };
}

export async function getExtractionJobById(
  id: string
): Promise<ExtractionJob | null> {
  const collection = await getExtractionJobsCollection();

  let job = await collection.findOne({ id });

  if (!job) {
    try {
      job = await collection.findOne({ _id: new ObjectId(id) });
    } catch {
      return null;
    }
  }

  if (!job) return null;

  return {
    ...job,
    _id: job._id.toString(),
  } as ExtractionJob;
}

export async function updateExtractionJobStatus(
  id: string,
  status: ExtractionStatus,
  progress: number,
  statusMessage?: string
): Promise<void> {
  const collection = await getExtractionJobsCollection();

  await collection.updateOne(
    { id },
    {
      $set: {
        status,
        progress,
        statusMessage,
        updatedAt: new Date(),
      },
    }
  );
}

export async function completeExtractionJob(
  id: string,
  recipeId: string
): Promise<void> {
  const collection = await getExtractionJobsCollection();

  await collection.updateOne(
    { id },
    {
      $set: {
        status: "completed",
        progress: 100,
        recipeId,
        statusMessage: "Recipe extracted successfully",
        updatedAt: new Date(),
      },
    }
  );
}

export async function failExtractionJob(
  id: string,
  error: string
): Promise<void> {
  const collection = await getExtractionJobsCollection();

  await collection.updateOne(
    { id },
    {
      $set: {
        status: "failed",
        error,
        statusMessage: error,
        updatedAt: new Date(),
      },
    }
  );
}
