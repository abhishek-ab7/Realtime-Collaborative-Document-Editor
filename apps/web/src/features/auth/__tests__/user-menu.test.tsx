/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { UserMenu } from '../components/user-menu';

const mockSignOut = vi.fn().mockResolvedValue({});
const mockPush = vi.fn();

vi.mock('@/features/auth/hooks/use-session', () => {
  return {
    useTypedSession: vi.fn(),
  };
});

vi.mock('@/utils/supabase/client', () => {
  return {
    createClient: vi.fn(() => ({
      auth: {
        signOut: mockSignOut,
      },
    })),
  };
});

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

vi.mock('@/components/ui/dropdown-menu', () => {
  return {
    DropdownMenu: ({ children }: any) => <div>{children}</div>,
    DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
    DropdownMenuContent: ({ children }: any) => (
      <div data-testid="dropdown-content">{children}</div>
    ),
    DropdownMenuItem: ({ children, onClick, className }: any) => (
      <button onClick={onClick} className={className} data-testid="dropdown-item">
        {children}
      </button>
    ),
    DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
    DropdownMenuSeparator: () => <hr />,
  };
});

vi.mock('@/components/ui/avatar', () => {
  return {
    Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,

    AvatarImage: ({ src, alt }: any) => React.createElement('img', { src, alt }),
    AvatarFallback: ({ children }: any) => <span>{children}</span>,
  };
});

import { useTypedSession } from '@/features/auth/hooks/use-session';

describe('UserMenu', () => {
  test('returns null when not authenticated', () => {
    vi.mocked(useTypedSession).mockReturnValue({
      user: undefined,
      isAuthenticated: false,
      isLoading: false,
      data: null,
    });

    const { container } = render(<UserMenu />);
    expect(container.firstChild).toBeNull();
  });

  test('renders user avatar when authenticated', () => {
    vi.mocked(useTypedSession).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: 'https://example.com/jane.png',
      },
      isAuthenticated: true,
      isLoading: false,
      data: {} as any,
    });

    render(<UserMenu />);

    expect(screen.getByTestId('avatar')).toBeDefined();
    const img = screen.getByAltText('Jane Doe');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://example.com/jane.png');
  });

  test('renders user name and email inside dropdown', () => {
    vi.mocked(useTypedSession).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: 'https://example.com/jane.png',
      },
      isAuthenticated: true,
      isLoading: false,
      data: {} as any,
    });

    render(<UserMenu />);

    expect(screen.getByText('Jane Doe')).toBeDefined();
    expect(screen.getByText('jane@example.com')).toBeDefined();
  });

  test('calls signOut and router.push when clicking sign out button', async () => {
    vi.mocked(useTypedSession).mockReturnValue({
      user: {
        id: 'user-1',
        name: 'Jane Doe',
        email: 'jane@example.com',
        image: 'https://example.com/jane.png',
      },
      isAuthenticated: true,
      isLoading: false,
      data: {} as any,
    });

    render(<UserMenu />);

    const signOutBtn = screen.getByText('Sign out');
    await fireEvent.click(signOutBtn);

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/signin');
  });
});
