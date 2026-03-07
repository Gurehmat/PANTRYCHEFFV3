/**
 * Zustand store state and action types.
 */
import type { PantryItem, Recipe, ShoppingListItem, FavoriteRecipe } from './database';

export interface PantryStoreState {
  pantryItems: PantryItem[];
  loading: boolean;
  error: string | null;
}

export interface PantryStoreActions {
  clearError: () => void;
  fetchPantry: () => Promise<void>;
  addItem: (
    item: Pick<PantryItem, 'name' | 'quantity' | 'unit'> & { expiry_date?: string | null }
  ) => Promise<{ success: boolean; error?: string }>;
  addItems: (
    items: Array<{ name: string; quantity: number; unit: string; expiry_date?: string | null }>
  ) => Promise<{ success: boolean; error?: string }>;
  updateItem: (
    id: string,
    updates: Partial<Pick<PantryItem, 'name' | 'quantity' | 'unit' | 'expiry_date'>>
  ) => Promise<{ success: boolean; error?: string }>;
  deleteItem: (id: string) => Promise<void>;
}

export type PantryStore = PantryStoreState & PantryStoreActions;

export interface RecipeStoreState {
  recipes: Recipe[];
  loading: boolean;
  error: string | null;
  favorites: FavoriteRecipe[];
}

export interface RecipeStoreActions {
  clearError: () => void;
  fetchRecipes: () => Promise<void>;
  fetchFavorites: () => Promise<void>;
  toggleFavorite: (recipe: Recipe) => Promise<{ success: boolean; error?: string }>;
}

export type RecipeStore = RecipeStoreState & RecipeStoreActions;

export interface ShoppingListStoreState {
  items: ShoppingListItem[];
  loading: boolean;
  error: string | null;
}

export interface ShoppingListStoreActions {
  clearError: () => void;
  fetchItems: () => Promise<void>;
  addItem: (
    item: Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at' | 'checked'>
  ) => Promise<{ success: boolean; error?: string }>;
  toggleItem: (id: string, checked: boolean) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

export type ShoppingListStore = ShoppingListStoreState & ShoppingListStoreActions;
