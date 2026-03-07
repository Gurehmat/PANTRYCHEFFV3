/**
 * Integration test: User adds missing ingredients to shopping list → they appear in shopping list.
 * Supabase is mocked so the flow works without real network.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ShoppingListPage from '../../components/ShoppingListPage';
import { useShoppingListStore } from '../../store/shoppingListStore';

vi.mock('../../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: () =>
        Promise.resolve({
          data: { session: { user: { id: 'test-user-id' }, access_token: 'token' } },
        }),
      getUser: () => Promise.resolve({ data: { user: { id: 'test-user-id' } } }),
    },
    from: vi.fn((table: string) => {
      if (table === 'shopping_list') {
        const newItem = {
          id: 'shop-1',
          user_id: 'test-user-id',
          name: 'Milk',
          quantity: 1,
          unit: 'pc',
          checked: false,
          created_at: new Date().toISOString(),
        };
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockResolvedValue({ data: [newItem], error: null }),
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: null }),
          delete: vi.fn().mockResolvedValue({ error: null }),
        };
      }
      return {};
    }),
  },
}));

describe('Integration: Shopping list flow', () => {
  beforeEach(() => {
    useShoppingListStore.setState({ items: [], error: null });
  });

  it('user adds item to shopping list and it appears', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <ShoppingListPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /shopping list/i })).toBeInTheDocument();
    });
    await user.type(screen.getByPlaceholderText(/add item/i), 'Milk');
    await user.click(screen.getByRole('button', { name: /add/i }));
    await waitFor(() => {
      expect(useShoppingListStore.getState().items.length).toBeGreaterThan(0);
    });
    expect(useShoppingListStore.getState().items[0].name).toBe('Milk');
  });
});
