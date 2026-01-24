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

async function addAuthorsIndex() {
  try {
    const db = await getDb();
    const collection = db.collection("authors");

    console.log("Creating compound unique index on authors collection...");

    await collection.createIndex(
      { platform: 1, username: 1 },
      { unique: true, name: "platform_username_unique_idx" }
    );

    console.log("Index created successfully!");

    const indexes = await collection.indexes();
    console.log("\nAll indexes on authors collection:");
    console.log(JSON.stringify(indexes, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error creating index:", error);
    process.exit(1);
  }
}

addAuthorsIndex();
