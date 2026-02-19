import { useEffect, useState } from 'react'
import { useRecipeStore } from '../store/recipeStore'
import { usePantryStore } from '../store/pantryStore'
import { getMatchStatus } from '../utils/recipeMatching'
import RecipeCard from './RecipeCard'
import SeedButton from './SeedButton'
import { Search, Loader2 } from 'lucide-react'

export default function RecipesPage() {
    const { recipes, fetchRecipes, loading: recipesLoading, error } = useRecipeStore()
    const { pantryItems, fetchPantry, loading: pantryLoading } = usePantryStore()
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchRecipes()
        if (pantryItems.length === 0) {
            fetchPantry()
        }
    }, [])

    const loading = recipesLoading || pantryLoading

    // Calculate scores and sort
    const sortedRecipes = recipes
        .map(recipe => ({
            ...recipe,
            matchStatus: getMatchStatus(recipe.ingredients, pantryItems)
        }))
        .filter(item =>
            item.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => b.matchStatus.score - a.matchStatus.score)

    if (loading) {
        return <div className="text-center py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
    }

    if (error) {
        return <div className="text-center py-20 text-red-600 bg-red-50 rounded-lg m-4 border border-red-200">
            <h3 className="font-bold">Error loading recipes</h3>
            <p>{error}</p>
        </div>
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
                    <p className="text-gray-500 mb-4">No recipes found in the database.</p>
                    <div className="flex justify-center">
                        <SeedButton />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sortedRecipes.map(recipe => (
                        <RecipeCard key={recipe.id} recipe={recipe} matchStatus={recipe.matchStatus} />
                    ))}
                </div>
            )}
        </div>
    )
}
