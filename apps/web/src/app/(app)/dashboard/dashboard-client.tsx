'use client';

import { useDocuments, Document } from '@/features/documents/hooks/use-documents';
import { SearchDocuments } from '@/features/documents/components/search-documents';
import { CreateDocumentButton } from '@/features/documents/components/create-document-button';
import { DocumentGrid } from '@/features/documents/components/document-grid';
import { updateDocument, duplicateDocument } from '@/features/documents/actions/document-actions';
import { Star, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useState, useMemo } from 'react';

interface DashboardClientProps {
  initialDocuments: Document[];
  total: number;
}

export function DashboardClient({ initialDocuments, total }: DashboardClientProps) {
  const fallbackData = useMemo(
    () => ({
      documents: initialDocuments,
      pagination: {
        page: 1,
        limit: 20,
        total,
        totalPages: Math.ceil(total / 20),
      },
    }),
    [initialDocuments, total],
  );

  const { documents, isLoading, options, setSearch, toggleStar, refresh } = useDocuments(
    { status: 'ACTIVE' },
    fallbackData,
  );

  const starredDocuments = documents.filter((doc: Document) => doc.isStarred);
  const nonStarredDocuments = documents.filter((doc: Document) => !doc.isStarred);

  const [sort, setSort] = useState('accessed');

  const sortDocuments = (docs: Document[]) => {
    return [...docs].sort((a, b) => {
      switch (sort) {
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'accessed':
        default:
          return (
            new Date(b.lastAccessedAt || b.updatedAt).getTime() -
            new Date(a.lastAccessedAt || a.updatedAt).getTime()
          );
      }
    });
  };

  const handleStar = async (id: string, isStarred: boolean) => {
    try {
      await toggleStar(id, isStarred);
      toast.success(isStarred ? 'Added to Starred' : 'Removed from Starred');
    } catch (error) {
      toast.error('Failed to update star status');
      console.error(error);
    }
  };

  const handleRename = async (id: string, title: string) => {
    try {
      await updateDocument(id, { title });
      toast.success('Document renamed');
      refresh();
    } catch (error) {
      toast.error('Failed to rename document');
      console.error(error);
    }
  };

  const handleTrash = async (id: string) => {
    try {
      await updateDocument(id, { status: 'TRASHED' });
      toast.success('Moved to trash', {
        action: {
          label: 'Undo',
          onClick: async () => {
            try {
              await updateDocument(id, { status: 'ACTIVE' });
              toast.success('Document restored');
              refresh();
            } catch {
              toast.error('Failed to restore document');
            }
          },
        },
      });
      refresh();
    } catch (error) {
      toast.error('Failed to move document to trash');
      console.error(error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const newDoc = await duplicateDocument(id);
      toast.success(`Duplicated as "${newDoc.title}"`);
      refresh();
    } catch (error) {
      toast.error('Failed to duplicate document');
      console.error(error);
    }
  };

  return (
    <div className="flex w-full flex-col space-y-8">
      {/* Header Controls */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <CreateDocumentButton />
        <div className="flex items-center gap-3">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-md border border-[var(--color-border-default)] bg-white px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-border-hover)] focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20 focus:outline-none"
          >
            <option value="accessed">Recent</option>
            <option value="updated">Last edited</option>
            <option value="created">Created</option>
            <option value="title">Title A-Z</option>
          </select>
          <SearchDocuments onSearch={setSearch} defaultValue={options.search} />
        </div>
      </div>

      {/* Starred Section */}
      {!options.search && starredDocuments.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[#131b2e]">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            Starred
          </h2>
          <DocumentGrid
            documents={starredDocuments}
            isLoading={isLoading}
            onStar={handleStar}
            onRename={handleRename}
            onTrash={handleTrash}
            onDuplicate={handleDuplicate}
          />
        </section>
      )}

      {/* Recent / All Documents Section */}
      <section className="flex-grow space-y-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-[#131b2e]">
          <Clock className="h-4 w-4 text-slate-400" />
          {options.search ? 'Search Results' : 'Recent Documents'}
        </h2>
        <DocumentGrid
          documents={sortDocuments(options.search ? documents : nonStarredDocuments)}
          isLoading={isLoading}
          searchQuery={options.search}
          onStar={handleStar}
          onRename={handleRename}
          onTrash={handleTrash}
          onDuplicate={handleDuplicate}
        />
      </section>
    </div>
  );
}
