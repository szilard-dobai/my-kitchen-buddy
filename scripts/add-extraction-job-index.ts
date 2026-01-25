/* eslint-disable no-console */
import { readFileSync } from "fs";
import { resolve } from "path";
import getDb from "../src/lib/db";

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

async function addExtractionJobIndex() {
  try {
    const db = await getDb();
    const collection = db.collection("extractionJobs");

    console.log("Creating index on extractionJobs collection...");

    await collection.createIndex(
      { normalizedUrl: 1, status: 1 },
      { name: "normalizedUrl_status_idx" },
    );

    console.log("Index created successfully!");

    const indexes = await collection.indexes();
    console.log("\nAll indexes on extractionJobs collection:");
    console.log(JSON.stringify(indexes, null, 2));

    process.exit(0);
  } catch (error) {
    console.error("Error creating index:", error);
    process.exit(1);
  }
}

addExtractionJobIndex();
