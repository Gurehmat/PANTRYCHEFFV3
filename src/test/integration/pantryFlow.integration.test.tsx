/**
 * Integration test: User adds a pantry item → item appears in pantry list.
 * MSW handlers (handlers.ts) mock Supabase REST API; this test uses a vi.mock of supabase
 * that simulates the same responses so the full flow works without real network.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import PantryPage from '../../components/PantryPage';
import { usePantryStore } from '../../store/pantryStore';

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
      if (table === 'pantry_items') {
        const insertedRow = {
          id: 'mock-pantry-1',
          user_id: 'test-user-id',
          name: 'Milk',
          quantity: 1,
          unit: 'pcs',
          expiry_date: null,
          created_at: new Date().toISOString(),
        };
        return {
          select: vi.fn(function (this: unknown) {
            return {
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
              then: (resolve: (v: unknown) => void) =>
                Promise.resolve({ data: [], error: null }).then(resolve),
            };
          }),
          insert: vi.fn(function (this: unknown) {
            return {
              select: vi.fn().mockResolvedValue({
                data: [insertedRow],
                error: null,
              }),
            };
          }),
        };
      }
      return {};
    }),
  },
}));

describe('Integration: Pantry flow', () => {
  beforeEach(() => {
    usePantryStore.setState({ pantryItems: [], error: null });
  });

  it('user adds a pantry item and it appears in the pantry list', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <PantryPage />
      </MemoryRouter>
    );
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /add new item/i })).toBeInTheDocument();
    });
    const nameInput = screen.getByPlaceholderText(/avocados/i);
    await user.type(nameInput, 'Milk');
    await user.click(screen.getByRole('button', { name: /add to pantry/i }));
    await waitFor(() => {
      expect(usePantryStore.getState().pantryItems.length).toBeGreaterThan(0);
    });
    expect(usePantryStore.getState().pantryItems[0].name).toBe('Milk');
  });
});
