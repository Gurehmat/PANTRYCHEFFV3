/**
 * Types for recipe–pantry matching results and ingredient-level match details.
 */

/** Per-ingredient match result with confidence and match type. */
export interface IngredientMatch {
  recipeIngredient: string;
  pantryMatch: string | null;
  confidence: number; // 0–100
  matchType: 'exact' | 'partial' | 'fuzzy' | 'none';
}

/** Full match result for one recipe against the pantry. */
export interface MatchResult {
  recipeId: string;
  recipeTitle: string;
  matchedIngredients: IngredientMatch[];
  missingIngredients: string[];
  matchPercentage: number; // 0–100
  canMake: boolean; // true when matchPercentage >= 80
}
