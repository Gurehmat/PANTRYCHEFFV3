import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import SignUpPage from './SignUpPage';

const mockSignUp = vi.hoisted(() => vi.fn());
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: mockSignUp,
    },
  },
}));

describe('SignUpPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUp.mockResolvedValue({ data: {}, error: null });
  });

  function getSignUpInputs(container: HTMLElement) {
    const email = container.querySelector<HTMLInputElement>('input[type="email"]');
    const passwords = container.querySelectorAll<HTMLInputElement>('input[type="password"]');
    return { email, password: passwords[0], confirmPassword: passwords[1] };
  }

  it('renders sign up form with email, password, confirm password', () => {
    const { container } = render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );
    expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
    const { email, password, confirmPassword } = getSignUpInputs(container);
    expect(email).toBeInTheDocument();
    expect(password).toBeInTheDocument();
    expect(confirmPassword).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
  });

  it('validates password length and shows error', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );
    const { email, password, confirmPassword } = getSignUpInputs(container);
    await user.type(email!, 'test@example.com');
    await user.type(password!, '12345');
    await user.type(confirmPassword!, '12345');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('validates password match and shows error', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );
    const { email, password, confirmPassword } = getSignUpInputs(container);
    await user.type(email!, 'test@example.com');
    await user.type(password!, 'password123');
    await user.type(confirmPassword!, 'password456');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('calls supabase.auth.signUp on valid submit', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );
    const { email, password, confirmPassword } = getSignUpInputs(container);
    await user.type(email!, 'test@example.com');
    await user.type(password!, 'password123');
    await user.type(confirmPassword!, 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(mockSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'test@example.com',
        password: 'password123',
      })
    );
  });

  it('displays error when sign up fails', async () => {
    mockSignUp.mockResolvedValueOnce({ data: {}, error: { message: 'Email already registered' } });
    const user = userEvent.setup();
    const { container } = render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );
    const { email, password, confirmPassword } = getSignUpInputs(container);
    await user.type(email!, 'existing@example.com');
    await user.type(password!, 'password123');
    await user.type(confirmPassword!, 'password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/email already registered/i)).toBeInTheDocument();
  });
});
