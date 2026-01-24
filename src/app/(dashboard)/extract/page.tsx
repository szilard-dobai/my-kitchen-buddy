"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ExtractionProgress } from "@/components/recipes/extraction-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlatformBadge } from "@/components/ui/platform-badge";
import type { TargetLanguage } from "@/types/extraction-job";

interface ExtractionStatus {
  id: string;
  status: string;
  progress: number;
  statusMessage?: string;
  recipeId?: string;
  error?: string;
}

const extractionSteps = [
  { id: "fetching", label: "Fetching video data" },
  { id: "analyzing", label: "Analyzing recipe with AI" },
  { id: "saving", label: "Saving your recipe" },
];

function getStepStatus(
  currentStatus: string,
  stepId: string
): "pending" | "active" | "completed" {
  const statusMap: Record<string, number> = {
    pending: 0,
    fetching_transcript: 1,
    analyzing: 2,
    completed: 3,
  };

  const stepOrder: Record<string, number> = {
    fetching: 1,
    analyzing: 2,
    saving: 3,
  };

  const currentOrder = statusMap[currentStatus] || 0;
  const stepOrderValue = stepOrder[stepId] || 0;

  if (currentOrder > stepOrderValue) return "completed";
  if (currentOrder === stepOrderValue) return "active";
  return "pending";
}

export default function ExtractPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("original");
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
        return true;
      }

      if (status.status === "failed") {
        setError(status.error || "Extraction failed");
        setLoading(false);
        return true;
      }

      return false;
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
        body: JSON.stringify({ url, targetLanguage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to start extraction");
      }

      if (data.existingRecipeId) {
        router.push(`/recipes/${data.existingRecipeId}`);
        return;
      }

      setJobId(data.jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  const steps = extractionSteps.map((step) => ({
    ...step,
    status: extractionStatus
      ? getStepStatus(extractionStatus.status, step.id)
      : ("pending" as const),
  }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Extract Recipe</h1>

      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Paste a video URL</CardTitle>
          <CardDescription>
            We&apos;ll extract the recipe from TikTok, Instagram Reels, or YouTube videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {extractionStatus && extractionStatus.status !== "failed" && (
              <ExtractionProgress
                progress={extractionStatus.progress}
                currentStep={extractionStatus.statusMessage || "Processing..."}
                steps={steps}
              />
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

            <div className="space-y-2">
              <Label htmlFor="language">Output Language</Label>
              <select
                id="language"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value as TargetLanguage)}
                disabled={loading}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="original">Original (keep source language)</option>
                <option value="en">English (translate to English)</option>
              </select>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </span>
              ) : (
                "Extract Recipe"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-8">
        <p className="font-medium mb-4 text-sm text-muted-foreground">Supported platforms:</p>
        <div className="flex flex-wrap gap-2">
          <PlatformBadge platform="tiktok" />
          <PlatformBadge platform="instagram" />
          <PlatformBadge platform="youtube" />
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Note: The video must contain spoken recipe instructions. Image-only posts are not supported yet.
        </p>
      </div>
    </div>
  );
}
