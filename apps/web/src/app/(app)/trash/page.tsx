'use client';

import { useDocuments } from '@/features/documents/hooks/use-documents';
import { DocumentGrid } from '@/features/documents/components/document-grid';
import { updateDocument, deleteDocument } from '@/features/documents/actions/document-actions';
import { Trash2 } from 'lucide-react';
import { toast, Toaster } from 'sonner';

export default function TrashPage() {
  const { documents, isLoading, refresh } = useDocuments({ status: 'TRASHED' });

  const handleRestore = async (id: string) => {
    try {
      await updateDocument(id, { status: 'ACTIVE' });
      toast.success('Document restored');
      refresh();
    } catch (error) {
      toast.error('Failed to restore document');
      console.error(error);
    }
  };

  const handleDeletePermanent = async (id: string) => {
    try {
      await deleteDocument(id);
      toast.success('Document deleted permanently');
      refresh();
    } catch (error) {
      toast.error('Failed to delete document');
      console.error(error);
    }
  };

  return (
    <div className="flex w-full flex-col space-y-8">
      <Toaster position="top-right" closeButton richColors />

      {/* Header Info */}
      <div className="flex flex-col gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-[#131b2e]">
          <Trash2 className="h-6 w-6 text-red-500" />
          Trash
        </h1>
        <p className="text-sm text-slate-500">
          Documents in the trash will be preserved. You can restore them at any time or delete them
          permanently.
        </p>
      </div>

      {/* Trashed Documents Grid */}
      <section className="flex-grow">
        <DocumentGrid
          documents={documents}
          isLoading={isLoading}
          isTrashedPage={true}
          onRestore={handleRestore}
          onDeletePermanent={handleDeletePermanent}
        />
      </section>
    </div>
  );
}
