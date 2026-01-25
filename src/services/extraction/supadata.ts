import { Supadata, SupadataError } from "@supadata/js";

interface TranscriptResult {
  transcript: string;
  language?: string;
  error?: string;
}

interface MetadataResult {
  title?: string;
  description?: string;
  author?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  media?: {
    type: "video" | "image" | "carousel" | "post";
    duration?: number;
    thumbnailUrl?: string;
    url?: string;
  };
  tags?: string[];
  error?: string;
}

function getSupadataClient(): Supadata | null {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) return null;
  return new Supadata({ apiKey });
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 60000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimited =
        error instanceof SupadataError && error.error === "limit-exceeded";
      if (isRateLimited && attempt < maxRetries - 1) {
        const delay = baseDelay * (attempt + 1);
        console.warn(
          `Rate limited, waiting ${delay / 1000}s before retry ${attempt + 1}...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error("Max retries exceeded");
}

export async function getTranscript(url: string): Promise<TranscriptResult> {
  const client = getSupadataClient();
  if (!client) {
    return { transcript: "", error: "Supadata API key not configured" };
  }

  try {
    const result = await withRetry(() => client.transcript({ url, text: true }));

    if ("jobId" in result) {
      return { transcript: "", error: "Transcript generation in progress" };
    }

    const transcript =
      typeof result.content === "string"
        ? result.content
        : result.content.map((chunk) => chunk.text).join(" ");

    return {
      transcript: transcript.trim(),
      language: result.lang,
    };
  } catch (error) {
    if (error instanceof SupadataError) {
      if (error.error === "not-found" || error.error === "transcript-unavailable") {
        return {
          transcript: "",
          error:
            "Could not find transcript for this video. The video may not have captions or may not be accessible.",
        };
      }
      if (error.error === "upgrade-required") {
        return {
          transcript: "",
          error: "Supadata API credits exhausted. Please try again later.",
        };
      }
      if (error.error === "limit-exceeded") {
        return {
          transcript: "",
          error: "Rate limit exceeded. Please wait a minute and try again.",
        };
      }
      return { transcript: "", error: error.message };
    }
    console.error("Error fetching transcript:", error);
    return {
      transcript: "",
      error:
        error instanceof Error ? error.message : "Failed to fetch transcript",
    };
  }
}

export async function getMetadata(url: string): Promise<MetadataResult> {
  const client = getSupadataClient();
  if (!client) {
    return { error: "Supadata API key not configured" };
  }

  try {
    const data = await withRetry(() => client.metadata({ url }));

    let mediaResult: MetadataResult["media"] | undefined;
    if (data.media) {
      if (data.media.type === "video") {
        mediaResult = {
          type: "video",
          duration: data.media.duration,
          thumbnailUrl: data.media.thumbnailUrl,
          url: data.media.url,
        };
      } else if (data.media.type === "image") {
        mediaResult = {
          type: "image",
          url: data.media.url,
        };
      } else if (data.media.type === "carousel") {
        mediaResult = {
          type: "carousel",
        };
      } else if (data.media.type === "post") {
        mediaResult = {
          type: "post",
        };
      }
    }

    return {
      title: data.title || undefined,
      description: data.description || undefined,
      author: data.author
        ? {
            username: data.author.username,
            displayName: data.author.displayName,
            avatarUrl: data.author.avatarUrl,
            verified: data.author.verified,
          }
        : undefined,
      media: mediaResult,
      tags: data.tags,
    };
  } catch (error) {
    if (error instanceof SupadataError) {
      if (error.error === "upgrade-required") {
        return {
          error: "Supadata API credits exhausted. Please try again later.",
        };
      }
      if (error.error === "limit-exceeded") {
        return {
          error: "Rate limit exceeded. Please wait a minute and try again.",
        };
      }
      return { error: error.message };
    }
    console.error("Error fetching metadata:", error);
    return {
      error:
        error instanceof Error ? error.message : "Failed to fetch metadata",
    };
  }
}
