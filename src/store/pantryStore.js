import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

export const usePantryStore = create((set, get) => ({
    pantryItems: [],
    loading: false,
    error: null,

    fetchPantry: async () => {
        set({ loading: true })
        try {
            const { data, error } = await supabase
                .from('pantry_items')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            set({ pantryItems: data || [] })
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ loading: false })
        }
    },

    addItem: async (item) => {
        set({ loading: true })
        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not logged in')

            const { data, error } = await supabase
                .from('pantry_items')
                .insert([{ ...item, user_id: user.id }])
                .select()

            if (error) throw error

            set((state) => ({ pantryItems: [data[0], ...state.pantryItems] }))
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        } finally {
            set({ loading: false })
        }
    },

    addItems: async (items) => {
        set({ loading: true })
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not logged in')

            const itemsWithUser = items.map(item => ({
                ...item,
                user_id: user.id,
                created_at: new Date().toISOString()
            }))

            const { data, error } = await supabase
                .from('pantry_items')
                .insert(itemsWithUser)
                .select()

            if (error) throw error

            set((state) => ({
                pantryItems: [...(data || []), ...state.pantryItems]
            }))
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        } finally {
            set({ loading: false })
        }
    },

    deleteItem: async (id) => {
        try {
            const { error } = await supabase
                .from('pantry_items')
                .delete()
                .eq('id', id)

            if (error) throw error

            set((state) => ({
                pantryItems: state.pantryItems.filter((item) => item.id !== id)
            }))
        } catch (error) {
            console.error('Error deleting item:', error)
            set({ error: error.message })
        }
    }
}))
