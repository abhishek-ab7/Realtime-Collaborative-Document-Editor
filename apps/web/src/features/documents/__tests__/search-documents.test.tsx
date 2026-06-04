import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { SearchDocuments } from '../components/search-documents';

describe('SearchDocuments', () => {
  test('renders search input with placeholder', () => {
    const handleSearch = vi.fn();
    render(<SearchDocuments onSearch={handleSearch} placeholder="Search files..." />);

    const input = screen.getByTestId('search-documents-input') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.placeholder).toBe('Search files...');
  });

  test('debounces and calls onSearch callback', async () => {
    vi.useFakeTimers();
    const handleSearch = vi.fn();
    render(<SearchDocuments onSearch={handleSearch} />);

    const input = screen.getByTestId('search-documents-input');
    fireEvent.change(input, { target: { value: 'strategy' } });

    // Should not be called immediately due to debounce
    expect(handleSearch).not.toHaveBeenCalledWith('strategy');

    // Fast-forward 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(handleSearch).toHaveBeenCalledWith('strategy');
    vi.useRealTimers();
  });

  test('shows and clicks clear button', () => {
    const handleSearch = vi.fn();
    render(<SearchDocuments onSearch={handleSearch} defaultValue="strategic planning" />);

    const clearBtn = screen.getByTestId('search-clear-button');
    expect(clearBtn).toBeDefined();

    fireEvent.click(clearBtn);

    const input = screen.getByTestId('search-documents-input') as HTMLInputElement;
    expect(input.value).toBe('');
    expect(handleSearch).toHaveBeenCalledWith('');
  });
});
