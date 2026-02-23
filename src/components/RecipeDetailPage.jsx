
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useRecipeStore } from '../store/recipeStore'
import { usePantryStore } from '../store/pantryStore'
import { useShoppingListStore } from '../store/shoppingListStore'
import { getMatchStatus } from '../utils/recipeMatching'
import { getSubstitutions } from '../services/recipeService'
import { ArrowLeft, Clock, ChefHat, AlertTriangle, Sparkles, Check, Loader2, ShoppingCart, Heart } from 'lucide-react'

export default function RecipeDetailPage() {
    const { id } = useParams()
    const { recipes, fetchRecipes, toggleFavorite, favorites, fetchFavorites } = useRecipeStore()
    const { pantryItems, fetchPantry } = usePantryStore()
    const { addItem: addToShoppingList } = useShoppingListStore()

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [substitutions, setSubstitutions] = useState(null)
    const [error, setError] = useState(null)
    const [addedToCart, setAddedToCart] = useState({})

    useEffect(() => {
        const loadData = async () => {
            if (recipes.length === 0) await fetchRecipes()
            if (pantryItems.length === 0) await fetchPantry()
            await fetchFavorites()
            setLoading(false)
        }
        loadData()
    }, [])

    if (loading) return <div className="text-center py-20">Loading...</div>

    const recipe = recipes.find(r => r.id === id)
    if (!recipe) return <div className="text-center py-20">Recipe not found</div>

    const { score, missing, matches } = getMatchStatus(recipe.ingredients, pantryItems)
    const isFavorite = favorites.some(f => f.recipe_id === recipe.id)

    const handleAskAI = async () => {
        setSubmitting(true)
        setError(null)
        try {
            const result = await getSubstitutions(recipe.title, missing, pantryItems)
            setSubstitutions(result)
        } catch (err) {
            setError(err.message || 'Failed to get substitutions. Please try again.')
        } finally {
            setSubmitting(false)
        }
    }

    const handleAddToShoppingList = async (ingredient) => {
        const result = await addToShoppingList({ name: ingredient, quantity: 1, unit: 'pc' })
        if (result.success) {
            setAddedToCart(prev => ({ ...prev, [ingredient]: true }))
        } else {
            alert(`Failed to add to shopping list: ${result.error}. WARNING: You may need to run the SQL Setup script in Supabase!`)
        }
    }

    // Safely parse instructions
    let steps = []
    try {
        if (Array.isArray(recipe.instructions)) {
            // Flatten steps if they contain multiple sentences
            steps = recipe.instructions.flatMap(step => {
                if (typeof step === 'string' && step.length > 50) {
                    // Split by period followed by space, but keep the period
                    // Filter out empty strings
                    return step.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                }
                return step;
            });
        } else if (typeof recipe.instructions === 'string') {
            const trimmed = recipe.instructions.trim();
            if (trimmed.startsWith('[')) {
                try {
                    const parsed = JSON.parse(trimmed);
                    // Same logic for parsed JSON array
                    steps = parsed.flatMap(step => {
                        if (typeof step === 'string' && step.length > 50) {
                            return step.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                        }
                        return step;
                    });
                } catch (e) {
                    // Fallback if JSON parse fails
                    steps = trimmed.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
                }
            } else {
                // Split by newlines or sentence boundaries
                steps = trimmed.split(/\n|(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
            }
        }
    } catch (e) {
        steps = [recipe.instructions]
    }

    return (
        <div className="max-w-4xl mx-auto">
            <Link to="/recipes" className="inline-flex items-center gap-2 text-gray-500 hover:text-orange-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Back to Recipes
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Hero Image */}
                {recipe.image_url && (
                    <div className="h-64 overflow-hidden relative">
                        <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.parentElement.style.display = 'none' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                )}
                <div className="p-5 md:p-8 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{recipe.title}</h1>
                            <div className={`inline - flex px - 3 py - 1 rounded - full text - sm font - bold border 
                  ${score === 100 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-100'} `}>
                                {score}% Match
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                const result = await toggleFavorite(recipe)
                                if (!result.success) {
                                    alert(`Failed to update favorites: ${result.error}. WARNING: You may need to run the SQL Setup script in Supabase!`)
                                }
                            }}
                            className={`p - 3 rounded - full transition - all ${isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400 hover:text-red-500'} `}
                        >
                            <Heart className={`w - 6 h - 6 ${isFavorite ? 'fill-current' : ''} `} />
                        </button>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">{recipe.description}</p>
                    <div className="flex items-center gap-2 text-gray-500">
                        <Clock className="w-5 h-5" />
                        <span className="font-medium">{recipe.cooking_time}</span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-0">
                    <div className="p-5 md:p-8 bg-gray-50">
                        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-orange-500" />
                            Ingredients
                        </h2>
                        <ul className="space-y-3">
                            {recipe.ingredients.map((ing, i) => {
                                const isMissing = missing.includes(ing)
                                return (
                                    <li key={i} className={`flex items - center justify - between p - 2 rounded - lg ${isMissing ? 'bg-red-50/50' : 'bg-green-50/50'} `}>
                                        <div className="flex items-center gap-3">
                                            {isMissing ? (
                                                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                                            ) : (
                                                <Check className="w-5 h-5 text-green-500 shrink-0" />
                                            )}
                                            <span className={isMissing ? 'text-red-700 font-medium' : 'text-gray-700'}>
                                                {ing}
                                            </span>
                                        </div>
                                        {isMissing && (
                                            <button
                                                onClick={() => handleAddToShoppingList(ing)}
                                                disabled={addedToCart[ing]}
                                                className={`p - 1.5 rounded - md transition - colors ${addedToCart[ing] ? 'bg-green-100 text-green-600' : 'hover:bg-red-100 text-red-400'} `}
                                                title="Add to Shopping List"
                                            >
                                                {addedToCart[ing] ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>

                        {missing.length > 0 && (
                            <div className="mt-8">
                                <div className="bg-white p-4 rounded-xl border border-orange-100 shadow-sm">
                                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-orange-500" />
                                        Missing {missing.length} items?
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4">
                                        Ask AI for smart substitutions using what you have.
                                    </p>

                                    {error && (
                                        <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-100">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleAskAI}
                                        disabled={submitting}
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Substitutions'}
                                    </button>
                                </div>

                                {substitutions && (
                                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                                        {substitutions.map((sub, i) => (
                                            <div key={i} className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-sm">
                                                <span className="font-bold text-blue-800">For {sub.missing}:</span> use <span className="font-bold text-blue-600">{sub.substitution}</span>
                                                <div className="text-blue-500 text-xs mt-1">{sub.reason}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-5 md:p-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Instructions</h2>
                        <ol className="space-y-6">
                            {steps.map((step, i) => (
                                <li key={i} className="flex gap-4">
                                    <span className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                                        {i + 1}
                                    </span>
                                    <p className="text-gray-700 leading-relaxed mt-1">{step}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    )
}
