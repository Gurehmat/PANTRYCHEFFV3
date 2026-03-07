import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { handleError, getErrorMessage } from '../utils/errors';
import { logger } from '../utils/logger';
import type { ShoppingListItem } from '../types/database';
import type { ShoppingListStore } from '../types/store';

const SOURCE = 'shoppingListStore';
const SHOPPING_LIST_COLUMNS = 'id, user_id, name, quantity, unit, checked, created_at';

type ShoppingItemInsert = Omit<ShoppingListItem, 'id' | 'user_id' | 'created_at' | 'checked'>;

export const useShoppingListStore = create<ShoppingListStore>((set) => ({
  items: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchItems: async () => {
    set({ error: null, loading: true });
    try {
      const { data, error } = await supabase
        .from('shopping_list')
        .select(SHOPPING_LIST_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      set({ items: (data as ShoppingListItem[]) || [] });
    } catch (err) {
      const appErr = handleError(err);
      const msg = getErrorMessage(appErr);
      logger.error(SOURCE, 'fetchItems failed', { error: appErr });
      set({ error: msg });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (item: ShoppingItemInsert) => {
    set({ error: null });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');
      const { data, error } = await supabase
        .from('shopping_list')
        .insert([{ ...item, user_id: user.id }])
        .select(SHOPPING_LIST_COLUMNS);
      if (error) throw error;
      const inserted = data as ShoppingListItem[] | null;
      set((state) => ({
        items: inserted?.[0] ? [inserted[0], ...state.items] : state.items,
      }));
      return { success: true };
    } catch (err) {
      const appErr = handleError(err);
      const message = getErrorMessage(appErr);
      logger.error(SOURCE, 'addItem failed', { error: appErr });
      set({ error: message });
      return { success: false, error: message };
    }
  },

  toggleItem: async (id: string, checked: boolean) => {
    set({ error: null });
    try {
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, checked } : item)),
      }));
      const { error } = await supabase.from('shopping_list').update({ checked }).eq('id', id);
      if (error) throw error;
    } catch (err) {
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? { ...item, checked: !checked } : item)),
      }));
      const appErr = handleError(err);
      const msg = getErrorMessage(appErr);
      logger.error(SOURCE, 'toggleItem failed', { error: appErr });
      set({ error: msg });
    }
  },

  deleteItem: async (id: string) => {
    set({ error: null });
    try {
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
      const { error } = await supabase.from('shopping_list').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      const appErr = handleError(err);
      const msg = getErrorMessage(appErr);
      logger.error(SOURCE, 'deleteItem failed', { error: appErr });
      set({ error: msg });
    }
  },
}));
