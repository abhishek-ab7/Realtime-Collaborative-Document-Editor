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

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: any) => <span data-testid="badge">{children}</span>,
}));

import { ShareLinkManager } from '../components/share-link-manager';

describe('ShareLinkManager', () => {
  const defaultProps = {
    links: [] as any[],
    isGenerating: false,
    onGenerate: vi
      .fn()
      .mockResolvedValue({ shareUrl: 'http://localhost/share/abc123', id: 'link-1' }),
    onRevokeAll: vi.fn(),
    onCopy: vi.fn(),
    isOwner: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders generate link button for owner', () => {
    render(<ShareLinkManager {...defaultProps} />);

    expect(screen.getByTestId('generate-link-button')).toBeDefined();
    expect(screen.getByTestId('link-permission-select')).toBeDefined();
    expect(screen.getByTestId('link-expiry-select')).toBeDefined();
  });

  test('shows no-access message for non-owner', () => {
    render(<ShareLinkManager {...defaultProps} isOwner={false} />);

    expect(screen.getByTestId('share-link-no-access')).toBeDefined();
    expect(screen.queryByTestId('generate-link-button')).toBeNull();
  });

  test('generates link and shows URL when button clicked', async () => {
    const onGenerate = vi.fn().mockResolvedValue({
      shareUrl: 'http://localhost/share/token123',
      id: 'new-link',
    });
    render(<ShareLinkManager {...defaultProps} onGenerate={onGenerate} />);

    fireEvent.click(screen.getByTestId('generate-link-button'));

    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalledWith('VIEW', 'never');
    });

    await waitFor(() => {
      expect(screen.getByTestId('generated-link-input')).toBeDefined();
    });
  });

  test('shows copy button for generated link', async () => {
    const onGenerate = vi.fn().mockResolvedValue({
      shareUrl: 'http://localhost/share/token123',
      id: 'new-link',
    });
    render(<ShareLinkManager {...defaultProps} onGenerate={onGenerate} />);

    fireEvent.click(screen.getByTestId('generate-link-button'));

    await waitFor(() => {
      expect(screen.getByTestId('copy-link-button')).toBeDefined();
    });
  });

  test('shows revoke all button when there are active links', () => {
    render(
      <ShareLinkManager
        {...defaultProps}
        links={[{ id: 'link-1', permission: 'VIEW', expiresAt: null, createdAt: '2024-01-01' }]}
      />,
    );

    expect(screen.getByTestId('revoke-all-button')).toBeDefined();
  });

  test('calls onRevokeAll when revoke button clicked', () => {
    const onRevokeAll = vi.fn();
    render(
      <ShareLinkManager
        {...defaultProps}
        onRevokeAll={onRevokeAll}
        links={[{ id: 'link-1', permission: 'VIEW', expiresAt: null, createdAt: '2024-01-01' }]}
      />,
    );

    fireEvent.click(screen.getByTestId('revoke-all-button'));
    expect(onRevokeAll).toHaveBeenCalled();
  });

  test('generates link with EDIT permission and 7d expiration', async () => {
    const onGenerate = vi.fn().mockResolvedValue({ shareUrl: 'http://x', id: '1' });
    render(<ShareLinkManager {...defaultProps} onGenerate={onGenerate} />);

    fireEvent.change(screen.getByTestId('link-permission-select'), { target: { value: 'EDIT' } });
    fireEvent.change(screen.getByTestId('link-expiry-select'), { target: { value: '7d' } });
    fireEvent.click(screen.getByTestId('generate-link-button'));

    await waitFor(() => {
      expect(onGenerate).toHaveBeenCalledWith('EDIT', '7d');
    });
  });
});
