import { z } from "zod";

export const extractBodySchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048, "URL is too long")
    .url("Invalid URL format")
    .refine((url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    }, "URL must be valid and parseable")
    .refine((url) => {
      const lower = url.toLowerCase();
      const wrongPatterns = [
        { pattern: "/channel/", name: "channel page" },
        { pattern: "/user/", name: "user page" },
        { pattern: "/c/", name: "channel page" },
        { pattern: "/playlist", name: "playlist" },
        { pattern: "/explore", name: "explore page" },
        { pattern: "/accounts", name: "accounts page" },
        { pattern: "/foryou", name: "For You page" },
        { pattern: "/following", name: "Following page" },
      ];

      for (const { pattern } of wrongPatterns) {
        if (lower.includes(pattern)) {
          const hasValidVideoPattern =
            /\/(video|reel|reels|p|watch|shorts|embed)\//.test(lower);
          if (!hasValidVideoPattern) {
            return false;
          }
        }
      }

      const profileOnlyPattern = /instagram\.com\/[\w.]+\/?$/i;
      if (profileOnlyPattern.test(url)) {
        return false;
      }

      const tiktokProfileOnlyPattern = /tiktok\.com\/@[\w.-]+\/?$/i;
      if (tiktokProfileOnlyPattern.test(url)) {
        return false;
      }

      return true;
    }, "This appears to be a profile, channel, or settings page. Please provide a direct link to a video, post, or Reel."),
  targetLanguage: z.enum(["original", "en"]).default("original"),
});

export const extractQuerySchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
});

export type ExtractBody = z.infer<typeof extractBodySchema>;
export type ExtractQuery = z.infer<typeof extractQuerySchema>;
