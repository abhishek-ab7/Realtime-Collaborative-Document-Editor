/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock UI components
vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className }: any) => <div className={className}>{children}</div>,
  AvatarImage: ({ src, alt }: any) => <img src={src} alt={alt} />,
  AvatarFallback: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

import { CollaboratorList } from '../components/collaborator-list';

describe('CollaboratorList', () => {
  const mockOwner = {
    id: 'owner-1',
    name: 'Alice Owner',
    email: 'alice@test.com',
    avatarUrl: null,
    role: 'OWNER' as const,
  };

  const mockCollaborators = [
    {
      id: 'user-2',
      name: 'Bob Editor',
      email: 'bob@test.com',
      avatarUrl: null,
      role: 'EDITOR' as const,
    },
    {
      id: 'user-3',
      name: 'Charlie Viewer',
      email: 'charlie@test.com',
      avatarUrl: null,
      role: 'VIEWER' as const,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders owner with Owner badge', () => {
    render(
      <CollaboratorList
        owner={mockOwner}
        collaborators={[]}
        isOwner={true}
        onUpdateRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByTestId('collaborator-owner')).toBeDefined();
    expect(screen.getByText('Alice Owner')).toBeDefined();
    expect(screen.getByText('Owner')).toBeDefined();
  });

  test('renders collaborators with their roles', () => {
    render(
      <CollaboratorList
        owner={mockOwner}
        collaborators={mockCollaborators}
        isOwner={false}
        onUpdateRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText('Bob Editor')).toBeDefined();
    expect(screen.getByText('Charlie Viewer')).toBeDefined();
    expect(screen.getByTestId('collaborator-user-2')).toBeDefined();
    expect(screen.getByTestId('collaborator-user-3')).toBeDefined();
  });

  test('shows role dropdowns and remove buttons for owner', () => {
    render(
      <CollaboratorList
        owner={mockOwner}
        collaborators={mockCollaborators}
        isOwner={true}
        onUpdateRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByTestId('role-select-user-2')).toBeDefined();
    expect(screen.getByTestId('remove-user-2')).toBeDefined();
  });

  test('calls onUpdateRole when role is changed', () => {
    const onUpdateRole = vi.fn();

    render(
      <CollaboratorList
        owner={mockOwner}
        collaborators={mockCollaborators}
        isOwner={true}
        onUpdateRole={onUpdateRole}
        onRemove={vi.fn()}
      />,
    );

    const select = screen.getByTestId('role-select-user-2') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'VIEWER' } });

    expect(onUpdateRole).toHaveBeenCalledWith('user-2', 'VIEWER');
  });

  test('calls onRemove when remove button is clicked', () => {
    const onRemove = vi.fn();

    render(
      <CollaboratorList
        owner={mockOwner}
        collaborators={mockCollaborators}
        isOwner={true}
        onUpdateRole={vi.fn()}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByTestId('remove-user-2'));
    expect(onRemove).toHaveBeenCalledWith('user-2');
  });

  test('shows "No collaborators" message when list is empty', () => {
    render(
      <CollaboratorList
        owner={mockOwner}
        collaborators={[]}
        isOwner={true}
        onUpdateRole={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(screen.getByText(/no collaborators yet/i)).toBeDefined();
  });
});
