import getDb from "@/lib/db";
import type { VideoMetadata, VideoMetadataCache } from "@/types/video-metadata-cache";

const COLLECTION_NAME = "video_metadata_cache";

async function getVideoMetadataCacheCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function findMetadataCacheByUrl(
  normalizedUrl: string
): Promise<VideoMetadataCache | null> {
  const collection = await getVideoMetadataCacheCollection();
  const doc = await collection.findOne({ normalizedUrl });

  if (!doc) return null;

  return {
    _id: doc._id.toString(),
    normalizedUrl: doc.normalizedUrl,
    platform: doc.platform,
    metadata: doc.metadata,
    fetchedAt: doc.fetchedAt,
    updatedAt: doc.updatedAt,
  } as VideoMetadataCache;
}

export async function createOrUpdateMetadataCache(
  normalizedUrl: string,
  platform: "tiktok" | "instagram" | "youtube" | "other",
  metadata: VideoMetadata
): Promise<VideoMetadataCache> {
  const collection = await getVideoMetadataCacheCollection();
  const now = new Date();

  const doc = {
    normalizedUrl,
    platform,
    metadata,
    fetchedAt: now,
    updatedAt: now,
  };

  const result = await collection.updateOne(
    { normalizedUrl },
    {
      $set: {
        ...doc,
        updatedAt: now,
      },
      $setOnInsert: {
        fetchedAt: now,
      },
    },
    { upsert: true }
  );

  if (result.upsertedId) {
    return {
      ...doc,
      _id: result.upsertedId.toString(),
    };
  }

  const updated = await collection.findOne({ normalizedUrl });
  return {
    _id: updated!._id.toString(),
    normalizedUrl: updated!.normalizedUrl,
    platform: updated!.platform,
    metadata: updated!.metadata,
    fetchedAt: updated!.fetchedAt,
    updatedAt: updated!.updatedAt,
  } as VideoMetadataCache;
}
