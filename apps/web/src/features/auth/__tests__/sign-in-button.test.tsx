import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { SignInButton } from '../components/sign-in-button';

vi.mock('next-auth/react', () => {
  return {
    signIn: vi.fn(),
  };
});

import { signIn } from 'next-auth/react';

describe('SignInButton', () => {
  test('renders Google sign-in button', () => {
    render(<SignInButton />);
    expect(screen.getByTestId('sign-in-google')).toBeDefined();
    expect(screen.getByText('Continue with Google')).toBeDefined();
  });

  test('calls next-auth signIn with Google on click', () => {
    render(<SignInButton callbackUrl="/custom-callback" />);
    const button = screen.getByTestId('sign-in-google');
    fireEvent.click(button);

    expect(signIn).toHaveBeenCalledWith('google', { callbackUrl: '/custom-callback' });
  });

  test('enters loading state on click and disables itself', () => {
    // Prevent signIn from redirecting/completing immediately in testing
    vi.mocked(signIn).mockImplementation(() => new Promise(() => {}));

    render(<SignInButton />);
    const button = screen.getByTestId('sign-in-google') as HTMLButtonElement;
    fireEvent.click(button);

    expect(screen.getByText('Signing in...')).toBeDefined();
    expect(button.disabled).toBe(true);
  });
});
