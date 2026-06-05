import { redirect, notFound } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { hashShareToken } from '@/lib/share-token';

interface SharePageProps {
  params: Promise<{ token: string }>;
}

export default async function SharePage({ params }: SharePageProps) {
  const { token } = await params;

  // 1. Hash the token and look up in DB
  const tokenHash = hashShareToken(token);
  const shareLink = await prisma.shareLink.findUnique({
    where: { tokenHash },
    include: { document: { select: { id: true, title: true, status: true } } },
  });

  // 2. Validate link exists, is active, and not expired
  if (!shareLink || !shareLink.isActive) {
    notFound();
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    notFound();
  }

  if (shareLink.document.status !== 'ACTIVE') {
    notFound();
  }

  // 3. Check if user is authenticated
  const session = await auth();
  if (!session?.user?.id) {
    // Redirect to sign in with callback URL back to this share link
    redirect(`/signin?callbackUrl=/share/${token}`);
  }

  const userId = session.user.id;
  const documentId = shareLink.documentId;

  // 4. Check if user is already the owner
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (doc?.ownerId === userId) {
    // Owner already has full access — just redirect
    redirect(`/d/${documentId}`);
  }

  // 5. Map share permission to collaborator role
  const collaboratorRole = shareLink.permission === 'EDIT' ? 'EDITOR' : 'VIEWER';

  // 6. Upsert collaborator — grant access via share link
  await prisma.collaborator.upsert({
    where: { documentId_userId: { documentId, userId } },
    update: { role: collaboratorRole },
    create: {
      documentId,
      userId,
      role: collaboratorRole,
      invitedBy: shareLink.createdBy,
    },
  });

  // 7. Redirect to the document
  redirect(`/d/${documentId}`);
}

export async function generateMetadata() {
  return {
    title: 'Shared Document — Collabdoc',
    description: 'You have been invited to collaborate on a document.',
  };
}
