import type { Author } from "@/types/author";

export const mockTikTokAuthor: Author = {
  _id: "author-123",
  platform: "tiktok",
  username: "testuser",
  displayName: "Test User",
  avatarUrl: "https://example.com/tiktok-avatar.jpg",
  verified: false,
  firstSeenAt: new Date("2024-01-01"),
  lastUpdatedAt: new Date("2024-01-15"),
};

export const mockInstagramAuthor: Author = {
  _id: "author-456",
  platform: "instagram",
  username: "healthyfoodie",
  displayName: "Healthy Foodie",
  avatarUrl: "https://example.com/ig-avatar.jpg",
  verified: true,
  firstSeenAt: new Date("2024-01-01"),
  lastUpdatedAt: new Date("2024-01-15"),
};

export const mockYouTubeAuthor: Author = {
  _id: "author-789",
  platform: "youtube",
  username: "chefpro",
  displayName: "Chef Pro",
  avatarUrl: "https://example.com/yt-avatar.jpg",
  verified: true,
  firstSeenAt: new Date("2024-01-01"),
  lastUpdatedAt: new Date("2024-01-15"),
};

export const mockAuthorWithoutAvatar: Author = {
  _id: "author-no-avatar",
  platform: "tiktok",
  username: "noavataruser",
  displayName: "No Avatar User",
  firstSeenAt: new Date("2024-01-01"),
  lastUpdatedAt: new Date("2024-01-15"),
};
