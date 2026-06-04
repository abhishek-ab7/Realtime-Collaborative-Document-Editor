'use client';

import { useDocuments } from '@/features/documents/hooks/use-documents';
import { SearchDocuments } from '@/features/documents/components/search-documents';
import { CreateDocumentButton } from '@/features/documents/components/create-document-button';
import { DocumentGrid } from '@/features/documents/components/document-grid';
import { updateDocument, duplicateDocument } from '@/features/documents/actions/document-actions';
import { Star, Clock } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function DashboardPage() {
  const { documents, isLoading, options, setSearch, refresh } = useDocuments({ status: 'ACTIVE' });

  const starredDocuments = documents.filter((doc) => doc.isStarred);

  const handleStar = async (id: string, isStarred: boolean) => {
    try {
      await updateDocument(id, { isStarred });
      toast.success(isStarred ? 'Added to Starred' : 'Removed from Starred');
      refresh();
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
    const doc = documents.find((d) => d.id === id);
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
            } catch (err) {
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
      <Toaster position="top-right" closeButton richColors />

      {/* Header Controls */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <CreateDocumentButton />
        <SearchDocuments onSearch={setSearch} defaultValue={options.search} />
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
          documents={documents}
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
