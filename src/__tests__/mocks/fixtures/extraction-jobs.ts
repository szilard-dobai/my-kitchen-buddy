import type { ExtractionJob } from "@/types/extraction-job";

export const mockPendingJob: ExtractionJob = {
  _id: "job-123",
  id: "job-123",
  userId: "user-123",
  sourceUrl: "https://www.tiktok.com/@testuser/video/123456",
  normalizedUrl: "https://www.tiktok.com/@testuser/video/123456",
  platform: "tiktok",
  status: "pending",
  progress: 0,
  targetLanguage: "original",
  createdAt: new Date("2024-01-15"),
  updatedAt: new Date("2024-01-15"),
};

export const mockFetchingJob: ExtractionJob = {
  ...mockPendingJob,
  _id: "job-456",
  id: "job-456",
  status: "fetching_transcript",
  progress: 33,
  statusMessage: "Fetching video transcript...",
};

export const mockAnalyzingJob: ExtractionJob = {
  ...mockPendingJob,
  _id: "job-789",
  id: "job-789",
  status: "analyzing",
  progress: 66,
  statusMessage: "Analyzing recipe with AI...",
};

export const mockCompletedJob: ExtractionJob = {
  ...mockPendingJob,
  _id: "job-completed",
  id: "job-completed",
  status: "completed",
  progress: 100,
  statusMessage: "Recipe extracted successfully!",
  recipeId: "recipe-123",
};

export const mockFailedJob: ExtractionJob = {
  ...mockPendingJob,
  _id: "job-failed",
  id: "job-failed",
  status: "failed",
  progress: 33,
  error: "Could not find transcript for this video",
};

export const mockInstagramJob: ExtractionJob = {
  ...mockPendingJob,
  _id: "job-ig",
  id: "job-ig",
  sourceUrl: "https://www.instagram.com/p/ABC123/",
  normalizedUrl: "https://www.instagram.com/p/ABC123/",
  platform: "instagram",
};

export const mockYouTubeJob: ExtractionJob = {
  ...mockPendingJob,
  _id: "job-yt",
  id: "job-yt",
  sourceUrl: "https://www.youtube.com/watch?v=xyz789",
  normalizedUrl: "https://www.youtube.com/watch?v=xyz789",
  platform: "youtube",
};

export const mockJobWithTelegram: ExtractionJob = {
  ...mockPendingJob,
  _id: "job-tg",
  id: "job-tg",
  telegramChatId: 123456789,
};

export const mockOtherUserJob: ExtractionJob = {
  ...mockPendingJob,
  _id: "job-other",
  id: "job-other",
  userId: "user-456",
};
