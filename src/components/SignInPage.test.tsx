import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignInPage from './SignInPage';

const mockSignIn = vi.hoisted(() => vi.fn());
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
    },
  },
}));

describe('SignInPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue({ data: {}, error: null });
  });

  function getSignInInputs(container: HTMLElement) {
    const email = container.querySelector<HTMLInputElement>('input[type="email"]');
    const password = container.querySelector<HTMLInputElement>('input[type="password"]');
    return { email, password };
  }

  it('renders sign in form with email and password', () => {
    const { container } = render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    const { email, password } = getSignInInputs(container);
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls supabase.auth.signInWithPassword on submit', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );
    const { email, password } = getSignInInputs(container);
    await user.type(email!, 'test@example.com');
    await user.type(password!, 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockSignIn).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('displays error message when sign in fails', async () => {
    mockSignIn.mockResolvedValueOnce({ data: {}, error: { message: 'Invalid credentials' } });
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );
    const { email, password } = getSignInInputs(container);
    await user.type(email!, 'test@example.com');
    await user.type(password!, 'wrong');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('has required and validation on inputs', () => {
    const { container } = render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );
    const { email, password } = getSignInInputs(container);
    expect(email).toBeRequired();
    expect(password).toBeRequired();
    expect(password).toHaveAttribute('minLength', '6');
  });
});
