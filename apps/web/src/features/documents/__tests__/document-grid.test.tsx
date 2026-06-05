/* eslint-disable @typescript-eslint/no-explicit-any */
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { DocumentGrid, DocumentType } from '../components/document-grid';

vi.mock('next/navigation', () => {
  return {
    useRouter: () => ({
      push: vi.fn(),
    }),
  };
});

vi.mock('../components/document-card', () => {
  return {
    DocumentCard: (props: any) => (
      <div data-testid={`mock-card-${props.id}`}>
        {props.title} - {props.isTrashedPage ? 'trashed' : 'active'}
      </div>
    ),
  };
});

vi.mock('../components/create-document-button', () => {
  return {
    CreateDocumentButton: () => <button data-testid="mock-create-btn">Create</button>,
  };
});

describe('DocumentGrid', () => {
  const mockDocs: DocumentType[] = [
    {
      id: 'doc-1',
      title: 'Document One',
      isStarred: false,
      status: 'ACTIVE',
      wordCount: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
      collaboratorCount: 1,
      owner: { id: 'u-1', name: 'Alice', avatarUrl: null },
    },
    {
      id: 'doc-2',
      title: 'Document Two',
      isStarred: true,
      status: 'ACTIVE',
      wordCount: 200,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastAccessedAt: new Date(),
      collaboratorCount: 2,
      owner: { id: 'u-2', name: 'Bob', avatarUrl: null },
    },
  ];

  test('renders loading skeleton when isLoading is true', () => {
    render(<DocumentGrid documents={[]} isLoading={true} />);
    expect(screen.getByTestId('document-grid-loading')).toBeDefined();
  });

  test('renders empty trash state when documents list is empty and isTrashedPage is true', () => {
    render(<DocumentGrid documents={[]} isTrashedPage={true} />);
    expect(screen.getByText('Trash is empty')).toBeDefined();
    expect(screen.getByText('Documents you delete will appear here.')).toBeDefined();
  });

  test('renders no results state when documents list is empty and searchQuery is present', () => {
    render(<DocumentGrid documents={[]} searchQuery="mystery" />);
    expect(screen.getByText('No results found')).toBeDefined();
    expect(screen.getByText('We couldn\'t find any documents matching "mystery"')).toBeDefined();
  });

  test('renders empty state with create button when documents list is empty and no query/trash', () => {
    render(<DocumentGrid documents={[]} />);
    expect(screen.getByText('No documents yet')).toBeDefined();
    expect(screen.getByText('Create your first document to start collaborating.')).toBeDefined();
    expect(screen.getByTestId('mock-create-btn')).toBeDefined();
  });

  test('renders list of DocumentCards when documents are populated', () => {
    render(<DocumentGrid documents={mockDocs} />);
    expect(screen.getByTestId('document-grid')).toBeDefined();
    expect(screen.getByTestId('mock-card-doc-1')).toBeDefined();
    expect(screen.getByTestId('mock-card-doc-2')).toBeDefined();
    expect(screen.getByText('Document One - active')).toBeDefined();
    expect(screen.getByText('Document Two - active')).toBeDefined();
  });
});
