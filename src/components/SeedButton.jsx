import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRecipeStore } from '../store/recipeStore'
import recipes from '../data/recipes.json'
import { Database, Check, Loader2, AlertCircle } from 'lucide-react'

export default function SeedButton() {
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState(null) // 'success' | 'error' | null
    const { fetchRecipes } = useRecipeStore()

    const handleSeed = async () => {
        setLoading(true)
        setStatus(null)
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            console.log('Current user:', user)
            if (!user) throw new Error('Must be logged in to seed database')

            // Clear existing recipes to prevent duplicates
            const { error: deleteError } = await supabase
                .from('recipes')
                .delete()
                .eq('user_id', user.id)

            if (deleteError) throw deleteError

            // Prepare data with user_id and map JSON keys to database columns
            const recipesToInsert = recipes.map(recipe => ({
                user_id: user.id,
                title: recipe.Name,
                ingredients: recipe.Ingredients,
                instructions: JSON.stringify(recipe.Method) // Store as JSON string since column is text
            }))

            const { error } = await supabase
                .from('recipes')
                .insert(recipesToInsert)

            if (error) {
                console.error('Supabase error details:', JSON.stringify(error, null, 2))
                throw error
            }

            await fetchRecipes() // Refresh the list
            setStatus('success')
            // Reset status after 3 seconds
            setTimeout(() => setStatus(null), 3000)
        } catch (error) {
            console.error('Seeding error full object:', error)
            setStatus('error')
            alert(`Seeding failed: ${error.message || JSON.stringify(error)}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            onClick={handleSeed}
            disabled={loading || status === 'success'}
            className={`
        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
        ${status === 'success'
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : status === 'error'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'}
      `}
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : status === 'success' ? (
                <Check className="w-4 h-4" />
            ) : status === 'error' ? (
                <AlertCircle className="w-4 h-4" />
            ) : (
                <Database className="w-4 h-4" />
            )}
            {status === 'success' ? 'Seeded!' : status === 'error' ? 'Failed' : 'Seed Database'}
        </button>
    )
}
