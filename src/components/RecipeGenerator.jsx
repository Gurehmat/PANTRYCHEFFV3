import { useState } from 'react'
import { Sparkles, ChefHat, Clock, AlertCircle } from 'lucide-react'
import { usePantryStore } from '../store/pantryStore'
import { generateRecipe } from '../services/recipeService'

export default function RecipeGenerator() {
    const pantryItems = usePantryStore((state) => state.pantryItems)
    const [recipe, setRecipe] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const handleGenerate = async () => {
        if (pantryItems.length === 0) {
            setError('Add some items to your pantry first!')
            return
        }

        setLoading(true)
        setError(null)
        try {
            const result = await generateRecipe(pantryItems)
            setRecipe(result)
        } catch (err) {
            setError(err.message || 'Failed to generate recipe. Please try again.')
        } finally {
            setLoading(false)
        }
    }

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

            <button
                onClick={handleGenerate}
                disabled={loading || pantryItems.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {loading ? (
                    <>
                        <ChefHat className="w-5 h-5 animate-bounce" />
                        Cooking up ideas...
                    </>
                ) : (
                    <>
                        <Sparkles className="w-5 h-5" />
                        Generate Recipe
                    </>
                )}
            </button>

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
                                {recipe.ingredients.map((ing, i) => (
                                    <li key={i}>{ing}</li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Instructions</h4>
                            <ol className="list-decimal list-inside space-y-2 text-gray-700">
                                {recipe.instructions.map((step, i) => (
                                    <li key={i} className="pl-1">
                                        <span className="pl-1">{step}</span>
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {recipe.missing_ingredients?.length > 0 && (
                            <div className="bg-yellow-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-yellow-800 mb-1 text-sm">Missing Ingredients (Optional)</h4>
                                <p className="text-yellow-700 text-sm">
                                    {recipe.missing_ingredients.join(', ')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
