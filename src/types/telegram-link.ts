import type { TargetLanguage } from "./extraction-job";

export interface TelegramLink {
  _id?: string;
  userId: string;
  telegramUserId: number;
  telegramUsername?: string;
  telegramFirstName: string;
  preferredLanguage: TargetLanguage;
  linkedAt: Date;
}

export type CreateTelegramLinkInput = Omit<TelegramLink, "_id" | "linkedAt" | "preferredLanguage">;
