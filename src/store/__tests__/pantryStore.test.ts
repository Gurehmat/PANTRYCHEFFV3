import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePantryStore } from '../pantryStore';

const mockFrom = vi.hoisted(() => vi.fn());
const mockGetUser = vi.hoisted(() => vi.fn());
vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    get from() {
      return mockFrom;
    },
    auth: {
      get getUser() {
        return mockGetUser;
      },
    },
  },
}));

function getChain() {
  const chain = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  return chain;
}

describe('pantryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    usePantryStore.setState({
      pantryItems: [],
      loading: false,
      error: null,
    });
    const chain = getChain();
    mockFrom.mockReturnValue(chain);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  describe('initial state', () => {
    it('has correct initial state when reset', () => {
      usePantryStore.setState({ pantryItems: [], loading: false, error: null });
      expect(usePantryStore.getState().pantryItems).toEqual([]);
      expect(usePantryStore.getState().loading).toBe(false);
      expect(usePantryStore.getState().error).toBe(null);
    });
  });

  describe('fetchPantry', () => {
    it('sets loading true then false and populates pantryItems on success', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.limit.mockResolvedValue({
        data: [
          {
            id: '1',
            name: 'Flour',
            quantity: 1,
            unit: 'kg',
            user_id: 'u',
            created_at: '',
            expiry_date: null,
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await usePantryStore.getState().fetchPantry();

      expect(usePantryStore.getState().loading).toBe(false);
      expect(usePantryStore.getState().pantryItems).toHaveLength(1);
      expect(usePantryStore.getState().pantryItems[0].name).toBe('Flour');
      expect(usePantryStore.getState().error).toBe(null);
    });

    it('sets error on supabase error', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.limit.mockResolvedValue({ data: null, error: { message: 'DB error' } });
      mockFrom.mockReturnValue(chain);

      await usePantryStore.getState().fetchPantry();

      expect(usePantryStore.getState().error).toBe('DB error');
      expect(usePantryStore.getState().loading).toBe(false);
    });

    it('handles empty data', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.limit.mockResolvedValue({ data: [], error: null });
      mockFrom.mockReturnValue(chain);

      await usePantryStore.getState().fetchPantry();

      expect(usePantryStore.getState().pantryItems).toEqual([]);
    });
  });

  describe('addItem', () => {
    it('adds item and prepends to state on success', async () => {
      const chain = getChain();
      chain.insert.mockReturnValue(chain);
      chain.select.mockResolvedValue({
        data: [
          {
            id: 'new-1',
            name: 'Milk',
            quantity: 1,
            unit: 'l',
            user_id: 'user-1',
            created_at: '',
            expiry_date: null,
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await usePantryStore.getState().addItem({
        name: 'Milk',
        quantity: 1,
        unit: 'l',
        expiry_date: null,
      });

      expect(result.success).toBe(true);
      expect(usePantryStore.getState().pantryItems[0].name).toBe('Milk');
    });

    it('returns success false and sets error when user not logged in', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await usePantryStore.getState().addItem({
        name: 'Milk',
        quantity: 1,
        unit: 'l',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('logged in');
    });

    it('returns success false on insert error', async () => {
      const chain = getChain();
      chain.insert.mockReturnValue(chain);
      chain.select.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(chain);

      const result = await usePantryStore.getState().addItem({
        name: 'Milk',
        quantity: 1,
        unit: 'l',
      });

      expect(result.success).toBe(false);
      expect(usePantryStore.getState().error).toBe('Insert failed');
    });

    it('updates state immutably (new array reference)', async () => {
      usePantryStore.setState({
        pantryItems: [
          {
            id: '1',
            name: 'Flour',
            quantity: 1,
            unit: 'kg',
            user_id: 'u',
            created_at: '',
            expiry_date: null,
          },
        ],
      });
      const prevItems = usePantryStore.getState().pantryItems;
      const chain = getChain();
      chain.insert.mockReturnValue(chain);
      chain.select.mockResolvedValue({
        data: [
          {
            id: '2',
            name: 'Milk',
            quantity: 1,
            unit: 'l',
            user_id: 'user-1',
            created_at: '',
            expiry_date: null,
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await usePantryStore.getState().addItem({ name: 'Milk', quantity: 1, unit: 'l' });

      expect(usePantryStore.getState().pantryItems).not.toBe(prevItems);
      expect(usePantryStore.getState().pantryItems).toHaveLength(2);
    });
  });

  describe('updateItem', () => {
    it('updates item in state on success', async () => {
      usePantryStore.setState({
        pantryItems: [
          {
            id: '1',
            name: 'Flour',
            quantity: 1,
            unit: 'kg',
            user_id: 'u',
            created_at: '',
            expiry_date: null,
          },
        ],
      });
      const chain = getChain();
      chain.update.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      chain.select.mockResolvedValue({
        data: [
          {
            id: '1',
            name: 'Flour',
            quantity: 2,
            unit: 'kg',
            user_id: 'u',
            created_at: '',
            expiry_date: null,
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await usePantryStore.getState().updateItem('1', { quantity: 2 });

      expect(result.success).toBe(true);
      expect(usePantryStore.getState().pantryItems[0].quantity).toBe(2);
    });

    it('returns success false on update error', async () => {
      const chain = getChain();
      chain.update.mockReturnValue(chain);
      chain.eq.mockReturnValue(chain);
      chain.select.mockResolvedValue({ data: null, error: { message: 'Update failed' } });
      mockFrom.mockReturnValue(chain);

      const result = await usePantryStore.getState().updateItem('99', { name: 'X' });

      expect(result.success).toBe(false);
    });
  });

  describe('deleteItem', () => {
    it('removes item from state on success', async () => {
      usePantryStore.setState({
        pantryItems: [
          {
            id: '1',
            name: 'Flour',
            quantity: 1,
            unit: 'kg',
            user_id: 'u',
            created_at: '',
            expiry_date: null,
          },
        ],
      });
      const chain = getChain();
      chain.delete.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue(chain);

      await usePantryStore.getState().deleteItem('1');

      expect(usePantryStore.getState().pantryItems).toHaveLength(0);
    });

    it('sets error on delete failure', async () => {
      usePantryStore.setState({
        pantryItems: [
          {
            id: '1',
            name: 'Flour',
            quantity: 1,
            unit: 'kg',
            user_id: 'u',
            created_at: '',
            expiry_date: null,
          },
        ],
      });
      const chain = getChain();
      chain.delete.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ error: { message: 'Delete failed' } });
      mockFrom.mockReturnValue(chain);

      await usePantryStore.getState().deleteItem('1');

      expect(usePantryStore.getState().error).toBe('Delete failed');
    });
  });
});
