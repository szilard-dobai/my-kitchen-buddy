"use client";

import { VideoOff } from "lucide-react";

interface VideoEmbedProps {
  url: string;
  platform: string;
}

function extractTikTokVideoId(url: string): string | null {
  const match = url.match(/video\/(\d+)/);
  return match ? match[1] : null;
}

function extractYouTubeVideoId(url: string): string | null {
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

function extractInstagramPostId(url: string): string | null {
  const match = url.match(/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

export function VideoEmbed({ url, platform }: VideoEmbedProps) {
  let embedUrl: string | null = null;

  if (platform === "tiktok") {
    const videoId = extractTikTokVideoId(url);
    if (videoId) {
      embedUrl = `https://www.tiktok.com/embed/v2/${videoId}`;
    }
  } else if (platform === "youtube") {
    const videoId = extractYouTubeVideoId(url);
    if (videoId) {
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    }
  } else if (platform === "instagram") {
    const postId = extractInstagramPostId(url);
    if (postId) {
      embedUrl = `https://www.instagram.com/p/${postId}/embed`;
    }
  }

  if (!embedUrl) {
    return (
      <div className="aspect-video bg-muted rounded-lg flex flex-col items-center justify-center gap-2 mb-8">
        <VideoOff className="h-12 w-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">
          Video unavailable.{" "}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            View on {platform}
          </a>
        </p>
      </div>
    );
  }

  const isVertical = platform === "tiktok" || platform === "instagram";

  return (
    <div className="mb-8 flex justify-center">
      <iframe
        src={embedUrl}
        className={
          isVertical
            ? "w-[325px] h-[580px] rounded-lg border-0"
            : "w-full max-w-2xl aspect-video rounded-lg border-0"
        }
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
