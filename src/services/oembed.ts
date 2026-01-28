import { detectPlatform } from "./extraction/platform-detector";

interface OEmbedResult {
  thumbnailUrl?: string;
  html?: string;
  authorName?: string;
  authorUrl?: string;
}

const OEMBED_ENDPOINTS: Record<string, string> = {
  tiktok: "https://www.tiktok.com/oembed",
  youtube: "https://www.youtube.com/oembed",
  instagram: "https://graph.facebook.com/v18.0/instagram_oembed",
};

interface OEmbedResponse {
  thumbnail_url?: string;
  html?: string;
  author_name?: string;
  author_url?: string;
}

export async function getOEmbed(url: string): Promise<OEmbedResult> {
  const { platform } = detectPlatform(url);

  if (platform === "other") {
    return {};
  }

  const endpoint = OEMBED_ENDPOINTS[platform];
  if (!endpoint) {
    return {};
  }

  try {
    const oembedUrl = new URL(endpoint);
    oembedUrl.searchParams.set("url", url);
    oembedUrl.searchParams.set("format", "json");

    if (platform === "instagram") {
      const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
      if (!accessToken) {
        return {};
      }
      oembedUrl.searchParams.set("access_token", accessToken);
    }

    const response = await fetch(oembedUrl.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return {};
    }

    const data: OEmbedResponse = await response.json();

    return {
      thumbnailUrl: data.thumbnail_url,
      html: data.html,
      authorName: data.author_name,
      authorUrl: data.author_url,
    };
  } catch {
    return {};
  }
}
