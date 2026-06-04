import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { WordCount } from '../components/word-count';

function createMockEditor(words = 0, characters = 0) {
  return {
    storage: {
      characterCount: {
        words: vi.fn(() => words),
        characters: vi.fn(() => characters),
      },
    },
  };
}

describe('WordCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders word and character counts', () => {
    const editor = createMockEditor(42, 237);
    render(<WordCount editor={editor as any} />);

    expect(screen.getByTestId('word-count-words').textContent).toBe('42');
    expect(screen.getByTestId('word-count-chars').textContent).toBe('237');
  });

  test('shows zero counts on empty document', () => {
    const editor = createMockEditor(0, 0);
    render(<WordCount editor={editor as any} />);

    expect(screen.getByTestId('word-count-words').textContent).toBe('0');
    expect(screen.getByTestId('word-count-chars').textContent).toBe('0');
  });

  test('returns null when editor is null', () => {
    const { container } = render(<WordCount editor={null} />);
    expect(container.firstChild).toBeNull();
  });
});
