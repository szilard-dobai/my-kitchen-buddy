export type ExtractionStatus =
  | "pending"
  | "fetching_transcript"
  | "analyzing"
  | "completed"
  | "failed";

export type TargetLanguage = "original" | "en";

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
  targetLanguage: TargetLanguage;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateExtractionJobInput = {
  userId: string;
  sourceUrl: string;
  platform: "tiktok" | "instagram" | "youtube" | "other";
  telegramChatId?: number;
  targetLanguage?: TargetLanguage;
};
