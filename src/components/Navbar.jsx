import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChefHat, LayoutDashboard, UtensilsCrossed, Package, Menu, X, Sparkles, ShoppingCart, Heart } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function Navbar() {
    const location = useLocation()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const isActive = (path) => {
        return location.pathname === path
            ? 'bg-orange-100 text-orange-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }

    const closeMenu = () => setIsMenuOpen(false)

    const handleLogout = async () => {
        await supabase.auth.signOut()
        closeMenu()
    }

    const handleDeleteAccount = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete your account? This will permanently remove your data and cannot be undone.',
        )
        if (!confirmed) return

        try {
            const { error } = await supabase.functions.invoke('delete-account')
            if (error) {
                console.error('Delete account error:', error)
                alert(error.message || 'Failed to delete account.')
                return
            }
            await supabase.auth.signOut()
        } catch (err) {
            console.error('Delete account error:', err)
            alert(err.message || 'Failed to delete account.')
        } finally {
            closeMenu()
        }
    }

    return (
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3 py-2">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
                            <div className="bg-orange-500 p-2 rounded-lg group-hover:bg-orange-600 transition-colors">
                                <ChefHat className="w-6 h-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                PantryCheff
                            </span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-1 flex-wrap justify-end">
                        <Link
                            to="/home"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/home')}`}
                        >
                            <Sparkles className="w-4 h-4" />
                            Home
                        </Link>

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

                        <Link
                            to="/generator"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/generator')}`}
                        >
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            Magic Recipe
                        </Link>

                        <Link
                            to="/shopping-list"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/shopping-list')}`}
                        >
                            <ShoppingCart className="w-4 h-4" />
                            Shop
                        </Link>

                        <Link
                            to="/favorites"
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/favorites')}`}
                        >
                            <Heart className="w-4 h-4 text-red-500" />
                            Favorites
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                            Log out
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteAccount}
                            className="ml-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 border border-red-200 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                            Delete account
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center md:hidden ml-auto">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? (
                                <X className="block h-6 w-6" aria-hidden="true" />
                            ) : (
                                <Menu className="block h-6 w-6" aria-hidden="true" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        <Link
                            to="/home"
                            onClick={closeMenu}
                            className={`flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium ${isActive('/home')}`}
                        >
                            <Sparkles className="w-5 h-5" />
                            Home
                        </Link>

                        <Link
                            to="/"
                            onClick={closeMenu}
                            className={`flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium ${isActive('/')}`}
                        >
                            <LayoutDashboard className="w-5 h-5" />
                            Dashboard
                        </Link>

                        <Link
                            to="/pantry"
                            onClick={closeMenu}
                            className={`flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium ${isActive('/pantry')}`}
                        >
                            <Package className="w-5 h-5" />
                            My Pantry
                        </Link>

                        <Link
                            to="/recipes"
                            onClick={closeMenu}
                            className={`flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium ${isActive('/recipes')}`}
                        >
                            <UtensilsCrossed className="w-5 h-5" />
                            Recipes
                        </Link>

                        <Link
                            to="/generator"
                            onClick={closeMenu}
                            className={`flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium ${isActive('/generator')}`}
                        >
                            <Sparkles className="w-5 h-5 text-yellow-500" />
                            Magic Recipe
                        </Link>

                        <Link
                            to="/shopping-list"
                            onClick={closeMenu}
                            className={`flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium ${isActive('/shopping-list')}`}
                        >
                            <ShoppingCart className="w-5 h-5" />
                            Shopping List
                        </Link>

                        <Link
                            to="/favorites"
                            onClick={closeMenu}
                            className={`flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium ${isActive('/favorites')}`}
                        >
                            <Heart className="w-5 h-5 text-red-500" />
                            Favorites
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="mt-2 w-full text-left flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium text-gray-600 border-t border-gray-100"
                        >
                            Log out
                        </button>

                        <button
                            type="button"
                            onClick={handleDeleteAccount}
                            className="w-full text-left flex items-center gap-2 px-3 py-3 rounded-md text-base font-medium text-red-600 border-t border-red-100"
                        >
                            Delete account
                        </button>
                    </div>
                </div>
            )}
        </nav>
    )
}
