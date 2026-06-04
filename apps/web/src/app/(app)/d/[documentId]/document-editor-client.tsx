'use client';

import { useState, useCallback, useRef } from 'react';
import { Editor } from '@/features/editor/components/editor';
import { EditorHeader } from '@/features/editor/components/editor-header';
import { updateDocument } from '@/features/documents/actions/document-actions';
import { toast } from 'sonner';

interface DocumentEditorClientProps {
  documentId: string;
  title: string;
  content: string;
  lastAccessedAt: Date | null;
}

export function DocumentEditorClient({
  documentId,
  title,
  content,
  lastAccessedAt,
}: DocumentEditorClientProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdate = useCallback(
    (htmlContent: string) => {
      // Debounce saves — 2 second delay per keystroke
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      setIsSaving(true);
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          // Note: Full content persistence to Yjs is implemented in Phase 05.
          // For now we just mark as recently accessed.
          await updateDocument(documentId, {});
          setLastSavedAt(new Date());
        } catch {
          toast.error('Failed to save document');
        } finally {
          setIsSaving(false);
        }
      }, 2000);
    },
    [documentId],
  );

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <EditorHeader
        documentId={documentId}
        title={title}
        lastSavedAt={lastSavedAt}
        isSaving={isSaving}
      />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl">
          <Editor content={content} editable={true} onUpdate={handleUpdate} />
        </div>
      </main>
    </div>
  );
}
