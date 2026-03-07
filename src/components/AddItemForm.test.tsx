import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddItemForm from './AddItemForm';

const mockAddItem = vi.hoisted(() => vi.fn());
vi.mock('../store/pantryStore', () => ({
  usePantryStore: (selector: (state: { addItem: typeof mockAddItem }) => unknown) => {
    const state = { addItem: mockAddItem };
    return typeof selector === 'function' ? selector(state) : state;
  },
}));

describe('AddItemForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAddItem.mockResolvedValue({ success: true });
  });

  it('renders all form fields', () => {
    render(<AddItemForm />);
    expect(screen.getByRole('heading', { name: /add new item/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/avocados/i)).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add to pantry/i })).toBeInTheDocument();
  });

  it('validates required name field', async () => {
    render(<AddItemForm />);
    const nameInput = screen.getByPlaceholderText(/avocados/i);
    expect(nameInput).toBeRequired();
  });

  it('calls addItem with correct data on submit', async () => {
    const user = userEvent.setup();
    render(<AddItemForm />);
    await user.type(screen.getByPlaceholderText(/avocados/i), 'Milk');
    await user.type(screen.getByRole('spinbutton'), '2');
    await user.selectOptions(screen.getByRole('combobox'), 'l');
    await user.click(screen.getByRole('button', { name: /add to pantry/i }));

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Milk',
          quantity: 2,
          unit: 'l',
        })
      );
    });
  });

  it('clears form after successful submit', async () => {
    const user = userEvent.setup();
    render(<AddItemForm />);
    await user.type(screen.getByPlaceholderText(/avocados/i), 'Bread');
    await user.click(screen.getByRole('button', { name: /add to pantry/i }));

    await waitFor(() => {
      expect(mockAddItem).toHaveBeenCalled();
    });
    expect(screen.getByPlaceholderText(/avocados/i)).toHaveValue('');
    expect(screen.getByRole('spinbutton')).toHaveValue(null);
  });

  it('does not submit when name is empty', async () => {
    const user = userEvent.setup();
    render(<AddItemForm />);
    await user.type(screen.getByRole('spinbutton'), '1');
    await user.click(screen.getByRole('button', { name: /add to pantry/i }));
    expect(mockAddItem).not.toHaveBeenCalled();
  });
});
