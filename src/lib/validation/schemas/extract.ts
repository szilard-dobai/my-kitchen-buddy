import { z } from "zod";

export const extractBodySchema = z.object({
  url: z.string().min(1, "URL is required").url("Invalid URL format"),
  targetLanguage: z.enum(["original", "en"]).default("original"),
});

export const extractQuerySchema = z.object({
  jobId: z.string().min(1, "jobId is required"),
});

export type ExtractBody = z.infer<typeof extractBodySchema>;
export type ExtractQuery = z.infer<typeof extractQuerySchema>;
