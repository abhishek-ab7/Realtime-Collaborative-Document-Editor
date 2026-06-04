import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EditorToolbar } from '../components/editor-toolbar';

vi.mock('../components/link-dialog', () => ({
  LinkDialog: ({ open }: any) => (open ? <div data-testid="link-dialog-open" /> : null),
}));

function createMockEditor(overrides = {}) {
  return {
    chain: vi.fn().mockReturnValue({
      focus: vi.fn().mockReturnValue({
        toggleBold: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleItalic: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleUnderline: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleStrike: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleHighlight: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleHeading: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleBulletList: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleOrderedList: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleTaskList: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleCode: vi.fn().mockReturnValue({ run: vi.fn() }),
        toggleCodeBlock: vi.fn().mockReturnValue({ run: vi.fn() }),
        setHorizontalRule: vi.fn().mockReturnValue({ run: vi.fn() }),
        setTextAlign: vi.fn().mockReturnValue({ run: vi.fn() }),
        undo: vi.fn().mockReturnValue({ run: vi.fn() }),
        redo: vi.fn().mockReturnValue({ run: vi.fn() }),
        extendMarkRange: vi.fn().mockReturnValue({
          setLink: vi.fn().mockReturnValue({ run: vi.fn() }),
          unsetLink: vi.fn().mockReturnValue({ run: vi.fn() }),
        }),
      }),
    }),
    can: vi.fn().mockReturnValue({ undo: vi.fn(() => true), redo: vi.fn(() => false) }),
    isActive: vi.fn().mockReturnValue(false),
    getAttributes: vi.fn().mockReturnValue({}),
    ...overrides,
  };
}

describe('EditorToolbar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders toolbar with all button groups', () => {
    const editor = createMockEditor();
    render(<EditorToolbar editor={editor as any} />);

    expect(screen.getByTestId('editor-toolbar')).toBeDefined();
    expect(screen.getByTestId('toolbar-bold')).toBeDefined();
    expect(screen.getByTestId('toolbar-italic')).toBeDefined();
    expect(screen.getByTestId('toolbar-h1')).toBeDefined();
    expect(screen.getByTestId('toolbar-bullet-list')).toBeDefined();
    expect(screen.getByTestId('toolbar-link')).toBeDefined();
  });

  test('calls toggleBold on bold button click', () => {
    const editor = createMockEditor();
    render(<EditorToolbar editor={editor as any} />);

    fireEvent.click(screen.getByTestId('toolbar-bold'));

    expect(editor.chain).toHaveBeenCalled();
  });

  test('shows active state on active formatting', () => {
    const editor = createMockEditor({
      isActive: vi.fn((mark: string) => mark === 'bold'),
    });
    render(<EditorToolbar editor={editor as any} />);

    const boldBtn = screen.getByTestId('toolbar-bold');
    expect(boldBtn.className).toContain('bg-[#4f46e5]/10');
  });

  test('redo button is disabled when cannot redo', () => {
    const editor = createMockEditor({
      can: vi.fn().mockReturnValue({ undo: vi.fn(() => true), redo: vi.fn(() => false) }),
    });
    render(<EditorToolbar editor={editor as any} />);

    const redoBtn = screen.getByTestId('toolbar-redo') as HTMLButtonElement;
    expect(redoBtn.disabled).toBe(true);
  });

  test('returns null when editor is null', () => {
    const { container } = render(<EditorToolbar editor={null} />);
    expect(container.firstChild).toBeNull();
  });
});
