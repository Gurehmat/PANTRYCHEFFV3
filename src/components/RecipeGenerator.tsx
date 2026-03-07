import { useState, useEffect } from 'react';
import { Sparkles, ChefHat, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import { usePantryStore } from '../store/pantryStore';
import { generateRecipe, getGenerateRecipeCacheKeyForPantry } from '../services/recipeService';
import { responseCache } from '../utils/cache';
import { aiRateLimiter } from '../utils/rateLimiter';
import type { GeminiRecipeResponse } from '../types/ai';
import type { RecipeIngredient } from '../types/database';

function formatIngredient(ing: string | RecipeIngredient): string {
  return typeof ing === 'string' ? ing : `${ing.quantity} ${ing.unit} ${ing.name}`.trim();
}

export default function RecipeGenerator() {
  const pantryItems = usePantryStore((state) => state.pantryItems);
  const [recipe, setRecipe] = useState<GeminiRecipeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitSeconds, setRateLimitSeconds] = useState(0);

  useEffect(() => {
    if (!aiRateLimiter.canMakeRequest()) {
      const update = () => {
        const ms = aiRateLimiter.getTimeUntilNextSlot();
        setRateLimitSeconds(ms > 0 ? Math.ceil(ms / 1000) : 0);
      };
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    }
    setRateLimitSeconds(0);
  }, [rateLimitSeconds, loading]);

  const handleGenerate = async (bypassCache = false) => {
    if (pantryItems.length === 0) {
      setError('Add some items to your pantry first!');
      return;
    }
    if (bypassCache) {
      const key = getGenerateRecipeCacheKeyForPantry(pantryItems);
      responseCache.invalidate(key);
    }
    setLoading(true);
    setError(null);
    try {
      const result = (await generateRecipe(pantryItems, { bypassCache })) as GeminiRecipeResponse;
      setRecipe(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const rateLimited = !aiRateLimiter.canMakeRequest();
  const generateDisabled = loading || pantryItems.length === 0 || rateLimited;

  const ingredientsList = recipe?.ingredients ?? [];
  const instructionsList = Array.isArray(recipe?.instructions) ? recipe.instructions : [];

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-100 shadow-sm">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Magic Recipe
        </h2>
        <p className="text-gray-600">
          Let AI create a recipe from your {pantryItems.length} pantry items
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleGenerate(false)}
          disabled={generateDisabled}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <ChefHat className="w-5 h-5 animate-bounce" />
              Cooking up ideas...
            </>
          ) : rateLimited ? (
            `Try again in ${rateLimitSeconds} seconds`
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Recipe
            </>
          )}
        </button>
        {recipe && (
          <button
            type="button"
            onClick={() => handleGenerate(true)}
            disabled={loading || rateLimited}
            className="w-full border-2 border-orange-300 text-orange-600 hover:bg-orange-50 font-medium py-2 px-4 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate (bypass cache)
          </button>
        )}
      </div>
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      {recipe && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{recipe.title}</h3>
          <p className="text-gray-600 mb-4 italic">{recipe.description}</p>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <Clock className="w-4 h-4" />
            {recipe.cooking_time}
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Ingredients</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {ingredientsList.map((ing, i) => (
                  <li key={i}>{formatIngredient(ing)}</li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Instructions</h4>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                {instructionsList.map((step, i) => (
                  <li key={i} className="pl-1">
                    <span className="pl-1">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
            {recipe.missing_ingredients?.length ? (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-1 text-sm">
                  Missing Ingredients (Optional)
                </h4>
                <p className="text-yellow-700 text-sm">{recipe.missing_ingredients.join(', ')}</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
