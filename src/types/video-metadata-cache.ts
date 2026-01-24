export interface VideoAuthor {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  verified?: boolean;
}

export interface VideoStats {
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

export interface VideoMetadata {
  title?: string;
  description?: string;
  author?: VideoAuthor;
  stats?: VideoStats;
  tags?: string[];
  createdAt?: string;
}

export interface VideoMetadataCache {
  _id?: string;
  normalizedUrl: string;
  platform: "tiktok" | "instagram" | "youtube" | "other";
  metadata: VideoMetadata;
  fetchedAt: Date;
  updatedAt: Date;
}
