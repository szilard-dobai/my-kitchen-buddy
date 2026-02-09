import { describe, expect, it } from "vitest";
import { extractBodySchema } from "@/lib/validation/schemas/extract";

describe("extractBodySchema", () => {
  describe("URL validation", () => {
    it("accepts valid TikTok video URLs", () => {
      const result = extractBodySchema.parse({
        url: "https://tiktok.com/@user/video/123456",
      });
      expect(result.url).toBe("https://tiktok.com/@user/video/123456");
      expect(result.targetLanguage).toBe("original");
    });

    it("accepts valid Instagram post URLs", () => {
      const result = extractBodySchema.parse({
        url: "https://instagram.com/p/ABC123",
      });
      expect(result.url).toBe("https://instagram.com/p/ABC123");
    });

    it("accepts valid YouTube video URLs", () => {
      const result = extractBodySchema.parse({
        url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      });
      expect(result.url).toBe("https://youtube.com/watch?v=dQw4w9WgXcQ");
    });

    it("accepts targetLanguage parameter", () => {
      const result = extractBodySchema.parse({
        url: "https://tiktok.com/@user/video/123",
        targetLanguage: "en",
      });
      expect(result.targetLanguage).toBe("en");
    });

    it("defaults targetLanguage to 'original'", () => {
      const result = extractBodySchema.parse({
        url: "https://tiktok.com/@user/video/123",
      });
      expect(result.targetLanguage).toBe("original");
    });
  });

  describe("URL trimming", () => {
    it("trims leading whitespace", () => {
      const result = extractBodySchema.parse({
        url: "   https://tiktok.com/@user/video/123",
      });
      expect(result.url).toBe("https://tiktok.com/@user/video/123");
    });

    it("trims trailing whitespace", () => {
      const result = extractBodySchema.parse({
        url: "https://tiktok.com/@user/video/123   ",
      });
      expect(result.url).toBe("https://tiktok.com/@user/video/123");
    });

    it("trims both leading and trailing whitespace", () => {
      const result = extractBodySchema.parse({
        url: "  https://instagram.com/p/ABC123  ",
      });
      expect(result.url).toBe("https://instagram.com/p/ABC123");
    });
  });

  describe("URL length validation", () => {
    it("rejects URLs longer than 2048 characters", () => {
      const longUrl = "https://example.com/" + "a".repeat(2050);
      expect(() => extractBodySchema.parse({ url: longUrl })).toThrow(
        "too long",
      );
    });

    it("accepts URLs at exactly 2048 characters", () => {
      const exactUrl = "https://example.com/" + "a".repeat(2028);
      const result = extractBodySchema.parse({ url: exactUrl });
      expect(result.url.length).toBe(2048);
    });

    it("accepts short URLs", () => {
      const result = extractBodySchema.parse({
        url: "https://youtu.be/abc",
      });
      expect(result.url).toBe("https://youtu.be/abc");
    });
  });

  describe("URL format validation", () => {
    it("rejects empty strings", () => {
      expect(() => extractBodySchema.parse({ url: "" })).toThrow("required");
    });

    it("rejects whitespace-only strings", () => {
      expect(() => extractBodySchema.parse({ url: "   " })).toThrow("required");
    });

    it("rejects malformed URLs", () => {
      expect(() => extractBodySchema.parse({ url: "not-a-url" })).toThrow(
        "Invalid URL format",
      );
    });

    it("rejects URLs without protocol", () => {
      expect(() =>
        extractBodySchema.parse({ url: "youtube.com/watch?v=abc" }),
      ).toThrow();
    });

    it("accepts URLs with various protocols (Zod allows them)", () => {
      const result = extractBodySchema.parse({
        url: "ftp://youtube.com/watch?v=abc",
      });
      expect(result.url).toBe("ftp://youtube.com/watch?v=abc");
    });
  });

  describe("profile and channel rejection", () => {
    it("rejects Instagram profile URLs", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://instagram.com/username" }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects Instagram profile URLs with trailing slash", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://instagram.com/username/" }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects TikTok profile URLs", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://tiktok.com/@username" }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects TikTok profile URLs with trailing slash", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://tiktok.com/@username/" }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects YouTube channel URLs", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://youtube.com/channel/UC123" }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects YouTube user URLs", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://youtube.com/user/username" }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects YouTube playlist URLs", () => {
      expect(() =>
        extractBodySchema.parse({
          url: "https://youtube.com/playlist?list=PLxxx",
        }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects Instagram explore page", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://instagram.com/explore" }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects Instagram accounts page", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://instagram.com/accounts/edit" }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects TikTok For You page", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://tiktok.com/foryou" }),
      ).toThrow("profile, channel, or settings page");
    });

    it("rejects TikTok Following page", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://tiktok.com/following" }),
      ).toThrow("profile, channel, or settings page");
    });
  });

  describe("valid video URLs with potential false positives", () => {
    it("accepts Instagram post with username that looks like /channel/", () => {
      const result = extractBodySchema.parse({
        url: "https://instagram.com/channelcooking/p/ABC123",
      });
      expect(result.url).toBe("https://instagram.com/channelcooking/p/ABC123");
    });

    it("accepts TikTok video from user with 'following' in name", () => {
      const result = extractBodySchema.parse({
        url: "https://tiktok.com/@following_recipes/video/123",
      });
      expect(result.url).toBe(
        "https://tiktok.com/@following_recipes/video/123",
      );
    });

    it("rejects URLs with wrong patterns in path (even in query params)", () => {
      expect(() =>
        extractBodySchema.parse({
          url: "https://youtube.com/channel/test?v=abc",
        }),
      ).toThrow("profile, channel, or settings page");
    });
  });

  describe("edge cases", () => {
    it("handles URLs with query parameters", () => {
      const result = extractBodySchema.parse({
        url: "https://youtube.com/watch?v=abc&feature=share",
      });
      expect(result.url).toBe("https://youtube.com/watch?v=abc&feature=share");
    });

    it("handles URLs with hash fragments", () => {
      const result = extractBodySchema.parse({
        url: "https://instagram.com/p/ABC123#comments",
      });
      expect(result.url).toBe("https://instagram.com/p/ABC123#comments");
    });

    it("is case insensitive for pattern matching", () => {
      expect(() =>
        extractBodySchema.parse({ url: "https://INSTAGRAM.COM/USERNAME" }),
      ).toThrow("profile");
    });

    it("handles www subdomains", () => {
      const result = extractBodySchema.parse({
        url: "https://www.youtube.com/watch?v=abc",
      });
      expect(result.url).toBe("https://www.youtube.com/watch?v=abc");
    });

    it("handles mobile subdomains", () => {
      const result = extractBodySchema.parse({
        url: "https://m.youtube.com/watch?v=abc",
      });
      expect(result.url).toBe("https://m.youtube.com/watch?v=abc");
    });
  });

  describe("targetLanguage validation", () => {
    it("accepts 'original' as targetLanguage", () => {
      const result = extractBodySchema.parse({
        url: "https://tiktok.com/@user/video/123",
        targetLanguage: "original",
      });
      expect(result.targetLanguage).toBe("original");
    });

    it("accepts 'en' as targetLanguage", () => {
      const result = extractBodySchema.parse({
        url: "https://tiktok.com/@user/video/123",
        targetLanguage: "en",
      });
      expect(result.targetLanguage).toBe("en");
    });

    it("rejects invalid targetLanguage values", () => {
      expect(() =>
        extractBodySchema.parse({
          url: "https://tiktok.com/@user/video/123",
          targetLanguage: "fr",
        }),
      ).toThrow();
    });

    it("rejects targetLanguage as number", () => {
      expect(() =>
        extractBodySchema.parse({
          url: "https://tiktok.com/@user/video/123",
          targetLanguage: 123,
        }),
      ).toThrow();
    });
  });
});
