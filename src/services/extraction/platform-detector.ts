type Platform = "tiktok" | "instagram" | "youtube" | "other";

interface PlatformDetectionResult {
  platform: Platform;
  isValid: boolean;
  error?: string;
}

const PLATFORM_PATTERNS: Record<Platform, RegExp[]> = {
  tiktok: [
    /(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
    /(?:vm|vt)\.tiktok\.com\/\w+/i,
    /(?:www\.)?tiktok\.com\/t\/\w+/i,
  ],
  instagram: [
    /(?:www\.)?instagram\.com\/(?:p|reel|reels)\/[\w-]+/i,
    /(?:www\.)?instagram\.com\/[\w.-]+\/(?:p|reel|reels)\/[\w-]+/i,
  ],
  youtube: [
    /(?:www\.)?youtube\.com\/watch\?v=[\w-]+/i,
    /(?:www\.)?youtube\.com\/shorts\/[\w-]+/i,
    /youtu\.be\/[\w-]+/i,
    /(?:www\.)?youtube\.com\/embed\/[\w-]+/i,
  ],
  other: [],
};

export function detectPlatform(url: string): PlatformDetectionResult {
  // Validate URL format
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return {
      platform: "other",
      isValid: false,
      error: "Invalid URL format",
    };
  }

  // Check each platform
  for (const [platform, patterns] of Object.entries(PLATFORM_PATTERNS)) {
    if (platform === "other") continue;

    for (const pattern of patterns) {
      if (pattern.test(url)) {
        return {
          platform: platform as Platform,
          isValid: true,
        };
      }
    }
  }

  // Check if it's at least a valid video URL from a known domain
  const hostname = parsedUrl.hostname.toLowerCase();

  if (hostname.includes("tiktok.com")) {
    return {
      platform: "tiktok",
      isValid: true,
    };
  }

  if (hostname.includes("instagram.com")) {
    return {
      platform: "instagram",
      isValid: true,
    };
  }

  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return {
      platform: "youtube",
      isValid: true,
    };
  }

  return {
    platform: "other",
    isValid: false,
    error: "URL is not from a supported platform (TikTok, Instagram, or YouTube)",
  };
}

export function normalizeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    parsedUrl.search = "";
    parsedUrl.hash = "";
    return parsedUrl.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}
