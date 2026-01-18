export type ExtractionStatus =
  | "pending"
  | "fetching_transcript"
  | "analyzing"
  | "completed"
  | "failed";

export interface ExtractionJob {
  _id?: string;
  id: string; // Public ID for polling
  userId: string;
  sourceUrl: string;
  platform: "tiktok" | "instagram" | "youtube" | "other";
  status: ExtractionStatus;
  progress: number; // 0-100
  statusMessage?: string;
  recipeId?: string; // Set on completion
  error?: string; // Set on failure
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExtractionJobInput = {
  userId: string;
  sourceUrl: string;
  platform: "tiktok" | "instagram" | "youtube" | "other";
};
