import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { DocumentEditorClient } from './document-editor-client';
import { getDocumentRole } from '@/lib/permissions';

interface EditorPageProps {
  params: Promise<{ documentId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/signin');

  const { documentId } = await params;

  // Fetch document
  const document = await prisma.document.findUnique({
    where: { id: documentId },
  });

  if (!document) notFound();

  // Resolve user's role via centralized permission system
  const role = await getDocumentRole(documentId, userId);
  if (!role) notFound();

  if (document.status === 'TRASHED') redirect('/trash');

  // Update last accessed timestamp (non-blocking)
  prisma.document
    .update({
      where: { id: documentId },
      data: { lastAccessedAt: new Date() },
    })
    .catch(() => {
      // Silently ignore — not critical
    });

  return (
    <DocumentEditorClient
      documentId={documentId}
      title={document.title}
      content=""
      lastAccessedAt={document.lastAccessedAt}
      userName={session.user.name || 'Anonymous'}
      userImage={session.user.image || null}
      userId={userId}
      role={role}
    />
  );
}

export async function generateMetadata({ params }: EditorPageProps) {
  const { documentId } = await params;
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    select: { title: true },
  });

  return {
    title: document ? `${document.title} — Collabdoc` : 'Document — Collabdoc',
    description: 'Collaborative document editor',
  };
}
