/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock TipTap hooks and components
vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(),
  EditorContent: ({ editor }: any) => (
    <div data-testid="editor-content" data-editor-exists={!!editor} />
  ),
  BubbleMenu: ({ children }: any) => <div data-testid="bubble-menu">{children}</div>,
}));

vi.mock('../hooks/use-editor', () => ({
  useDocumentEditor: vi.fn(),
}));

vi.mock('../components/editor-toolbar', () => ({
  EditorToolbar: ({ editor }: any) => (
    <div data-testid="editor-toolbar" data-editor-exists={!!editor} />
  ),
}));

vi.mock('../components/editor-bubble-menu', () => ({
  EditorBubbleMenu: () => <div data-testid="editor-bubble-menu" />,
}));

vi.mock('../components/word-count', () => ({
  WordCount: ({ editor }: any) => <div data-testid="word-count" data-editor-exists={!!editor} />,
}));

import { Editor } from '../components/editor';
import { useDocumentEditor } from '../hooks/use-editor';

describe('Editor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders editor container', () => {
    vi.mocked(useDocumentEditor).mockReturnValue(null as any);

    render(<Editor />);

    expect(screen.getByTestId('editor-container')).toBeDefined();
  });

  test('renders toolbar when editable', () => {
    vi.mocked(useDocumentEditor).mockReturnValue({ id: 'mock-editor' } as any);

    render(<Editor editable={true} />);

    expect(screen.getByTestId('editor-toolbar')).toBeDefined();
  });

  test('does not render toolbar when read-only', () => {
    vi.mocked(useDocumentEditor).mockReturnValue({ id: 'mock-editor' } as any);

    render(<Editor editable={false} />);

    expect(screen.queryByTestId('editor-toolbar')).toBeNull();
  });

  test('calls onUpdate when content changes', () => {
    const onUpdate = vi.fn();
    vi.mocked(useDocumentEditor).mockImplementation(({ onUpdate } = {}) => {
      // Simulate calling onUpdate
      if (onUpdate) onUpdate();
      return null as any;
    });

    render(<Editor onUpdate={onUpdate} />);

    expect(useDocumentEditor).toHaveBeenCalledWith(expect.objectContaining({ onUpdate }));
  });

  test('renders word count footer when editable', () => {
    vi.mocked(useDocumentEditor).mockReturnValue({ id: 'mock-editor' } as any);

    render(<Editor editable={true} />);

    expect(screen.getByTestId('word-count')).toBeDefined();
  });
});
