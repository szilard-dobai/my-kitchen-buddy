import type { TelegramLink } from "@/types/telegram-link";

export const mockTelegramLink: TelegramLink = {
  _id: "tg-link-123",
  userId: "user-123",
  telegramUserId: 123456789,
  telegramUsername: "testuser_tg",
  telegramFirstName: "Test",
  preferredLanguage: "original",
  linkedAt: new Date("2024-01-10"),
};

export const mockTelegramLinkNoUsername: TelegramLink = {
  _id: "tg-link-456",
  userId: "user-456",
  telegramUserId: 987654321,
  telegramFirstName: "NoUsername",
  preferredLanguage: "en",
  linkedAt: new Date("2024-01-05"),
};
