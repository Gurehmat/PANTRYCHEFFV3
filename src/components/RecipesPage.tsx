import { useEffect, useState, useMemo } from 'react';
import { useRecipeStore } from '../store/recipeStore';
import { usePantryStore } from '../store/pantryStore';
import { getRecipeMatches } from '../utils/recipeMatching';
import RecipeCard from './RecipeCard';
import SeedButton from './SeedButton';
import { Search } from 'lucide-react';
import type { Recipe } from '../types/database';
import type { MatchResult } from '../types/matching';

interface RecipeWithMatch extends Recipe {
  matchResult: MatchResult;
}

export default function RecipesPage() {
  const { recipes, fetchRecipes, loading: recipesLoading, error } = useRecipeStore();
  const { pantryItems, fetchPantry, loading: pantryLoading } = usePantryStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRecipes();
    if (pantryItems.length === 0) {
      fetchPantry();
    }
  }, [fetchRecipes, fetchPantry, pantryItems.length]);

  const loading = recipesLoading || pantryLoading;

  /** Recomputes only when recipes, pantryItems, or searchTerm change (avoids recalculating match + filter + sort on every parent re-render). */
  const sortedRecipes: RecipeWithMatch[] = useMemo(
    () =>
      recipes
        .map((recipe) => ({
          ...recipe,
          matchResult: getRecipeMatches(pantryItems, {
            id: recipe.id,
            title: recipe.title,
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
          }),
        }))
        .filter((item) => (item.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => b.matchResult.matchPercentage - a.matchResult.matchPercentage),
    [recipes, pantryItems, searchTerm]
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="h-40 bg-gray-200 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20 text-red-600 bg-red-50 rounded-lg m-4 border border-red-200">
        <h3 className="font-bold">Error loading recipes</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
          <p className="text-gray-500">Sorted by what you can cook right now</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none w-full md:w-64"
            />
          </div>
          <div className="flex-shrink-0">
            <SeedButton />
          </div>
        </div>
      </div>
      {recipes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-600 font-medium mb-2">No recipes found</p>
          <p className="text-gray-500 mb-6 text-sm">
            Seed the database or add recipes to get started.
          </p>
          <SeedButton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} matchResult={recipe.matchResult} />
          ))}
        </div>
      )}
    </div>
  );
}
