import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

export const useRecipeStore = create((set, get) => ({
    recipes: [],
    loading: false,
    error: null,
    favorites: [],

    fetchRecipes: async () => {
        set({ loading: true })
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('title', { ascending: true })

            if (error) throw error

            // Parse instructions and deduplicate by title (skip recipes with invalid JSON)
            const uniqueRecipes = new Map();
            (data || []).forEach(recipe => {
                if (!recipe?.title || uniqueRecipes.has(recipe.title)) return
                let instructions = recipe.instructions
                if (typeof recipe.instructions === 'string') {
                    try {
                        instructions = JSON.parse(recipe.instructions)
                    } catch {
                        instructions = []
                    }
                }
                uniqueRecipes.set(recipe.title, { ...recipe, instructions })
            });

            set({ recipes: Array.from(uniqueRecipes.values()) })
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ loading: false })
        }
    },

    fetchFavorites: async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
            .from('favorites')
            .select('recipe_id, recipe_data')
            .eq('user_id', user.id)

        set({ favorites: data || [] })
    },

    toggleFavorite: async (recipe) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { success: false, error: 'User not logged in' }

        const { favorites } = get()
        const isFavorited = favorites.some(f =>
            (f.recipe_id && f.recipe_id === recipe.id) ||
            (f.recipe_data && f.recipe_data.title === recipe.title)
        )

        try {
            if (isFavorited) {
                // Remove
                const { error } = await supabase
                    .from('favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .or(`recipe_id.eq.${recipe.id},recipe_data->>title.eq.${recipe.title}`)

                if (error) throw error

                set({
                    favorites: favorites.filter(f =>
                        (f.recipe_id && f.recipe_id !== recipe.id) &&
                        (f.recipe_data && f.recipe_data.title !== recipe.title)
                    )
                })
                return { success: true }
            } else {
                // Add
                const newFav = {
                    user_id: user.id,
                    recipe_id: recipe.id ? recipe.id : null,
                    recipe_data: recipe.id ? null : recipe
                }

                const { data, error } = await supabase
                    .from('favorites')
                    .insert([newFav])
                    .select()

                if (error) throw error
                if (data) {
                    set({ favorites: [...favorites, data[0]] })
                    return { success: true }
                }
            }
        } catch (error) {
            console.error('Toggle favorite error:', error)
            return { success: false, error: error.message }
        }
    }
}))
