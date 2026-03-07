import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecipeStore } from '../store/recipeStore';
import { Heart, ArrowRight } from 'lucide-react';
import type { Recipe } from '../types/database';

export default function FavoritesPage() {
  const { favorites, fetchFavorites, recipes, fetchRecipes } = useRecipeStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchFavorites();
        if (recipes.length === 0) await fetchRecipes();
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchFavorites, fetchRecipes, recipes.length]);

  return (
    <div className="space-y-8">
      <div className="bg-red-50 p-8 rounded-2xl border border-red-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500 fill-current" />
          My Favorite Recipes
        </h1>
        <p className="text-gray-600">Your collection of loved recipes.</p>
      </div>
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="p-4 space-y-2">
                <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-24 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h3>
          <p className="text-gray-500 mb-6">Start browsing recipes and heart the ones you love!</p>
          <Link
            to="/recipes"
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors"
          >
            Browse Recipes <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav) => {
            let recipe: Recipe | { id: string | null; title?: string } =
              (fav.recipe_data as Recipe) ?? null;
            if (!recipe) {
              recipe = recipes.find((r) => r.id === fav.recipe_id) ?? { id: fav.recipe_id };
            }
            return (
              <div
                key={fav.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2">
                    {'title' in recipe && recipe.title
                      ? recipe.title
                      : 'Recipe #' + (fav.recipe_id ?? 'generated')}
                  </h3>
                  <Link
                    to={`/recipes/${fav.recipe_id || 'generated'}`}
                    className="text-orange-600 text-sm font-medium hover:underline"
                  >
                    View Recipe
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
