/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { DocumentCard } from '../components/document-card';

const mockPush = vi.fn();
vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

vi.mock('../components/document-context-menu', () => {
  return {
    DocumentContextMenu: ({ children }: any) => (
      <div data-testid="context-menu-wrapper">{children}</div>
    ),
  };
});

vi.mock('@/components/ui/avatar', () => {
  return {
    Avatar: ({ children }: any) => <div data-testid="avatar">{children}</div>,

    AvatarImage: ({ src, alt }: any) => React.createElement('img', { src, alt }),
    AvatarFallback: ({ children }: any) => <span>{children}</span>,
  };
});

vi.mock('@/components/ui/user-avatar', () => {
  return {
    UserAvatar: ({ src, name }: any) => React.createElement('img', { src, alt: name }),
  };
});

vi.mock('@/components/ui/tooltip', () => {
  return {
    TooltipProvider: ({ children }: any) => <div>{children}</div>,
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipTrigger: ({ children }: any) => <div>{children}</div>,
    TooltipContent: ({ children }: any) => <div>{children}</div>,
  };
});

describe('DocumentCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultProps = {
    id: 'doc-1',
    title: 'Q3 Strategy Presentation',
    isStarred: false,
    updatedAt: new Date('2026-06-01T12:00:00Z'),
    lastAccessedAt: new Date('2026-06-03T12:00:00Z'),
    collaboratorCount: 2,
    owner: { name: 'Alice Smith', avatarUrl: 'https://example.com/alice.png' },
    onStar: vi.fn(),
    onRename: vi.fn(),
    onTrash: vi.fn(),
    onDuplicate: vi.fn(),
  };

  test('renders document title and owner avatar', () => {
    render(<DocumentCard {...defaultProps} />);

    expect(screen.getByText('Q3 Strategy Presentation')).toBeDefined();
    expect(screen.getByText('2 collaborators')).toBeDefined();

    const avatarImg = screen.getByAltText('Alice Smith');
    expect(avatarImg).toBeDefined();
    expect(avatarImg.getAttribute('src')).toBe('https://example.com/alice.png');
  });

  test('navigates to document editor on click when active', () => {
    render(<DocumentCard {...defaultProps} />);

    const card = screen.getByTestId('document-card-doc-1');
    fireEvent.click(card);

    expect(mockPush).toHaveBeenCalledWith('/d/doc-1');
  });

  test('does not navigate to editor on click when in trash', () => {
    render(<DocumentCard {...defaultProps} isTrashedPage={true} />);

    const card = screen.getByTestId('document-card-doc-1');
    fireEvent.click(card);

    expect(mockPush).not.toHaveBeenCalledWith('/d/doc-1');
  });

  test('calls onStar callback when star clicked', () => {
    render(<DocumentCard {...defaultProps} />);

    const starBtn = screen.getByTestId('star-doc-1');
    fireEvent.click(starBtn);

    expect(defaultProps.onStar).toHaveBeenCalledWith('doc-1', true);
  });
});
