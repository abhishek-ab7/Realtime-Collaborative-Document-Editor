'use client';

import { DocumentCard } from './document-card';
import { CreateDocumentButton } from './create-document-button';
import { FileText, SearchCode, Trash } from 'lucide-react';

export interface DocumentType {
  id: string;
  title: string;
  isStarred: boolean;
  status: 'ACTIVE' | 'TRASHED';
  wordCount: number;
  createdAt: string | Date;
  updatedAt: string | Date;
  lastAccessedAt: string | Date | null;
  collaboratorCount: number;
  owner: { id?: string; name: string | null; avatarUrl: string | null };
}

interface DocumentGridProps {
  documents: DocumentType[];
  isTrashedPage?: boolean;
  isLoading?: boolean;
  searchQuery?: string;
  onStar?: (id: string, starred: boolean) => void;
  onRename?: (id: string, title: string) => void;
  onTrash?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDeletePermanent?: (id: string) => void;
}

export function DocumentGrid({
  documents,
  isTrashedPage = false,
  isLoading = false,
  searchQuery = '',
  onStar,
  onRename,
  onTrash,
  onDuplicate,
  onRestore,
  onDeletePermanent,
}: DocumentGridProps) {
  if (isLoading) {
    return (
      <div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
        data-testid="document-grid-loading"
      >
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-44 animate-pulse rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-5"
          >
            <div className="mb-3 flex items-start justify-between">
              <div className="h-10 w-10 rounded-lg bg-[var(--color-bg-tertiary)]" />
              <div className="h-4 w-4 rounded-md bg-[var(--color-bg-tertiary)]" />
            </div>
            <div className="mb-2 h-5 w-3/4 rounded-md bg-[var(--color-bg-tertiary)]" />
            <div className="h-4 w-1/2 rounded-md bg-[var(--color-bg-tertiary)]" />
            <div className="mt-8 flex justify-between border-t border-[var(--color-border-default)] pt-3">
              <div className="h-4 w-16 rounded-md bg-[var(--color-bg-tertiary)]" />
              <div className="h-6 w-6 rounded-full bg-[var(--color-bg-tertiary)]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-12 text-center shadow-sm">
        {isTrashedPage ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Trash className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-[var(--color-text-primary)]">
              Trash is empty
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Documents you delete will appear here.
            </p>
          </>
        ) : searchQuery ? (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <SearchCode className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-[var(--color-text-primary)]">
              No results found
            </h3>
            <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
              We couldn't find any documents matching "{searchQuery}"
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)]">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mb-1 text-lg font-semibold text-[var(--color-text-primary)]">
              No documents yet
            </h3>
            <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
              Create your first document to start collaborating.
            </p>
            <CreateDocumentButton />
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      data-testid="document-grid"
    >
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          id={doc.id}
          title={doc.title}
          isStarred={doc.isStarred}
          updatedAt={doc.updatedAt}
          lastAccessedAt={doc.lastAccessedAt}
          collaboratorCount={doc.collaboratorCount}
          owner={doc.owner}
          isTrashedPage={isTrashedPage}
          onStar={onStar}
          onRename={onRename}
          onTrash={onTrash}
          onDuplicate={onDuplicate}
          onRestore={onRestore}
          onDeletePermanent={onDeletePermanent}
        />
      ))}
    </div>
  );
}
