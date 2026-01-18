interface SupadataTranscriptResponse {
  content?: Array<{
    text: string;
    offset?: number;
    duration?: number;
  }>;
  lang?: string;
  error?: string;
}

interface TranscriptResult {
  transcript: string;
  language?: string;
  error?: string;
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
    // Supadata API endpoint for transcripts
    const apiUrl = new URL("https://api.supadata.ai/v1/transcript");
    apiUrl.searchParams.set("url", url);

    const response = await fetch(apiUrl.toString(), {
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

    // Combine all transcript segments into a single string
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
