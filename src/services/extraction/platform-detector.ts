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
    error:
      "URL is not from a supported platform (TikTok, Instagram, or YouTube)",
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

function isShortUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();
    return (
      hostname === "vm.tiktok.com" ||
      hostname === "vt.tiktok.com" ||
      hostname.includes("tiktok.com/t/") ||
      parsedUrl.pathname.startsWith("/t/") ||
      hostname === "youtu.be"
    );
  } catch {
    return false;
  }
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname.toLowerCase();

    if (hostname === "youtu.be") {
      return parsedUrl.pathname.slice(1).split("/")[0] || null;
    }

    if (hostname.includes("youtube.com")) {
      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/")[2] || null;
      }
      if (parsedUrl.pathname.startsWith("/embed/")) {
        return parsedUrl.pathname.split("/")[2] || null;
      }
      return parsedUrl.searchParams.get("v");
    }

    return null;
  } catch {
    return null;
  }
}

export function getYouTubeStableThumbnail(url: string): string | null {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export async function resolveUrl(url: string): Promise<string> {
  const normalizedInput = normalizeUrl(url);

  if (!isShortUrl(url)) {
    return normalizedInput;
  }

  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });

    const finalUrl = response.url;
    return normalizeUrl(finalUrl);
  } catch (error) {
    console.warn("Failed to resolve URL, using original:", error);
    return normalizedInput;
  }
}

export async function getInstagramThumbnail(
  url: string,
): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();
    const ogImageMatch = html.match(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i,
    );

    if (ogImageMatch?.[1]) {
      return ogImageMatch[1];
    }

    const reverseMatch = html.match(
      /<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i,
    );

    return reverseMatch?.[1] || null;
  } catch (error) {
    console.warn("Failed to fetch Instagram thumbnail:", error);
    return null;
  }
}
