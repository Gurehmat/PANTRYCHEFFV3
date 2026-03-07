/**
 * Database entity types (Supabase tables).
 */

export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry_date: string | null;
  created_at: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: number | string;
  unit: string;
}

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  ingredients: RecipeIngredient[] | string[];
  instructions: string | string[];
  cooking_time: number | string | null;
  image_url: string | null;
  created_at: string;
}

export interface ShoppingListItem {
  id: string;
  user_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  checked: boolean;
  created_at: string;
}

export interface FavoriteRecipe {
  id: string;
  user_id: string;
  recipe_id: string | null;
  recipe_data: Recipe | null;
  created_at?: string;
}
