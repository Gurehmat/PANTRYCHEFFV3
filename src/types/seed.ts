/**
 * Types for seed data (recipes_with_images.json).
 */
export interface SeedRecipe {
  Name: string;
  url?: string;
  Image?: string;
  Description?: string;
  Author?: string;
  Ingredients: string[];
  Method: string[];
}
