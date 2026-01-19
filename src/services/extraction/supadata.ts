interface SupadataTranscriptResponse {
  content?: Array<{
    text: string;
    offset?: number;
    duration?: number;
  }>;
  lang?: string;
  error?: string;
}

interface SupadataMetadataResponse {
  platform?: string;
  type?: string;
  id?: string;
  url?: string;
  title?: string | null;
  description?: string | null;
  author?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    verified?: boolean;
  };
  stats?: {
    views?: number | null;
    likes?: number | null;
    comments?: number | null;
    shares?: number | null;
  };
  tags?: string[];
  createdAt?: string;
  error?: string;
}

interface TranscriptResult {
  transcript: string;
  language?: string;
  error?: string;
}

interface MetadataResult {
  title?: string;
  description?: string;
  authorUsername?: string;
  tags?: string[];
  error?: string;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelay = 60000
): Promise<Response> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const response = await fetch(url, options);

    if (response.status === 429 && attempt < maxRetries - 1) {
      const delay = baseDelay * (attempt + 1);
      console.warn(`Rate limited, waiting ${delay / 1000}s before retry ${attempt + 1}...`);
      await sleep(delay);
      continue;
    }

    return response;
  }

  throw new Error("Max retries exceeded");
}

export async function getTranscript(url: string): Promise<TranscriptResult> {
  const apiKey = process.env.SUPADATA_API_KEY;

  if (!apiKey) {
    return {
      transcript: "",
      error: "Supadata API key not configured",
    };
  }

  try {
    const apiUrl = new URL("https://api.supadata.ai/v1/transcript");
    apiUrl.searchParams.set("url", url);

    const response = await fetchWithRetry(apiUrl.toString(), {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supadata API error:", response.status, errorText);

      if (response.status === 404) {
        return {
          transcript: "",
          error: "Could not find transcript for this video. The video may not have captions or may not be accessible.",
        };
      }

      if (response.status === 402) {
        return {
          transcript: "",
          error: "Supadata API credits exhausted. Please try again later.",
        };
      }

      if (response.status === 429) {
        return {
          transcript: "",
          error: "Rate limit exceeded. Please wait a minute and try again.",
        };
      }

      return {
        transcript: "",
        error: `Failed to fetch transcript: ${response.status}`,
      };
    }

    const data: SupadataTranscriptResponse = await response.json();

    if (data.error) {
      return {
        transcript: "",
        error: data.error,
      };
    }

    if (!data.content || data.content.length === 0) {
      return {
        transcript: "",
        error: "No transcript content found for this video",
      };
    }

    const transcript = data.content.map((segment) => segment.text).join(" ");

    return {
      transcript: transcript.trim(),
      language: data.lang,
    };
  } catch (error) {
    console.error("Error fetching transcript:", error);
    return {
      transcript: "",
      error: error instanceof Error ? error.message : "Failed to fetch transcript",
    };
  }
}

export async function getMetadata(url: string): Promise<MetadataResult> {
  const apiKey = process.env.SUPADATA_API_KEY;

  if (!apiKey) {
    return {
      error: "Supadata API key not configured",
    };
  }

  try {
    const apiUrl = new URL("https://api.supadata.ai/v1/metadata");
    apiUrl.searchParams.set("url", url);

    const response = await fetchWithRetry(apiUrl.toString(), {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Supadata metadata API error:", response.status, errorText);

      if (response.status === 402) {
        return {
          error: "Supadata API credits exhausted. Please try again later.",
        };
      }

      if (response.status === 429) {
        return {
          error: "Rate limit exceeded. Please wait a minute and try again.",
        };
      }

      return {
        error: `Failed to fetch metadata: ${response.status}`,
      };
    }

    const data: SupadataMetadataResponse = await response.json();

    if (data.error) {
      return {
        error: data.error,
      };
    }

    return {
      title: data.title || undefined,
      description: data.description || undefined,
      authorUsername: data.author?.username,
      tags: data.tags,
    };
  } catch (error) {
    console.error("Error fetching metadata:", error);
    return {
      error: error instanceof Error ? error.message : "Failed to fetch metadata",
    };
  }
}
