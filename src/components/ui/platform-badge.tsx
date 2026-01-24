import { cn } from "@/lib/utils";

type Platform = "tiktok" | "instagram" | "youtube" | "other";

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
}

const platformConfig: Record<Platform, { label: string; bgClass: string; icon: string }> = {
  tiktok: { label: "TikTok", bgClass: "bg-tiktok", icon: "♪" },
  instagram: { label: "Instagram", bgClass: "bg-instagram", icon: "◎" },
  youtube: { label: "YouTube", bgClass: "bg-youtube", icon: "▶" },
  other: { label: "Other", bgClass: "bg-muted", icon: "○" },
};

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const config = platformConfig[platform] || platformConfig.other;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white",
        config.bgClass,
        className
      )}
    >
      <span className="text-[10px]">{config.icon}</span>
      {config.label}
    </span>
  );
}
