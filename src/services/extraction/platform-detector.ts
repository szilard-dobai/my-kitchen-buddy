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

async function fetchInstagramHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    if (!response.ok) return null;

    return await response.text();
  } catch (error) {
    console.warn("Failed to fetch Instagram page:", error);
    return null;
  }
}

export async function getInstagramThumbnail(
  url: string,
): Promise<string | null> {
  const html = await fetchInstagramHtml(url);
  if (!html) return null;

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
}

export async function getInstagramAuthorAvatar(
  url: string,
): Promise<string | null> {
  const html = await fetchInstagramHtml(url);
  if (!html) return null;

  const scriptMatch = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i,
  );

  if (scriptMatch?.[1]) {
    try {
      const jsonLd = JSON.parse(scriptMatch[1]);

      if (jsonLd.author?.image) {
        return jsonLd.author.image;
      }

      if (Array.isArray(jsonLd)) {
        for (const item of jsonLd) {
          if (item.author?.image) {
            return item.author.image;
          }
        }
      }
    } catch {
      // JSON parsing failed, continue to fallback
    }
  }

  const profilePicMatch = html.match(/"profile_pic_url":\s*"([^"]+)"/i);

  if (profilePicMatch?.[1]) {
    return profilePicMatch[1].replace(/\\u0026/g, "&");
  }

  return null;
}

function extractTikTokUsername(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const match = parsedUrl.pathname.match(/^\/@([\w.-]+)/);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function decodeUnicodeEscapes(str: string): string {
  return str.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

export async function getTikTokAuthorAvatar(
  url: string,
): Promise<string | null> {
  const username = extractTikTokUsername(url);
  if (!username) return null;

  try {
    const profileUrl = `https://www.tiktok.com/@${username}`;
    const response = await fetch(profileUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    const avatarMatch = html.match(/"avatarMedium":"([^"]+)"/);
    if (avatarMatch?.[1]) {
      return decodeUnicodeEscapes(avatarMatch[1]);
    }

    const avatarThumbMatch = html.match(/"avatarThumb":"([^"]+)"/);
    if (avatarThumbMatch?.[1]) {
      return decodeUnicodeEscapes(avatarThumbMatch[1]);
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch TikTok author avatar:", error);
    return null;
  }
}

export async function getYouTubeAuthorAvatar(
  url: string,
): Promise<string | null> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return null;

  try {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const response = await fetch(videoUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) return null;

    const html = await response.text();

    const channelAvatarMatch = html.match(
      /"channelThumbnail":\s*\{\s*"thumbnails":\s*\[\s*\{\s*"url":\s*"([^"]+)"/,
    );
    if (channelAvatarMatch?.[1]) {
      return channelAvatarMatch[1].replace(/\\u0026/g, "&");
    }

    const ownerAvatarMatch = html.match(
      /"ownerProfileUrl"[\s\S]*?"thumbnail":\s*\{\s*"thumbnails":\s*\[\s*\{\s*"url":\s*"([^"]+)"/,
    );
    if (ownerAvatarMatch?.[1]) {
      return ownerAvatarMatch[1].replace(/\\u0026/g, "&");
    }

    const authorImageMatch = html.match(
      /<link[^>]*itemprop=["']thumbnailUrl["'][^>]*href=["']([^"']+)["']/i,
    );
    if (authorImageMatch?.[1]) {
      return authorImageMatch[1];
    }

    return null;
  } catch (error) {
    console.warn("Failed to fetch YouTube author avatar:", error);
    return null;
  }
}
