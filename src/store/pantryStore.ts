import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { handleError, getErrorMessage } from '../utils/errors';
import { logger } from '../utils/logger';
import type { PantryItem } from '../types/database';
import type { PantryStore } from '../types/store';

const SOURCE = 'pantryStore';
const PANTRY_COLUMNS = 'id, user_id, name, quantity, unit, expiry_date, created_at';

type PantryItemInsert = Pick<PantryItem, 'name' | 'quantity' | 'unit'> & {
  expiry_date?: string | null;
};
type PantryItemAddMany = {
  name: string;
  quantity: number;
  unit: string;
  expiry_date?: string | null;
};

export const usePantryStore = create<PantryStore>((set) => ({
  pantryItems: [],
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchPantry: async () => {
    set({ error: null, loading: true });
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select(PANTRY_COLUMNS)
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      set({ pantryItems: (data as PantryItem[]) || [] });
    } catch (err) {
      const appErr = handleError(err);
      const msg = getErrorMessage(appErr);
      logger.error(SOURCE, 'fetchPantry failed', { error: appErr });
      set({ error: msg });
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (item: PantryItemInsert) => {
    set({ error: null, loading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const { data, error } = await supabase
        .from('pantry_items')
        .insert([{ ...item, user_id: user.id, expiry_date: item.expiry_date ?? null }])
        .select(PANTRY_COLUMNS);

      if (error) throw error;
      const inserted = data as PantryItem[] | null;
      set((state) => ({
        pantryItems: inserted?.[0] ? [inserted[0], ...state.pantryItems] : state.pantryItems,
      }));
      return { success: true };
    } catch (err) {
      const appErr = handleError(err);
      const message = getErrorMessage(appErr);
      logger.error(SOURCE, 'addItem failed', { error: appErr });
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  addItems: async (items: PantryItemAddMany[]) => {
    set({ error: null, loading: true });
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('User not logged in');

      const itemsWithUser = items.map((item) => ({
        ...item,
        user_id: user.id,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('pantry_items')
        .insert(itemsWithUser)
        .select(PANTRY_COLUMNS);

      if (error) throw error;
      const inserted = data as PantryItem[] | null;
      set((state) => ({
        pantryItems: [...(inserted || []), ...state.pantryItems],
      }));
      return { success: true };
    } catch (err) {
      const appErr = handleError(err);
      const message = getErrorMessage(appErr);
      logger.error(SOURCE, 'addItems failed', { error: appErr });
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  updateItem: async (
    id: string,
    updates: Partial<Pick<PantryItem, 'name' | 'quantity' | 'unit' | 'expiry_date'>>
  ) => {
    set({ error: null, loading: true });
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .update(updates)
        .eq('id', id)
        .select(PANTRY_COLUMNS);

      if (error) throw error;
      const updated = data as PantryItem[] | null;
      set((state) => ({
        pantryItems: state.pantryItems.map((item) =>
          item.id === id && updated?.[0] ? { ...item, ...updated[0] } : item
        ),
      }));
      return { success: true };
    } catch (err) {
      const appErr = handleError(err);
      const message = getErrorMessage(appErr);
      logger.error(SOURCE, 'updateItem failed', { error: appErr });
      set({ error: message });
      return { success: false, error: message };
    } finally {
      set({ loading: false });
    }
  },

  deleteItem: async (id: string) => {
    set({ error: null });
    try {
      const { error } = await supabase.from('pantry_items').delete().eq('id', id);
      if (error) throw error;
      set((state) => ({
        pantryItems: state.pantryItems.filter((item) => item.id !== id),
      }));
    } catch (err) {
      const appErr = handleError(err);
      const msg = getErrorMessage(appErr);
      logger.error(SOURCE, 'deleteItem failed', { error: appErr });
      set({ error: msg });
    }
  },
}));
