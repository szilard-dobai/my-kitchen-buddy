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

export interface VideoMedia {
  type: "video" | "image" | "carousel" | "post";
  duration?: number;
  thumbnailUrl?: string;
  url?: string;
}

export interface VideoMetadata {
  title?: string;
  description?: string;
  author?: VideoAuthor;
  stats?: VideoStats;
  media?: VideoMedia;
  tags?: string[];
  createdAt?: string;
}

export interface VideoMetadataCache {
  _id?: string;
  normalizedUrl: string;
  platform: "tiktok" | "instagram" | "youtube" | "other";
  metadata: VideoMetadata;
  authorId?: string;
  fetchedAt: Date;
  updatedAt: Date;
}
