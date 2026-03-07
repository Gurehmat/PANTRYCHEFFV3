/**
 * AI / Edge Function response types (Gemini, Supabase Functions).
 */
import type { RecipeIngredient } from './database';

export interface GeminiRecipeResponse {
  title: string;
  description: string;
  ingredients: RecipeIngredient[] | string[];
  instructions: string[];
  cooking_time: number;
  missing_ingredients?: string[];
}

export interface GeminiSubstitution {
  original: string;
  substitute: string;
  notes: string;
}

export interface GeminiScanResultItem {
  name: string;
  quantity: number;
  unit: string;
}

export type GeminiScanResult = GeminiScanResultItem[];

export interface EdgeFunctionResponse<T> {
  data: T | null;
  error: string | null;
}
