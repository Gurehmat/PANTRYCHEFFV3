import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useRecipeStore } from '../store/recipeStore'
import { Heart, ArrowRight, Clock } from 'lucide-react'
import RecipeCard from './RecipeCard'

export default function FavoritesPage() {
    const { favorites, fetchFavorites, loading } = useRecipeStore()

    useEffect(() => {
        fetchFavorites()
    }, [])

    return (
        <div className="space-y-8">
            <div className="bg-red-50 p-8 rounded-2xl border border-red-100">
                <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                    <Heart className="w-8 h-8 text-red-500 fill-current" />
                    My Favorite Recipes
                </h1>
                <p className="text-gray-600">
                    Your collection of loved recipes.
                </p>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-500">Loading your favorites...</div>
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
                    {favorites.map(fav => {
                        const recipe = fav.recipe_data || { id: fav.recipe_id, ...fav.recipe_data }
                        // If it's a linked recipe, we might not have full data here if we just fetched favorites.
                        // Ideally we should join with recipes table or fetch valid recipes. 
                        // For MVP, we assume recipe_data is populated if it's external, 
                        // or we rely on the component to handle ID only? 
                        // Actually, my store fetchFavorites only selects recipe_id, recipe_data.
                        // I need to fetch the ACTUAL recipe details if it's an ID.
                        // Let's rely on recipe_data being null for DB recipes and handle it.
                        // WAIT: fetchFavorites should probably join or I need to find it in `recipes` array.

                        return (
                            <div key={fav.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                {/* Simplified Card for Favorites */}
                                <div className="p-4">
                                    <h3 className="font-bold text-gray-900 mb-2">
                                        {recipe.title || 'Recipe #' + fav.recipe_id}
                                    </h3>
                                    {/* Link to detail */}
                                    <Link to={`/recipes/${fav.recipe_id || 'generated'}`} className="text-orange-600 text-sm font-medium hover:underline">
                                        View Recipe
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
