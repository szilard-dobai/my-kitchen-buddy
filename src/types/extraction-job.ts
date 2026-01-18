export type ExtractionStatus =
  | "pending"
  | "fetching_transcript"
  | "analyzing"
  | "completed"
  | "failed";

export interface ExtractionJob {
  _id?: string;
  id: string;
  userId: string;
  sourceUrl: string;
  platform: "tiktok" | "instagram" | "youtube" | "other";
  status: ExtractionStatus;
  progress: number;
  statusMessage?: string;
  recipeId?: string;
  error?: string;
  telegramChatId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExtractionJobInput = {
  userId: string;
  sourceUrl: string;
  platform: "tiktok" | "instagram" | "youtube" | "other";
  telegramChatId?: number;
};
