import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { DocumentEditorClient } from './document-editor-client';

interface EditorPageProps {
  params: Promise<{ documentId: string }>;
}

export default async function EditorPage({ params }: EditorPageProps) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect('/signin');

  const { documentId } = await params;

  // Fetch document and verify access
  const document = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      collaborators: { select: { userId: true } },
    },
  });

  if (!document) notFound();

  const isOwner = document.ownerId === userId;
  const isCollaborator = document.collaborators.some((c) => c.userId === userId);

  if (!isOwner && !isCollaborator) notFound();

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
