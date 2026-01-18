export interface TelegramLink {
  _id?: string;
  userId: string;
  telegramUserId: number;
  telegramUsername?: string;
  telegramFirstName: string;
  linkedAt: Date;
}

export type CreateTelegramLinkInput = Omit<TelegramLink, "_id" | "linkedAt">;
