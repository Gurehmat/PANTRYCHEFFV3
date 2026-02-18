import { Link, useLocation } from 'react-router-dom'
import { ChefHat, LayoutDashboard, UtensilsCrossed, Package } from 'lucide-react'

export default function Navbar() {
    const location = useLocation()

    const isActive = (path) => {
        return location.pathname === path ? 'bg-orange-100 text-orange-600' : 'text-gray-600 hover:bg-gray-50'
    }

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="bg-orange-500 p-2 rounded-lg group-hover:bg-orange-600 transition-colors">
                                <ChefHat className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                PantryChef
                            </span>
                        </Link>
                    </div>

                    <div className="flex items-center gap-1">
                        <Link
                            to="/"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/')}`}
                        >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>

                        <Link
                            to="/pantry"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/pantry')}`}
                        >
                            <Package className="w-4 h-4" />
                            My Pantry
                        </Link>

                        <Link
                            to="/recipes"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/recipes')}`}
                        >
                            <UtensilsCrossed className="w-4 h-4" />
                            Recipes
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    )
}
