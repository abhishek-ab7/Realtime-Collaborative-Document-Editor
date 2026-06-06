'use client';

import dynamic from 'next/dynamic';
import EditorLoading from './loading';
import type { DocumentRole } from '@/lib/permissions';

const DocumentEditorClient = dynamic(
  () => import('./document-editor-client').then((m) => m.DocumentEditorClient),
  {
    ssr: false,
    loading: () => <EditorLoading />,
  },
);

interface DocumentEditorWrapperProps {
  documentId: string;
  title: string;
  content: string;
  lastAccessedAt: Date | null;
  userName: string;
  userImage: string | null;
  userId: string;
  role: DocumentRole;
}

export function DocumentEditorWrapper(props: DocumentEditorWrapperProps) {
  return <DocumentEditorClient {...props} />;
}
