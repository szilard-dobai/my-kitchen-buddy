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

import getDb from "../src/lib/db";

async function addVideoMetadataCacheIndex() {
  try {
    const db = await getDb();
    const collection = db.collection("video_metadata_cache");

    console.log("Creating index on video_metadata_cache collection...");

    await collection.createIndex(
      { normalizedUrl: 1 },
      { unique: true, name: "normalizedUrl_unique_idx" }
    );

    console.log("Index created successfully!");

    const indexes = await collection.indexes();
    console.log("\nAll indexes on video_metadata_cache collection:");
    console.log(JSON.stringify(indexes, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error creating index:", error);
    process.exit(1);
  }
}

addVideoMetadataCacheIndex();
