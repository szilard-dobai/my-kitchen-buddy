import { describe, expect, it } from "vitest";
import {
  detectPlatform,
  normalizeUrl,
} from "@/services/extraction/platform-detector";

describe("validateContentUrl / detectPlatform", () => {
  describe("invalid URL format", () => {
    it("rejects malformed URLs", () => {
      expect(detectPlatform("not-a-url")).toMatchObject({
        isValid: false,
        platform: "other",
        error: "Invalid URL format",
      });
    });
  });

  describe("YouTube - rejected patterns", () => {
    it("rejects channel URLs with @ handle", () => {
      const result = detectPlatform("https://youtube.com/@username");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("youtube");
      expect(result.error).toContain("channel");
    });

    it("rejects channel URLs with /channel/", () => {
      const result = detectPlatform("https://youtube.com/channel/UCxxxxxx");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("youtube");
      expect(result.error).toContain("channel");
    });

    it("rejects user URLs with /user/", () => {
      const result = detectPlatform("https://youtube.com/user/username");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("youtube");
      expect(result.error).toContain("channel");
    });

    it("rejects custom channel URLs with /c/", () => {
      const result = detectPlatform("https://youtube.com/c/channelname");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("youtube");
      expect(result.error).toContain("channel");
    });

    it("rejects playlist URLs", () => {
      const result = detectPlatform(
        "https://youtube.com/playlist?list=PLxxxxxx",
      );
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("youtube");
      expect(result.error).toContain("playlist");
    });

    it("rejects YouTube homepage", () => {
      const result = detectPlatform("https://youtube.com/");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("youtube");
    });
  });

  describe("YouTube - accepted patterns", () => {
    it("accepts watch URLs", () => {
      const result = detectPlatform("https://youtube.com/watch?v=dQw4w9WgXcQ");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("youtube");
      expect(result.error).toBeUndefined();
    });

    it("accepts shorts URLs", () => {
      const result = detectPlatform("https://youtube.com/shorts/abc123");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("youtube");
    });

    it("accepts youtu.be short URLs", () => {
      const result = detectPlatform("https://youtu.be/dQw4w9WgXcQ");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("youtube");
    });

    it("accepts embed URLs", () => {
      const result = detectPlatform("https://youtube.com/embed/abc123");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("youtube");
    });

    it("accepts URLs without www", () => {
      const result = detectPlatform("https://youtube.com/watch?v=abc123");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("youtube");
    });
  });

  describe("Instagram - rejected patterns", () => {
    it("rejects profile URLs (username only)", () => {
      const result = detectPlatform("https://instagram.com/username");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("instagram");
      expect(result.error).toContain("profile");
    });

    it("rejects profile URLs with trailing slash", () => {
      const result = detectPlatform("https://instagram.com/username/");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("instagram");
    });

    it("rejects explore page", () => {
      const result = detectPlatform("https://instagram.com/explore");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("instagram");
    });

    it("rejects accounts/settings page", () => {
      const result = detectPlatform("https://instagram.com/accounts/edit");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("instagram");
    });

    it("rejects Instagram homepage", () => {
      const result = detectPlatform("https://instagram.com/");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("instagram");
    });
  });

  describe("Instagram - accepted patterns", () => {
    it("accepts post URLs with /p/", () => {
      const result = detectPlatform("https://instagram.com/p/ABC123");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("instagram");
      expect(result.error).toBeUndefined();
    });

    it("accepts reel URLs with /reel/", () => {
      const result = detectPlatform("https://instagram.com/reel/ABC123");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("instagram");
    });

    it("accepts reels URLs with /reels/", () => {
      const result = detectPlatform("https://instagram.com/reels/ABC123");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("instagram");
    });

    it("accepts post URLs with username prefix", () => {
      const result = detectPlatform("https://instagram.com/username/p/ABC123");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("instagram");
    });

    it("accepts URLs without www", () => {
      const result = detectPlatform("https://instagram.com/p/ABC123");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("instagram");
    });
  });

  describe("TikTok - rejected patterns", () => {
    it("rejects profile URLs (@ handle only)", () => {
      const result = detectPlatform("https://tiktok.com/@username");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("tiktok");
      expect(result.error).toContain("profile");
    });

    it("rejects profile URLs with trailing slash", () => {
      const result = detectPlatform("https://tiktok.com/@username/");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("tiktok");
    });

    it("rejects For You page", () => {
      const result = detectPlatform("https://tiktok.com/foryou");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("tiktok");
    });

    it("rejects Following page", () => {
      const result = detectPlatform("https://tiktok.com/following");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("tiktok");
    });

    it("rejects TikTok homepage", () => {
      const result = detectPlatform("https://tiktok.com/");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("tiktok");
    });
  });

  describe("TikTok - accepted patterns", () => {
    it("accepts video URLs", () => {
      const result = detectPlatform(
        "https://tiktok.com/@username/video/1234567890",
      );
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("tiktok");
      expect(result.error).toBeUndefined();
    });

    it("accepts short URLs (vm.tiktok.com)", () => {
      const result = detectPlatform("https://vm.tiktok.com/ZMabcdefg");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("tiktok");
    });

    it("accepts short URLs (vt.tiktok.com)", () => {
      const result = detectPlatform("https://vt.tiktok.com/ZSabcdefg");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("tiktok");
    });

    it("accepts share URLs with /t/", () => {
      const result = detectPlatform("https://tiktok.com/t/ZTabcdefg");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("tiktok");
    });

    it("accepts URLs without www", () => {
      const result = detectPlatform("https://tiktok.com/@user/video/123456");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("tiktok");
    });
  });

  describe("unsupported platforms", () => {
    it("rejects Facebook URLs", () => {
      const result = detectPlatform("https://facebook.com/video/123");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("other");
      expect(result.error).toContain("not from a supported platform");
    });

    it("rejects Twitter/X URLs", () => {
      const result = detectPlatform("https://twitter.com/user/status/123");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("other");
    });

    it("rejects arbitrary domains", () => {
      const result = detectPlatform("https://example.com/video");
      expect(result.isValid).toBe(false);
      expect(result.platform).toBe("other");
    });
  });

  describe("edge cases", () => {
    it("handles URLs with query parameters", () => {
      const result = detectPlatform(
        "https://youtube.com/watch?v=abc123&feature=share",
      );
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("youtube");
    });

    it("handles URLs with hash fragments", () => {
      const result = detectPlatform("https://instagram.com/p/ABC123#comments");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("instagram");
    });

    it("is case insensitive", () => {
      const result = detectPlatform("https://YOUTUBE.COM/watch?v=ABC123");
      expect(result.isValid).toBe(true);
      expect(result.platform).toBe("youtube");
    });
  });
});

describe("normalizeUrl", () => {
  it("removes query parameters", () => {
    const result = normalizeUrl(
      "https://youtube.com/watch?v=abc123&feature=share",
    );
    expect(result).toBe("https://youtube.com/watch");
  });

  it("removes hash fragments", () => {
    const result = normalizeUrl("https://instagram.com/p/ABC123#comments");
    expect(result).toBe("https://instagram.com/p/ABC123");
  });

  it("removes trailing slashes", () => {
    const result = normalizeUrl("https://tiktok.com/@user/video/123/");
    expect(result).toBe("https://tiktok.com/@user/video/123");
  });

  it("handles unparseable URLs gracefully", () => {
    const result = normalizeUrl("not-a-url");
    expect(result).toBe("not-a-url");
  });

  it("normalizes complex URLs", () => {
    const result = normalizeUrl(
      "https://instagram.com/p/ABC123?utm_source=share#comment-456",
    );
    expect(result).toBe("https://instagram.com/p/ABC123");
  });
});
