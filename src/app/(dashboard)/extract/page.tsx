"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExtractionStatus {
  id: string;
  status: string;
  progress: number;
  statusMessage?: string;
  recipeId?: string;
  error?: string;
}

export default function ExtractPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] = useState<ExtractionStatus | null>(null);

  const pollStatus = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/extract/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch status");
      }

      const status: ExtractionStatus = await response.json();
      setExtractionStatus(status);

      if (status.status === "completed" && status.recipeId) {
        router.push(`/recipes/${status.recipeId}`);
        return true; // Stop polling
      }

      if (status.status === "failed") {
        setError(status.error || "Extraction failed");
        setLoading(false);
        return true; // Stop polling
      }

      return false; // Continue polling
    } catch (err) {
      console.error("Polling error:", err);
      return false;
    }
  }, [router]);

  useEffect(() => {
    if (!jobId) return;

    let mounted = true;

    const poll = async () => {
      if (!mounted) return;
      await pollStatus(jobId);
    };

    poll();
    const intervalId = setInterval(poll, 2000);

    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [jobId, pollStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setExtractionStatus(null);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start extraction");
      }

      if (data.existingRecipeId) {
        router.push(`/recipes/${data.existingRecipeId}/edit`);
        return;
      }

      setJobId(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return "bg-blue-500";
    if (progress < 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Extract Recipe</h1>

      <Card>
        <CardHeader>
          <CardTitle>Paste a video URL</CardTitle>
          <CardDescription>
            We&apos;ll extract the recipe from TikTok, Instagram Reels, or YouTube videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            {extractionStatus && extractionStatus.status !== "failed" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {extractionStatus.statusMessage || "Processing..."}
                  </span>
                  <span className="font-medium">{extractionStatus.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(
                      extractionStatus.progress
                    )}`}
                    style={{ width: `${extractionStatus.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="url">Video URL</Label>
              <Input
                id="url"
                type="url"
                placeholder="https://www.tiktok.com/@user/video/..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Extracting...
                </span>
              ) : (
                "Extract Recipe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8 text-sm text-gray-500">
        <p className="font-medium mb-2">Supported platforms:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>TikTok videos</li>
          <li>Instagram Reels</li>
          <li>YouTube videos & Shorts</li>
        </ul>
        <p className="mt-4 text-xs">
          Note: The video must contain spoken recipe instructions. Image-only posts are not supported yet.
        </p>
      </div>
    </div>
  );
}
