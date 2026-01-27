import getDb from "@/lib/db";
import type { DeviceType, TrackingEventType } from "@/lib/tracking/types";

const COLLECTION_NAME = "tracking";

interface TrackingInsert {
  type: TrackingEventType;
  deviceId: string;
  deviceType: DeviceType;
  userId?: string;
  country?: string;
  region?: string;
  metadata?: Record<string, unknown>;
}

export async function getTrackingCollection() {
  const db = await getDb();
  return db.collection(COLLECTION_NAME);
}

export async function insertTrackingEvent(data: TrackingInsert): Promise<void> {
  const collection = await getTrackingCollection();

  await collection.insertOne({
    ...data,
    timestamp: new Date(),
  });
}
