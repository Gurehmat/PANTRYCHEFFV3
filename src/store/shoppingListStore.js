import { create } from 'zustand'
import { supabase } from '../lib/supabaseClient'

export const useShoppingListStore = create((set) => ({
    items: [],
    loading: false,
    error: null,

    fetchItems: async () => {
        set({ loading: true })
        try {
            const { data, error } = await supabase
                .from('shopping_list')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            set({ items: data || [] })
        } catch (error) {
            set({ error: error.message })
        } finally {
            set({ loading: false })
        }
    },

    addItem: async (item) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not logged in')

            const { data, error } = await supabase
                .from('shopping_list')
                .insert([{ ...item, user_id: user.id }])
                .select()

            if (error) throw error

            set((state) => ({ items: [data[0], ...state.items] }))
            return { success: true }
        } catch (error) {
            set({ error: error.message })
            return { success: false, error: error.message }
        }
    },

    toggleItem: async (id, checked) => {
        try {
            // Optimistic update
            set((state) => ({
                items: state.items.map(item =>
                    item.id === id ? { ...item, checked } : item
                )
            }))

            const { error } = await supabase
                .from('shopping_list')
                .update({ checked })
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            // Revert on error
            set((state) => ({
                items: state.items.map(item =>
                    item.id === id ? { ...item, checked: !checked } : item
                )
            }))
            set({ error: error.message })
        }
    },

    deleteItem: async (id) => {
        try {
            set((state) => ({
                items: state.items.filter(item => item.id !== id)
            }))

            const { error } = await supabase
                .from('shopping_list')
                .delete()
                .eq('id', id)

            if (error) throw error
        } catch (error) {
            set({ error: error.message })
            // Would ideally refetch here to restore state
        }
    }
}))
