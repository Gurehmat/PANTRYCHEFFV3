import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

export const useRecipeStore = create((set) => ({
    recipes: [],
    loading: false,
    error: null,

    fetchRecipes: async () => {
        set({ loading: true })
        try {
            const { data, error } = await supabase
                .from('recipes')
                .select('*')
                .order('title', { ascending: true })

            if (error) throw error

            // Parse instructions and deduplicate by title
            const uniqueRecipes = new Map();
            (data || []).forEach(recipe => {
                if (!uniqueRecipes.has(recipe.title)) {
                    uniqueRecipes.set(recipe.title, {
                        ...recipe,
                        instructions: typeof recipe.instructions === 'string'
                            ? JSON.parse(recipe.instructions)
                            : recipe.instructions
                    });
                }
            });

            set({ recipes: Array.from(uniqueRecipes.values()) })
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ loading: false })
        }
    }
}))
