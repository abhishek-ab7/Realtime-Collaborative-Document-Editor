import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { CreateDocumentButton } from '../components/create-document-button';

const mockPush = vi.fn();
vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: mockPush,
    }),
  };
});

vi.mock('../actions/document-actions', () => {
  return {
    createDocument: vi.fn(),
  };
});

import { createDocument } from '../actions/document-actions';

describe('CreateDocumentButton', () => {
  test('renders button with correct text', () => {
    render(<CreateDocumentButton />);
    const btn = screen.getByTestId('create-document-button');
    expect(btn).toBeDefined();
    expect(screen.getByText('New Document')).toBeDefined();
  });

  test('calls createDocument and redirects to new document page on click', async () => {
    vi.mocked(createDocument).mockResolvedValue({ id: 'doc-new-123' } as any);
    render(<CreateDocumentButton />);

    const btn = screen.getByTestId('create-document-button');

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(createDocument).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/d/doc-new-123');
  });
});
