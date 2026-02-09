"use client";

import { Globe, Link2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ExtractionProgress } from "@/components/recipes/extraction-progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InstagramIcon,
  TikTokIcon,
  YouTubeIcon,
} from "@/components/ui/platform-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackEvent } from "@/lib/tracking";
import type { TargetLanguage } from "@/types/extraction-job";
import type { UsageInfo } from "@/types/subscription";

interface ExtractionStatus {
  id: string;
  status: string;
  progress: number;
  statusMessage?: string;
  recipeId?: string;
  error?: string;
}

interface LimitError {
  used: number;
  limit: number;
  planTier: "free" | "pro";
}

const extractionSteps = [
  { id: "fetching", label: "Fetching video data" },
  { id: "analyzing", label: "Analyzing recipe with AI" },
  { id: "saving", label: "Saving your recipe" },
];

function getStepStatus(
  currentStatus: string,
  stepId: string,
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
  const [targetLanguage, setTargetLanguage] =
    useState<TargetLanguage>("original");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [extractionStatus, setExtractionStatus] =
    useState<ExtractionStatus | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [limitError, setLimitError] = useState<LimitError | null>(null);
  const hasTrackedViewRef = useRef(false);

  useEffect(() => {
    if (!hasTrackedViewRef.current) {
      trackEvent("extract_view");
      hasTrackedViewRef.current = true;
    }
  }, []);

  const hasTrackedSuccessRef = useRef(false);
  const hasTrackedErrorRef = useRef(false);

  const pollStatus = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/extract/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch status");
        }

        const status: ExtractionStatus = await response.json();
        setExtractionStatus(status);

        if (status.status === "completed" && status.recipeId) {
          if (!hasTrackedSuccessRef.current) {
            trackEvent("extraction_success", { recipeId: status.recipeId });
            hasTrackedSuccessRef.current = true;
          }
          router.push(`/recipes/${status.recipeId}`);
          return true;
        }

        if (status.status === "failed") {
          if (!hasTrackedErrorRef.current) {
            const errorMsg = status.error || "Extraction failed";
            const isContentError =
              errorMsg.includes("non-recipe") ||
              errorMsg.includes("not contain recipe") ||
              errorMsg.includes("no recipe");
            trackEvent("extraction_error", {
              error: errorMsg,
              validationLayer: isContentError ? "content_analysis" : "unknown",
            });
            hasTrackedErrorRef.current = true;
          }
          setError(status.error || "Extraction failed");
          setLoading(false);
          return true;
        }

        return false;
      } catch (err) {
        console.error("Polling error:", err);
        return false;
      }
    },
    [router],
  );

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

  useEffect(() => {
    fetch("/api/billing/usage")
      .then((res) => res.json())
      .then((data) => setUsage(data))
      .catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLimitError(null);
    setLoading(true);
    setJobId(null);
    setExtractionStatus(null);
    hasTrackedSuccessRef.current = false;
    hasTrackedErrorRef.current = false;

    trackEvent("extraction_attempt", { url });

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, targetLanguage }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429 && data.used !== undefined) {
          setLimitError({
            used: data.used,
            limit: data.limit,
            planTier: data.planTier,
          });
          setLoading(false);
          return;
        }
        throw new Error(data.error || "Failed to start extraction");
      }

      if (data.existingRecipeId) {
        router.push(`/recipes/${data.existingRecipeId}`);
        return;
      }

      setJobId(data.jobId);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      const validationLayer =
        err instanceof Error && err.message.includes("profile")
          ? "schema"
          : "unknown";
      trackEvent("extraction_error", {
        error: errorMessage,
        validationLayer,
      });
      setError(errorMessage);
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
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Extract Recipe from Video</h1>
        <p className="text-muted-foreground">
          Paste a cooking video URL and let AI do the magic
        </p>
        {usage && (
          <div className="text-sm text-muted-foreground mt-4">
            {usage.used} / {usage.limit} extractions used this month
            {usage.used >= usage.limit && (
              <span className="text-red-500 ml-2">
                Limit reached.{" "}
                <a href="/settings?tab=billing" className="underline">
                  Upgrade to Pro
                </a>
              </span>
            )}
          </div>
        )}
      </div>

      <Card className="card-shadow">
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            {limitError && (
              <div className="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950">
                <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-2">
                  Monthly extraction limit reached
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
                  You&apos;ve used all {limitError.limit} extractions included
                  in your {limitError.planTier === "free" ? "Free" : "Pro"} plan
                  this month.
                  {limitError.planTier === "free"
                    ? " Upgrade to Pro for more extractions per month."
                    : " Your limit will reset at the start of your next billing cycle."}
                </p>
                {limitError.planTier === "free" && (
                  <Button asChild variant="default" size="sm">
                    <a href="/settings?tab=billing">Upgrade to Pro</a>
                  </Button>
                )}
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
              <div className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="url"
                  type="url"
                  placeholder="https://www.tiktok.com/@chef/video/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={loading}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={targetLanguage}
                onValueChange={(value) =>
                  setTargetLanguage(value as TargetLanguage)
                }
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="original">Keep Original</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={
                loading || !url || (usage !== null && usage.used >= usage.limit)
              }
              className="w-full h-12 text-base"
            >
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

      <Card className="mt-6 card-shadow">
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs text-muted-foreground">i</span>
            </div>
            <span className="font-medium">Supported Platforms</span>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <div className="h-10 w-10 rounded-full bg-tiktok flex items-center justify-center">
                <TikTokIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium">TikTok</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <div className="h-10 w-10 rounded-full bg-instagram flex items-center justify-center">
                <InstagramIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium text-sm">Instagram Reels</span>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
              <div className="h-10 w-10 rounded-full bg-youtube flex items-center justify-center">
                <YouTubeIcon className="h-5 w-5 text-white" />
              </div>
              <span className="font-medium text-sm">YouTube Shorts</span>
            </div>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Note: Videos must contain spoken recipe instructions. Image-only
            posts or videos without narration cannot be extracted.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
