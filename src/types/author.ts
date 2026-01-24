export type Platform = "tiktok" | "instagram" | "youtube" | "other";

export interface Author {
  _id?: string;
  platform: Platform;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  verified?: boolean;
  firstSeenAt: Date;
  lastUpdatedAt: Date;
}

export type CreateAuthorInput = Omit<
  Author,
  "_id" | "firstSeenAt" | "lastUpdatedAt"
>;
