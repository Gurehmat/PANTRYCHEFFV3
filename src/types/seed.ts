/**
 * Types for seed data (recipes_with_images.json).
 * After cleanRecipes.js: PrepTime, Calories, Protein, Fat are populated from Description.
 */
export interface SeedRecipe {
  Name: string;
  url?: string;
  Image?: string;
  Description?: string;
  Author?: string;
  Ingredients: string[];
  Method: string[];
  PrepTime?: string | null;
  Calories?: number | null;
  Protein?: string | null;
  Fat?: string | null;
}
