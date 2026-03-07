import { supabase } from '../lib/supabaseClient';
import { responseCache } from '../utils/cache';
import { aiRateLimiter } from '../utils/rateLimiter';
import type { GeminiRecipeResponse } from '../types/ai';
import type { PantryItemLike } from '../utils/recipeMatching';

interface SubstitutionResult {
  substitutions?: Array<{ original: string; substitute: string; notes: string }>;
  [key: string]: unknown;
}

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

function getRecipeCacheKey(pantryItems: PantryItemLike[]): string {
  const names = pantryItems
    .map((p) => p?.name ?? '')
    .filter(Boolean)
    .sort();
  return responseCache.generateKey('generate-recipe', names);
}

function getSubstitutionsCacheKey(recipeTitle: string, missingIngredients: string[]): string {
  const sorted = [...missingIngredients].sort();
  return responseCache.generateKey('generate-substitutions', recipeTitle, sorted);
}

export async function generateRecipe(
  pantryItems: PantryItemLike[] | { name: string; quantity?: number; unit?: string }[],
  options?: { bypassCache?: boolean }
): Promise<GeminiRecipeResponse | unknown> {
  const key = getRecipeCacheKey(pantryItems);
  if (!options?.bypassCache) {
    const cached = responseCache.get<GeminiRecipeResponse | unknown>(key);
    if (cached != null) return cached;
  }

  if (!aiRateLimiter.canMakeRequest()) {
    const waitMs = aiRateLimiter.getTimeUntilNextSlot();
    throw new Error(`Too many requests. Please try again in ${Math.ceil(waitMs / 1000)} seconds.`);
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-recipe', {
      body: { pantryItems },
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (error) {
      let rawError = error.message;
      const ctx = error.context as { text?: () => Promise<string> } | undefined;
      if (ctx && typeof ctx.text === 'function') {
        const text = await ctx.text();
        rawError = `Response: ${text}`;
      } else if (ctx) {
        rawError = `Context: ${JSON.stringify(ctx)}`;
      }
      throw new Error(`Edge Function Failed: ${rawError}`);
    }
    responseCache.set(key, data, CACHE_TTL_MS);
    aiRateLimiter.recordRequest();
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate recipe';
    console.error('Error generating recipe:', err);
    throw new Error(message);
  }
}

export async function getSubstitutions(
  recipeTitle: string,
  missingIngredients: string[],
  pantryItems: PantryItemLike[] | { name: string; quantity?: number; unit?: string }[]
): Promise<SubstitutionResult | unknown> {
  const key = getSubstitutionsCacheKey(recipeTitle, missingIngredients);
  const cached = responseCache.get<SubstitutionResult | unknown>(key);
  if (cached != null) return cached;

  if (!aiRateLimiter.canMakeRequest()) {
    const waitMs = aiRateLimiter.getTimeUntilNextSlot();
    throw new Error(`Too many requests. Please try again in ${Math.ceil(waitMs / 1000)} seconds.`);
  }

  try {
    const { data, error } = await supabase.functions.invoke('generate-substitutions', {
      body: { recipeTitle, missingIngredients, pantryItems },
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    });

    if (error) throw error;
    responseCache.set(key, data, CACHE_TTL_MS);
    aiRateLimiter.recordRequest();
    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to get substitutions';
    console.error('Error getting substitutions:', err);
    throw new Error(message);
  }
}

/** Build cache key for current pantry (for invalidation from UI). */
export function getGenerateRecipeCacheKeyForPantry(
  pantryItems: PantryItemLike[] | { name: string }[]
): string {
  return getRecipeCacheKey(pantryItems);
}
