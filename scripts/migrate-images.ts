/* eslint-disable no-console, import/order */
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(__dirname, "../.env");
const envFile = readFileSync(envPath, "utf-8");
envFile.split("\n").forEach((line) => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

import { put } from "@vercel/blob";
import getDb from "../src/lib/db";

const BLOB_DOMAINS = [
  "public.blob.vercel-storage.com",
  "blob.vercel-storage.com",
];

function isExternalUrl(url: string | undefined): boolean {
  if (!url) return false;
  return !BLOB_DOMAINS.some((domain) => url.includes(domain));
}

function getExtensionFromContentType(contentType: string | null): string {
  if (!contentType) return "jpg";

  const typeMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return typeMap[contentType] || "jpg";
}

async function uploadImageToBlob(
  sourceUrl: string,
  type: "thumbnail" | "avatar",
  identifier: string,
): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; MyKitchenBuddy/1.0; +https://mykitchenbuddy.com)",
      },
    });

    if (!response.ok) {
      console.warn(
        `  Failed to fetch image from ${sourceUrl}: ${response.status}`,
      );
      return null;
    }

    const contentType = response.headers.get("content-type");
    const extension = getExtensionFromContentType(contentType);
    const safeIdentifier = identifier.replace(/[^a-zA-Z0-9-_]/g, "-");
    const pathname = `images/${type}/${safeIdentifier}.${extension}`;

    const imageBuffer = await response.arrayBuffer();

    const blob = await put(pathname, imageBuffer, {
      access: "public",
      contentType: contentType || "image/jpeg",
    });

    return blob.url;
  } catch (error) {
    console.warn(`  Failed to upload image:`, error);
    return null;
  }
}

async function migrateImages() {
  console.log("Starting image migration to Vercel Blob...\n");

  const db = await getDb();
  const recipesCollection = db.collection("recipes");
  const authorsCollection = db.collection("authors");
  const metadataCacheCollection = db.collection("videoMetadataCaches");

  const recipesWithExternalImages = await recipesCollection
    .find({
      $or: [
        { "source.thumbnailUrl": { $exists: true, $ne: null } },
        { "source.authorAvatarUrl": { $exists: true, $ne: null } },
      ],
    })
    .toArray();

  console.log(`Found ${recipesWithExternalImages.length} recipes to check\n`);

  let updatedRecipes = 0;
  let updatedThumbnails = 0;
  let updatedAvatars = 0;
  let failedThumbnails = 0;
  let failedAvatars = 0;

  for (const recipe of recipesWithExternalImages) {
    const updates: Record<string, string> = {};
    let needsUpdate = false;

    if (isExternalUrl(recipe.source?.thumbnailUrl)) {
      console.log(`Processing recipe: ${recipe.title}`);
      console.log(`  Thumbnail: ${recipe.source.thumbnailUrl}`);

      const identifier = recipe.source.url
        ? recipe.source.url.replace(/[^a-zA-Z0-9]/g, "-")
        : recipe._id.toString();

      const blobUrl = await uploadImageToBlob(
        recipe.source.thumbnailUrl,
        "thumbnail",
        identifier,
      );

      if (blobUrl) {
        updates["source.thumbnailUrl"] = blobUrl;
        needsUpdate = true;
        updatedThumbnails++;
        console.log(`  Uploaded thumbnail to: ${blobUrl}`);
      } else {
        failedThumbnails++;
      }
    }

    if (isExternalUrl(recipe.source?.authorAvatarUrl)) {
      console.log(`  Avatar: ${recipe.source.authorAvatarUrl}`);

      const identifier = `${recipe.source.platform}-${recipe.source.authorUsername}`;

      const blobUrl = await uploadImageToBlob(
        recipe.source.authorAvatarUrl,
        "avatar",
        identifier,
      );

      if (blobUrl) {
        updates["source.authorAvatarUrl"] = blobUrl;
        needsUpdate = true;
        updatedAvatars++;
        console.log(`  Uploaded avatar to: ${blobUrl}`);
      } else {
        failedAvatars++;
      }
    }

    if (needsUpdate) {
      await recipesCollection.updateOne(
        { _id: recipe._id },
        { $set: updates },
      );
      updatedRecipes++;
      console.log(`  Updated recipe in database\n`);
    }
  }

  console.log("\n--- Migrating Authors Collection ---\n");

  const authorsWithExternalImages = await authorsCollection
    .find({
      avatarUrl: { $exists: true, $ne: null },
    })
    .toArray();

  console.log(`Found ${authorsWithExternalImages.length} authors to check\n`);

  let updatedAuthors = 0;

  for (const author of authorsWithExternalImages) {
    if (isExternalUrl(author.avatarUrl)) {
      console.log(`Processing author: @${author.username} (${author.platform})`);
      console.log(`  Avatar: ${author.avatarUrl}`);

      const identifier = `${author.platform}-${author.username}`;

      const blobUrl = await uploadImageToBlob(
        author.avatarUrl,
        "avatar",
        identifier,
      );

      if (blobUrl) {
        await authorsCollection.updateOne(
          { _id: author._id },
          { $set: { avatarUrl: blobUrl } },
        );
        updatedAuthors++;
        console.log(`  Uploaded and updated: ${blobUrl}\n`);
      } else {
        console.log(`  Failed to upload avatar\n`);
      }
    }
  }

  console.log("\n--- Migrating Video Metadata Cache ---\n");

  const metadataWithExternalImages = await metadataCacheCollection
    .find({
      $or: [
        { "metadata.media.thumbnailUrl": { $exists: true, $ne: null } },
        { "metadata.author.avatarUrl": { $exists: true, $ne: null } },
      ],
    })
    .toArray();

  console.log(
    `Found ${metadataWithExternalImages.length} metadata caches to check\n`,
  );

  let updatedMetadata = 0;

  for (const metadata of metadataWithExternalImages) {
    const updates: Record<string, string> = {};
    let needsUpdate = false;

    if (isExternalUrl(metadata.metadata?.media?.thumbnailUrl)) {
      console.log(`Processing metadata: ${metadata.normalizedUrl}`);

      const identifier = metadata.normalizedUrl.replace(/[^a-zA-Z0-9]/g, "-");

      const blobUrl = await uploadImageToBlob(
        metadata.metadata.media.thumbnailUrl,
        "thumbnail",
        identifier,
      );

      if (blobUrl) {
        updates["metadata.media.thumbnailUrl"] = blobUrl;
        needsUpdate = true;
        console.log(`  Uploaded thumbnail: ${blobUrl}`);
      }
    }

    if (isExternalUrl(metadata.metadata?.author?.avatarUrl)) {
      const identifier = `${metadata.platform}-${metadata.metadata.author.username}`;

      const blobUrl = await uploadImageToBlob(
        metadata.metadata.author.avatarUrl,
        "avatar",
        identifier,
      );

      if (blobUrl) {
        updates["metadata.author.avatarUrl"] = blobUrl;
        needsUpdate = true;
        console.log(`  Uploaded avatar: ${blobUrl}`);
      }
    }

    if (needsUpdate) {
      await metadataCacheCollection.updateOne(
        { _id: metadata._id },
        { $set: updates },
      );
      updatedMetadata++;
      console.log(`  Updated metadata cache\n`);
    }
  }

  console.log("\n=== Migration Summary ===");
  console.log(`Recipes updated: ${updatedRecipes}`);
  console.log(`  Thumbnails migrated: ${updatedThumbnails}`);
  console.log(`  Thumbnails failed: ${failedThumbnails}`);
  console.log(`  Avatars migrated: ${updatedAvatars}`);
  console.log(`  Avatars failed: ${failedAvatars}`);
  console.log(`Authors updated: ${updatedAuthors}`);
  console.log(`Metadata caches updated: ${updatedMetadata}`);

  process.exit(0);
}

migrateImages().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
