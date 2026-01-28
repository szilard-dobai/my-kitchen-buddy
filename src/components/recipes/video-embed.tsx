"use client";

import { VideoOff } from "lucide-react";
import {
  InstagramEmbed,
  TikTokEmbed,
  YouTubeEmbed,
} from "react-social-media-embed";

interface VideoEmbedProps {
  url: string;
  platform: string;
}

export function VideoEmbed({ url, platform }: VideoEmbedProps) {
  if (platform === "tiktok") {
    return (
      <div className="mb-8 flex justify-center">
        <TikTokEmbed url={url} className="overflow-y-auto! max-h-[600px]" />
      </div>
    );
  }

  if (platform === "youtube") {
    const isShort = url.includes("/shorts/");
    return (
      <div className="mb-8 flex justify-center">
        <YouTubeEmbed
          url={url}
          width={isShort ? 325 : 672}
          height={isShort ? 580 : 378}
          className="overflow-y-auto! max-h-[600px]"
        />
      </div>
    );
  }

  if (platform === "instagram") {
    return (
      <div className="mb-8 flex justify-center">
        <InstagramEmbed
          url={url}
          captioned
          className="overflow-y-auto! max-h-[600px]"
        />
      </div>
    );
  }

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
