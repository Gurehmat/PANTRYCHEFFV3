import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ShoppingListPage from './ShoppingListPage';

const mockFetchItems = vi.hoisted(() => vi.fn());
const mockAddItem = vi.hoisted(() => vi.fn());
const mockToggleItem = vi.hoisted(() => vi.fn());
const mockDeleteItem = vi.hoisted(() => vi.fn());
const useShoppingListStoreMock = vi.hoisted(() => vi.fn());
vi.mock('../store/shoppingListStore', () => ({
  useShoppingListStore: useShoppingListStoreMock,
}));
const defaultStoreState = () => ({
  items: [] as {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    checked: boolean;
    user_id: string;
    created_at: string;
  }[],
  fetchItems: mockFetchItems,
  addItem: mockAddItem,
  toggleItem: mockToggleItem,
  deleteItem: mockDeleteItem,
  loading: false,
});

describe('ShoppingListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useShoppingListStoreMock.mockImplementation(() => defaultStoreState());
  });

  it('renders shopping list title and add form', () => {
    render(<ShoppingListPage />);
    expect(screen.getByRole('heading', { name: /shopping list/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/add item/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('handles empty state', () => {
    render(<ShoppingListPage />);
    expect(screen.getByText(/no items in your shopping list/i)).toBeInTheDocument();
  });

  it('calls addItem when form submitted with item name', async () => {
    mockAddItem.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<ShoppingListPage />);
    await user.type(screen.getByPlaceholderText(/add item/i), 'Milk');
    await user.click(screen.getByRole('button', { name: /add/i }));
    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Milk', quantity: 1, unit: 'pc' })
    );
  });

  it('does not add when input is empty', async () => {
    const user = userEvent.setup();
    render(<ShoppingListPage />);
    await user.click(screen.getByRole('button', { name: /add/i }));
    expect(mockAddItem).not.toHaveBeenCalled();
  });

  it('renders items when store has items', () => {
    useShoppingListStoreMock.mockReturnValue({
      ...defaultStoreState(),
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
    render(<ShoppingListPage />);
    expect(screen.getByText('Milk')).toBeInTheDocument();
  });
});
