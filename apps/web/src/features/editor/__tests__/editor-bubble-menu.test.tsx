/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ─── Mock all @tiptap/react hooks ───
const mockEditorState = {
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrike: false,
  isHighlight: false,
  isCode: false,
  isLink: false,
  isEmpty: false,
  link: '',
};

vi.mock('@tiptap/react', () => ({
  useEditorState: vi.fn(() => mockEditorState),
}));

// Mock createPortal to render inline for easier testing
vi.mock('react-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-dom')>();
  return {
    ...actual,

    createPortal: (children: React.ReactNode) => children,
  };
});

vi.mock('../components/link-dialog', () => ({
  LinkDialog: ({ open }: { open: boolean }) => (open ? <div data-testid="link-dialog" /> : null),
}));

import { EditorBubbleMenu } from '../components/editor-bubble-menu';
import { useEditorState } from '@tiptap/react';

function createMockEditor() {
  const chainResult = {
    focus: vi.fn().mockReturnThis(),
    toggleBold: vi.fn().mockReturnThis(),
    toggleItalic: vi.fn().mockReturnThis(),
    toggleUnderline: vi.fn().mockReturnThis(),
    toggleStrike: vi.fn().mockReturnThis(),
    toggleHighlight: vi.fn().mockReturnThis(),
    toggleCode: vi.fn().mockReturnThis(),
    extendMarkRange: vi.fn().mockReturnThis(),
    setLink: vi.fn().mockReturnThis(),
    unsetLink: vi.fn().mockReturnThis(),
    run: vi.fn(),
  };
  return {
    chain: vi.fn(() => chainResult),
    isActive: vi.fn().mockReturnValue(false),
    getAttributes: vi.fn().mockReturnValue({}),
    state: { selection: { empty: false, from: 0, to: 5 } },
    view: { coordsAtPos: vi.fn(() => ({ top: 100, left: 100 })) },
    on: vi.fn(),
    off: vi.fn(),
  };
}

describe('EditorBubbleMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default state (non-empty selection)
    vi.mocked(useEditorState).mockReturnValue({
      isBold: false,
      isItalic: false,
      isUnderline: false,
      isStrike: false,
      isHighlight: false,
      isCode: false,
      isLink: false,
      isEmpty: false,
      link: '',
    } as any);
  });

  test('renders bubble menu with formatting buttons when selection is active', () => {
    const editor = createMockEditor();
    render(<EditorBubbleMenu editor={editor as any} />);

    expect(screen.getByTestId('bubble-menu')).toBeDefined();
    expect(screen.getByTestId('bubble-bold')).toBeDefined();
    expect(screen.getByTestId('bubble-italic')).toBeDefined();
    expect(screen.getByTestId('bubble-underline')).toBeDefined();
    expect(screen.getByTestId('bubble-link')).toBeDefined();
  });

  test('calls editor chain when bold button is clicked', () => {
    const editor = createMockEditor();
    render(<EditorBubbleMenu editor={editor as any} />);

    fireEvent.click(screen.getByTestId('bubble-bold'));

    expect(editor.chain).toHaveBeenCalled();
  });

  test('opens link dialog when link button is clicked', () => {
    const editor = createMockEditor();
    render(<EditorBubbleMenu editor={editor as any} />);

    fireEvent.click(screen.getByTestId('bubble-link'));

    expect(screen.getByTestId('link-dialog')).toBeDefined();
  });
});
