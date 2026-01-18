import type { CreateRecipeInput } from "./recipe";

export interface RawExtraction {
  _id?: string;
  normalizedUrl: string;
  recipe: Partial<CreateRecipeInput>;
  confidence: number;
  createdAt: Date;
}
