import { put } from "@vercel/blob";

type ImageType = "thumbnail" | "avatar";

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

export async function uploadImageToBlob(
  sourceUrl: string,
  type: ImageType,
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
        `Failed to fetch image from ${sourceUrl}: ${response.status}`,
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
    console.warn(`Failed to upload image to blob storage:`, error);
    return null;
  }
}
