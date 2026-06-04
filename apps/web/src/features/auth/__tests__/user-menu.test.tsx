import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { UserMenu } from '../components/user-menu';

vi.mock('next-auth/react', () => {
  return {
    signOut: vi.fn(),
    useSession: vi.fn(),
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
    AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
    AvatarFallback: ({ children }: any) => <span>{children}</span>,
  };
});

import { useSession, signOut } from 'next-auth/react';

describe('UserMenu', () => {
  test('returns null when not authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: null,
      status: 'unauthenticated',
    } as any);

    const { container } = render(<UserMenu />);
    expect(container.firstChild).toBeNull();
  });

  test('renders user avatar when authenticated', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          image: 'https://example.com/jane.png',
        },
      },
      status: 'authenticated',
    } as any);

    render(<UserMenu />);

    expect(screen.getByTestId('avatar')).toBeDefined();
    const img = screen.getByAltText('Jane Doe');
    expect(img).toBeDefined();
    expect(img.getAttribute('src')).toBe('https://example.com/jane.png');
  });

  test('renders user name and email inside dropdown', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          image: 'https://example.com/jane.png',
        },
      },
      status: 'authenticated',
    } as any);

    render(<UserMenu />);

    expect(screen.getByText('Jane Doe')).toBeDefined();
    expect(screen.getByText('jane@example.com')).toBeDefined();
  });

  test('calls signOut when clicking sign out button', () => {
    vi.mocked(useSession).mockReturnValue({
      data: {
        user: {
          name: 'Jane Doe',
          email: 'jane@example.com',
          image: 'https://example.com/jane.png',
        },
      },
      status: 'authenticated',
    } as any);

    render(<UserMenu />);

    const signOutBtn = screen.getByText('Sign out');
    fireEvent.click(signOutBtn);

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/signin' });
  });
});
