import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useShoppingListStore } from '../shoppingListStore';

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
  return {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
}

describe('shoppingListStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useShoppingListStore.setState({
      items: [],
      loading: false,
      error: null,
    });
    mockFrom.mockReturnValue(getChain());
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
  });

  describe('initial state', () => {
    it('has correct initial state when reset', () => {
      useShoppingListStore.setState({ items: [], loading: false, error: null });
      expect(useShoppingListStore.getState().items).toEqual([]);
      expect(useShoppingListStore.getState().loading).toBe(false);
      expect(useShoppingListStore.getState().error).toBe(null);
    });
  });

  describe('fetchItems', () => {
    it('sets items on success', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.limit.mockResolvedValue({
        data: [
          {
            id: '1',
            name: 'Milk',
            quantity: 1,
            unit: 'l',
            checked: false,
            user_id: 'u',
            created_at: '',
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      await useShoppingListStore.getState().fetchItems();

      expect(useShoppingListStore.getState().items).toHaveLength(1);
      expect(useShoppingListStore.getState().items[0].name).toBe('Milk');
      expect(useShoppingListStore.getState().loading).toBe(false);
    });

    it('sets error on supabase error', async () => {
      const chain = getChain();
      chain.select.mockReturnValue(chain);
      chain.limit.mockResolvedValue({ data: null, error: { message: 'Fetch failed' } });
      mockFrom.mockReturnValue(chain);

      await useShoppingListStore.getState().fetchItems();

      expect(useShoppingListStore.getState().error).toBe('Fetch failed');
    });
  });

  describe('addItem', () => {
    it('prepends item to state on success', async () => {
      const chain = getChain();
      chain.insert.mockReturnValue(chain);
      chain.select.mockResolvedValue({
        data: [
          {
            id: 'new-1',
            name: 'Bread',
            quantity: 1,
            unit: 'pc',
            checked: false,
            user_id: 'user-1',
            created_at: '',
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(chain);

      const result = await useShoppingListStore.getState().addItem({
        name: 'Bread',
        quantity: 1,
        unit: 'pc',
      });

      expect(result.success).toBe(true);
      expect(useShoppingListStore.getState().items[0].name).toBe('Bread');
    });

    it('returns success false when user not logged in', async () => {
      mockGetUser.mockResolvedValueOnce({ data: { user: null } });

      const result = await useShoppingListStore.getState().addItem({
        name: 'Bread',
        quantity: 1,
        unit: 'pc',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('logged in');
    });

    it('returns success false on insert error', async () => {
      const chain = getChain();
      chain.insert.mockReturnValue(chain);
      chain.select.mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
      mockFrom.mockReturnValue(chain);

      const result = await useShoppingListStore.getState().addItem({
        name: 'Bread',
        quantity: 1,
        unit: 'pc',
      });

      expect(result.success).toBe(false);
    });
  });

  describe('toggleItem', () => {
    it('updates item checked state optimistically', async () => {
      useShoppingListStore.setState({
        items: [
          {
            id: '1',
            name: 'Milk',
            quantity: 1,
            unit: 'l',
            checked: false,
            user_id: 'u',
            created_at: '',
          },
        ],
      });
      const chain = getChain();
      chain.update.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue(chain);

      await useShoppingListStore.getState().toggleItem('1', true);

      expect(useShoppingListStore.getState().items[0].checked).toBe(true);
    });

    it('reverts on update error', async () => {
      useShoppingListStore.setState({
        items: [
          {
            id: '1',
            name: 'Milk',
            quantity: 1,
            unit: 'l',
            checked: false,
            user_id: 'u',
            created_at: '',
          },
        ],
      });
      const chain = getChain();
      chain.update.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ error: { message: 'Update failed' } });
      mockFrom.mockReturnValue(chain);

      await useShoppingListStore.getState().toggleItem('1', true);

      expect(useShoppingListStore.getState().items[0].checked).toBe(false);
      expect(useShoppingListStore.getState().error).toBe('Update failed');
    });
  });

  describe('deleteItem', () => {
    it('removes item from state', async () => {
      useShoppingListStore.setState({
        items: [
          {
            id: '1',
            name: 'Milk',
            quantity: 1,
            unit: 'l',
            checked: false,
            user_id: 'u',
            created_at: '',
          },
        ],
      });
      const chain = getChain();
      chain.delete.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ error: null });
      mockFrom.mockReturnValue(chain);

      await useShoppingListStore.getState().deleteItem('1');

      expect(useShoppingListStore.getState().items).toHaveLength(0);
    });

    it('sets error on delete failure', async () => {
      useShoppingListStore.setState({
        items: [
          {
            id: '1',
            name: 'Milk',
            quantity: 1,
            unit: 'l',
            checked: false,
            user_id: 'u',
            created_at: '',
          },
        ],
      });
      const chain = getChain();
      chain.delete.mockReturnValue(chain);
      chain.eq.mockResolvedValue({ error: { message: 'Delete failed' } });
      mockFrom.mockReturnValue(chain);

      await useShoppingListStore.getState().deleteItem('1');

      expect(useShoppingListStore.getState().error).toBe('Delete failed');
    });
  });
});
