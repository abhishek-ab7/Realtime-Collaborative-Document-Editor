/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock the hooks
vi.mock('../hooks/use-collaborators', () => ({
  useCollaborators: vi.fn(() => ({
    owner: {
      id: 'owner-1',
      name: 'Alice',
      email: 'alice@test.com',
      avatarUrl: null,
      role: 'OWNER',
    },
    collaborators: [
      { id: 'user-2', name: 'Bob', email: 'bob@test.com', avatarUrl: null, role: 'EDITOR' },
    ],
    isLoading: false,
    addCollaborator: vi.fn(),
    updateRole: vi.fn(),
    removeCollaborator: vi.fn(),
    refresh: vi.fn(),
  })),
}));

vi.mock('../hooks/use-share-link', () => ({
  useShareLink: vi.fn(() => ({
    links: [],
    isGenerating: false,
    generateLink: vi.fn(),
    revokeAll: vi.fn(),
    copyToClipboard: vi.fn(),
    refresh: vi.fn(),
  })),
}));

// Mock UI components
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogDescription: ({ children }: any) => <p>{children}</p>,
}));

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => (
    <div data-testid="tabs" data-default={defaultValue}>
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid={`tab-${value}`}>{children}</button>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tab-content-${value}`}>{children}</div>
  ),
}));

vi.mock('../components/collaborator-list', () => ({
  CollaboratorList: () => <div data-testid="collaborator-list-component" />,
}));

vi.mock('../components/invite-form', () => ({
  InviteForm: () => <div data-testid="invite-form-component" />,
}));

vi.mock('../components/share-link-manager', () => ({
  ShareLinkManager: () => <div data-testid="share-link-manager-component" />,
}));

import { ShareDialog } from '../components/share-dialog';

describe('ShareDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders dialog with People and Link tabs when open', () => {
    render(
      <ShareDialog documentId="doc-1" isOpen={true} onClose={vi.fn()} currentUserRole="OWNER" />,
    );

    expect(screen.getByTestId('dialog')).toBeDefined();
    expect(screen.getByTestId('tab-people')).toBeDefined();
    expect(screen.getByTestId('tab-link')).toBeDefined();
  });

  test('does not render when closed', () => {
    render(
      <ShareDialog documentId="doc-1" isOpen={false} onClose={vi.fn()} currentUserRole="OWNER" />,
    );

    expect(screen.queryByTestId('dialog')).toBeNull();
  });

  test('renders invite form for owner in People tab', () => {
    render(
      <ShareDialog documentId="doc-1" isOpen={true} onClose={vi.fn()} currentUserRole="OWNER" />,
    );

    expect(screen.getByTestId('invite-form-component')).toBeDefined();
  });

  test('renders collaborator list in People tab', () => {
    render(
      <ShareDialog documentId="doc-1" isOpen={true} onClose={vi.fn()} currentUserRole="OWNER" />,
    );

    expect(screen.getByTestId('collaborator-list-component')).toBeDefined();
  });

  test('renders share link manager in Link tab', () => {
    render(
      <ShareDialog documentId="doc-1" isOpen={true} onClose={vi.fn()} currentUserRole="OWNER" />,
    );

    expect(screen.getByTestId('share-link-manager-component')).toBeDefined();
  });
});
