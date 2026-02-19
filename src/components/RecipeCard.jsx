import { Link } from 'react-router-dom'
import { Clock, Check, AlertTriangle, ArrowRight } from 'lucide-react'

export default function RecipeCard({ recipe, matchStatus }) {
    const { score, missing } = matchStatus

    // Color coding based on score
    const getScoreColor = (s) => {
        if (s === 100) return 'bg-green-100 text-green-700 border-green-200'
        if (s >= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
        return 'bg-orange-50 text-orange-700 border-orange-100'
    }

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full group overflow-hidden">
            {/* Recipe Image */}
            <div className="h-44 overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50 flex-shrink-0 relative">
                {recipe.image_url ? (
                    <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none' }}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🍽️</div>
                )}
                <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold border backdrop-blur-sm bg-white/80 ${getScoreColor(score)}`}>
                        {score}% Match
                    </span>
                </div>
            </div>
            <div className="p-5 flex-1">
                <h3 className="font-bold text-gray-900 group-hover:text-orange-600 transition-colors text-lg mb-1">
                    {recipe.title}
                </h3>

                <p className="text-gray-500 text-sm mb-4 line-clamp-2">{recipe.description}</p>

                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    {recipe.cooking_time}
                </div>

                {missing.length > 0 ? (
                    <div className="bg-red-50 p-3 rounded-lg text-xs space-y-1">
                        <div className="font-semibold text-red-800 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Missing {missing.length} ingredient{missing.length !== 1 ? 's' : ''}:
                        </div>
                        <p className="text-red-600 line-clamp-2">
                            {missing.join(', ')}
                        </p>
                    </div>
                ) : (
                    <div className="bg-green-50 p-3 rounded-lg text-xs text-green-700 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" />
                        You have everything!
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-gray-50 bg-gray-50/50 rounded-b-xl">
                <Link
                    to={`/recipes/${recipe.id}`}
                    className="w-full flex items-center justify-between text-sm font-semibold text-gray-600 hover:text-orange-600 transition-colors"
                >
                    View Recipe
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    )
}
