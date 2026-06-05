/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/input', () => ({
  Input: (props: any) => <input {...props} />,
}));

import { InviteForm } from '../components/invite-form';

describe('InviteForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders email input, role selector, and invite button', () => {
    render(<InviteForm onInvite={vi.fn()} />);

    expect(screen.getByTestId('invite-email-input')).toBeDefined();
    expect(screen.getByTestId('invite-role-select')).toBeDefined();
    expect(screen.getByTestId('invite-button')).toBeDefined();
  });

  test('shows error for invalid email format', async () => {
    const onInvite = vi.fn();
    render(<InviteForm onInvite={onInvite} />);

    const emailInput = screen.getByTestId('invite-email-input');
    fireEvent.change(emailInput, { target: { value: 'not-an-email' } });
    fireEvent.submit(screen.getByTestId('invite-form'));

    await waitFor(() => {
      expect(screen.getByTestId('invite-error')).toBeDefined();
      expect(screen.getByText(/valid email/i)).toBeDefined();
    });

    expect(onInvite).not.toHaveBeenCalled();
  });

  test('shows error for empty email', async () => {
    const onInvite = vi.fn();
    render(<InviteForm onInvite={onInvite} />);

    fireEvent.submit(screen.getByTestId('invite-form'));

    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeDefined();
    });

    expect(onInvite).not.toHaveBeenCalled();
  });

  test('calls onInvite with correct email and role on valid submit', async () => {
    const onInvite = vi.fn().mockResolvedValue(true);
    render(<InviteForm onInvite={onInvite} />);

    const emailInput = screen.getByTestId('invite-email-input');
    const roleSelect = screen.getByTestId('invite-role-select');

    fireEvent.change(emailInput, { target: { value: 'bob@test.com' } });
    fireEvent.change(roleSelect, { target: { value: 'VIEWER' } });
    fireEvent.submit(screen.getByTestId('invite-form'));

    await waitFor(() => {
      expect(onInvite).toHaveBeenCalledWith('bob@test.com', 'VIEWER');
    });
  });

  test('clears email input on successful invite', async () => {
    const onInvite = vi.fn().mockResolvedValue(true);
    render(<InviteForm onInvite={onInvite} />);

    const emailInput = screen.getByTestId('invite-email-input') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'bob@test.com' } });
    fireEvent.submit(screen.getByTestId('invite-form'));

    await waitFor(() => {
      expect(emailInput.value).toBe('');
    });
  });

  test('does not clear email on failed invite', async () => {
    const onInvite = vi.fn().mockResolvedValue(false);
    render(<InviteForm onInvite={onInvite} />);

    const emailInput = screen.getByTestId('invite-email-input') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'bob@test.com' } });
    fireEvent.submit(screen.getByTestId('invite-form'));

    await waitFor(() => {
      expect(emailInput.value).toBe('bob@test.com');
    });
  });
});
