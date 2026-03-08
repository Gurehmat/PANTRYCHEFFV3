import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { handleError, getErrorMessage } from '../utils/errors';
import { logger } from '../utils/logger';
import type { Recipe, FavoriteRecipe } from '../types/database';
import type { RecipeStore } from '../types/store';

const SOURCE = 'recipeStore';
const RECIPE_COLUMNS =
  'id, user_id, title, description, ingredients, instructions, cooking_time, image_url, calories, protein, fat, created_at';

interface RecipeRow {
  id: string;
  title: string;
  description?: string | null;
  ingredients?: unknown;
  instructions?: string | string[];
  cooking_time?: number | string | null;
  image_url?: string | null;
  calories?: number | null;
  protein?: string | null;
  fat?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  loading: false,
  error: null,
  favorites: [],

  clearError: () => set({ error: null }),

  fetchRecipes: async () => {
    set({ error: null, loading: true });
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(RECIPE_COLUMNS)
        .order('title', { ascending: true })
        .limit(500);

      if (error) throw error;
      const rows = (data as RecipeRow[] | null) || [];
      const uniqueRecipes = new Map<string, Recipe>();
      rows.forEach((recipe) => {
        if (!recipe?.title || uniqueRecipes.has(recipe.title)) return;
        let instructions: string[] = [];
        if (Array.isArray(recipe.instructions)) {
          instructions = recipe.instructions as string[];
        } else if (typeof recipe.instructions === 'string') {
          try {
            instructions = JSON.parse(recipe.instructions) as string[];
          } catch {
            instructions = [];
          }
        }
        uniqueRecipes.set(recipe.title, { ...recipe, instructions } as Recipe);
      });
      set({ recipes: Array.from(uniqueRecipes.values()) });
    } catch (err) {
      const appErr = handleError(err);
      const msg = getErrorMessage(appErr);
      logger.error(SOURCE, 'fetchRecipes failed', { error: appErr });
      set({ error: msg });
    } finally {
      set({ loading: false });
    }
  },

  fetchFavorites: async () => {
    set({ error: null, loading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        set({ loading: false });
        return;
      }
      const { data, error } = await supabase
        .from('favorites')
        .select('id, user_id, recipe_id, recipe_data, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      set({ favorites: (data as FavoriteRecipe[]) || [] });
    } catch (err) {
      const appErr = handleError(err);
      const msg = getErrorMessage(appErr);
      logger.error(SOURCE, 'fetchFavorites failed', { error: appErr });
      set({ error: msg });
    } finally {
      set({ loading: false });
    }
  },

  toggleFavorite: async (recipe: Recipe) => {
    set({ error: null });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'User not logged in' };
    const { favorites } = get();
    const isFavorited = favorites.some(
      (f) =>
        (f.recipe_id && f.recipe_id === recipe.id) ||
        (f.recipe_data && (f.recipe_data as Recipe).title === recipe.title)
    );
    try {
      if (isFavorited) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .or(`recipe_id.eq.${recipe.id},recipe_data->>title.eq.${recipe.title}`);
        if (error) throw error;
        set({
          favorites: favorites.filter(
            (f) =>
              f.recipe_id &&
              f.recipe_id !== recipe.id &&
              f.recipe_data &&
              (f.recipe_data as Recipe).title !== recipe.title
          ),
        });
        return { success: true };
      } else {
        const newFav = {
          user_id: user.id,
          recipe_id: recipe.id ? recipe.id : null,
          recipe_data: recipe.id ? null : recipe,
        };
        const { data, error } = await supabase.from('favorites').insert([newFav]).select();
        if (error) throw error;
        if (data && (data as FavoriteRecipe[])[0]) {
          set({ favorites: [...favorites, (data as FavoriteRecipe[])[0]] });
          return { success: true };
        }
      }
    } catch (err) {
      const appErr = handleError(err);
      const msg = getErrorMessage(appErr);
      logger.error(SOURCE, 'toggleFavorite failed', { error: appErr });
      return { success: false, error: msg };
    }
    return { success: false, error: 'Unknown error' };
  },
}));
