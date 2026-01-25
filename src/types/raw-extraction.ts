import type { DetectedLanguageCode } from "./detected-language";
import type { TargetLanguage } from "./extraction-job";
import type { CreateRecipeInput } from "./recipe";

export interface RawExtraction {
  _id?: string;
  normalizedUrl: string;
  targetLanguage: TargetLanguage;
  detectedLanguage: DetectedLanguageCode;
  recipe: Partial<CreateRecipeInput>;
  confidence: number;
  createdAt: Date;
}
