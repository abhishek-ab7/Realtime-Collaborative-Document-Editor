/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { VersionPanel } from '../components/version-history/version-panel';
import { VersionDiffViewer } from '../components/version-history/version-diff';

// Mock UI Components to prevent Radix UI portal issues in test environment
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) =>
    open ? <div data-testid="mock-dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div data-testid="mock-dialog-content">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="mock-dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="mock-dialog-title">{children}</div>,
  DialogDescription: ({ children }: any) => (
    <div data-testid="mock-dialog-description">{children}</div>
  ),
}));

vi.mock('@/components/ui/scroll-area', () => ({
  ScrollArea: ({ children }: any) => <div data-testid="mock-scroll-area">{children}</div>,
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: any) => <div data-testid="mock-avatar">{children}</div>,
  AvatarFallback: ({ children }: any) => <span data-testid="mock-avatar-fallback">{children}</span>,
  AvatarImage: ({ src }: any) => <img data-testid="mock-avatar-image" src={src} alt="" />,
}));

// Mock SWR for VersionDiffViewer
vi.mock('swr', () => ({
  default: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

import useSWR from 'swr';

describe('Version History Components', () => {
  const mockVersions = [
    {
      id: 'ver-1',
      versionNum: 1,
      titleAtTime: 'First Draft',
      wordCount: 15,
      trigger: 'MANUAL',
      createdAt: '2026-06-01T12:00:00.000Z',
      creator: {
        name: 'Alice Builder',
        email: 'alice@example.com',
        avatarUrl: 'http://avatar/alice',
      },
    },
    {
      id: 'ver-2',
      versionNum: 2,
      titleAtTime: 'Second Draft',
      wordCount: 35,
      trigger: 'AUTO',
      createdAt: '2026-06-02T15:30:00.000Z',
      creator: { name: null, email: 'bob@example.com', avatarUrl: null },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('VersionPanel', () => {
    const defaultProps = {
      documentId: 'doc-123',
      isOpen: true,
      onClose: vi.fn(),
      versions: mockVersions as any,
      isLoading: false,
      onCreateManualVersion: vi.fn(),
      onRestoreVersion: vi.fn(),
    };

    test('renders null when isOpen is false', () => {
      const { container } = render(<VersionPanel {...defaultProps} isOpen={false} />);
      expect(container.firstChild).toBeNull();
    });

    test('renders loading state', () => {
      render(<VersionPanel {...defaultProps} isLoading={true} />);
      expect(screen.getByText('Loading...')).toBeDefined();
    });

    test('renders empty state when versions list is empty', () => {
      render(<VersionPanel {...defaultProps} versions={[]} />);
      expect(screen.getByText('No versions yet')).toBeDefined();
      expect(screen.getByText("Keep typing! We'll auto-save versions over time.")).toBeDefined();
    });

    test('renders version items and their triggers/names/emails', () => {
      render(<VersionPanel {...defaultProps} />);

      // Title & version markers
      expect(screen.getByText('Version History')).toBeDefined();
      expect(screen.getByText('Version 1')).toBeDefined();
      expect(screen.getByText('Version 2')).toBeDefined();

      // Creators info
      expect(screen.getByText('Alice Builder')).toBeDefined();
      expect(screen.getByText('bob@example.com')).toBeDefined();

      // Trigger tags
      expect(screen.getByText('Manual')).toBeDefined();
      expect(screen.getByText('Auto')).toBeDefined();
    });

    test('calls onClose when clicking close button', () => {
      render(<VersionPanel {...defaultProps} />);
      const closeBtn = screen.getByRole('button', { name: '' }); // The X icon button
      // X button has X class or wraps svg, let's find it by class or test-id if present.
      // It has onClose callback. Let's find button.
      const buttons = screen.getAllByRole('button');
      // The first button in the panel is the Close button (variant ghost, size icon)
      fireEvent.click(buttons[0]);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    test('calls onCreateManualVersion when clicking save button', () => {
      render(<VersionPanel {...defaultProps} />);
      const saveBtn = screen.getByText('Save Current Version');
      fireEvent.click(saveBtn);
      expect(defaultProps.onCreateManualVersion).toHaveBeenCalled();
    });

    test('expands version info on click and handles restore/preview', () => {
      const mockConfirm = vi.spyOn(window, 'confirm');
      mockConfirm.mockReturnValue(true);

      const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

      render(<VersionPanel {...defaultProps} />);

      // Click the first version to select it
      const ver1Item = screen.getByText('Version 1').closest('div')!;
      fireEvent.click(ver1Item);

      // Verify the details are shown
      expect(screen.getByText('15 words')).toBeDefined();

      // Click Preview & Diff
      const previewBtn = screen.getByText('Preview & Diff');
      fireEvent.click(previewBtn);
      expect(dispatchEventSpy).toHaveBeenCalled();
      const lastCallEvent = dispatchEventSpy.mock.calls[0][0] as CustomEvent;
      expect(lastCallEvent.type).toBe('open-diff-viewer');
      expect(lastCallEvent.detail.id).toBe('ver-1');

      // Click Restore button (available on expanded ver-1 since index !== 0 is true?
      // Wait, in our component: {index !== 0 && ( <Button>Restore</Button> )}
      // ver-1 is index 0 in the mock array, so Restore button shouldn't be rendered for it.
      expect(screen.queryByText('Restore')).toBeNull();

      // Let's expand ver-2 (index 1) which should have the Restore button
      const ver2Item = screen.getByText('Version 2').closest('div')!;
      fireEvent.click(ver2Item);
      expect(screen.getByText('35 words')).toBeDefined();

      const restoreBtn = screen.getByText('Restore');
      fireEvent.click(restoreBtn);

      expect(mockConfirm).toHaveBeenCalled();
      expect(defaultProps.onRestoreVersion).toHaveBeenCalledWith('ver-2');

      mockConfirm.mockRestore();
      dispatchEventSpy.mockRestore();
    });

    test('handles cancel in confirm restore dialog', () => {
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

      render(<VersionPanel {...defaultProps} />);

      const ver2Item = screen.getByText('Version 2').closest('div')!;
      fireEvent.click(ver2Item);

      const restoreBtn = screen.getByText('Restore');
      fireEvent.click(restoreBtn);

      expect(mockConfirm).toHaveBeenCalled();
      expect(defaultProps.onRestoreVersion).not.toHaveBeenCalled();

      mockConfirm.mockRestore();
    });
  });

  describe('VersionDiffViewer', () => {
    const defaultProps = {
      documentId: 'doc-123',
      version: mockVersions[0] as any,
      onClose: vi.fn(),
      onRestore: vi.fn(),
    };

    test('renders nothing when version is null', () => {
      const { container } = render(<VersionDiffViewer {...defaultProps} version={null} />);
      // Should show mock-dialog but closed, wait, mock-dialog is null if open is false.
      expect(screen.queryByTestId('mock-dialog')).toBeNull();
    });

    test('renders loading spinner state', () => {
      vi.mocked(useSWR).mockReturnValue({ data: undefined, isLoading: true } as any);
      render(<VersionDiffViewer {...defaultProps} />);
      expect(screen.getByTestId('mock-dialog')).toBeDefined();
      // Spinner div is rendered
      expect(screen.getByTestId('mock-dialog').querySelector('.animate-spin')).toBeDefined();
    });

    test('renders diff parts correctly', () => {
      const mockDiff = [
        { value: 'Hello ', added: undefined, removed: undefined },
        { value: 'brave ', added: true, removed: undefined },
        { value: 'old ', added: undefined, removed: true },
        { value: 'world!', added: undefined, removed: undefined },
      ];
      vi.mocked(useSWR).mockReturnValue({ data: { diff: mockDiff }, isLoading: false } as any);

      render(<VersionDiffViewer {...defaultProps} />);

      expect(screen.getByText('Hello', { exact: false })).toBeDefined();
      expect(screen.getByText('brave', { exact: false })).toBeDefined();
      expect(screen.getByText('old', { exact: false })).toBeDefined();
      expect(screen.getByText('world!', { exact: false })).toBeDefined();

      // Check specific element tag/classes
      const braveSpan = screen.getByText('brave', { exact: false });
      expect(braveSpan.className).toContain('bg-emerald-100');

      const oldDel = screen.getByText('old', { exact: false });
      expect(oldDel.tagName).toBe('DEL');
      expect(oldDel.className).toContain('bg-rose-100');
    });

    test('renders failure message when SWR yields no data', () => {
      vi.mocked(useSWR).mockReturnValue({ data: undefined, isLoading: false } as any);
      render(<VersionDiffViewer {...defaultProps} />);
      expect(screen.getByText('Failed to load diff')).toBeDefined();
    });

    test('triggers onRestore callback upon confirmation', () => {
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
      vi.mocked(useSWR).mockReturnValue({ data: { diff: [] }, isLoading: false } as any);

      render(<VersionDiffViewer {...defaultProps} />);

      const restoreBtn = screen.getByText('Restore this version');
      fireEvent.click(restoreBtn);

      expect(mockConfirm).toHaveBeenCalled();
      expect(defaultProps.onRestore).toHaveBeenCalledWith('ver-1');
      expect(defaultProps.onClose).toHaveBeenCalled();

      mockConfirm.mockRestore();
    });

    test('does not trigger onRestore if confirmation canceled', () => {
      const mockConfirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
      vi.mocked(useSWR).mockReturnValue({ data: { diff: [] }, isLoading: false } as any);

      render(<VersionDiffViewer {...defaultProps} />);

      const restoreBtn = screen.getByText('Restore this version');
      fireEvent.click(restoreBtn);

      expect(mockConfirm).toHaveBeenCalled();
      expect(defaultProps.onRestore).not.toHaveBeenCalled();
      expect(defaultProps.onClose).not.toHaveBeenCalled();

      mockConfirm.mockRestore();
    });

    test('triggers onClose when clicking cancel', () => {
      vi.mocked(useSWR).mockReturnValue({ data: { diff: [] }, isLoading: false } as any);
      render(<VersionDiffViewer {...defaultProps} />);

      const cancelBtn = screen.getByText('Cancel');
      fireEvent.click(cancelBtn);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});
