import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { redirect } from 'next/navigation';
import { DashboardClient } from './dashboard-client';

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect('/signin');
  }

  // Fetch initial 20 documents server-side
  const initialDocs = await prisma.document.findMany({
    where: {
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
      status: 'ACTIVE',
    },
    orderBy: { lastAccessedAt: 'desc' },
    take: 20,
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { collaborators: true } },
    },
  });

  const total = await prisma.document.count({
    where: {
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
      status: 'ACTIVE',
    },
  });

  const serializedDocs = initialDocs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    ownerId: doc.ownerId,
    isStarred: doc.isStarred,
    status: doc.status,
    wordCount: doc.wordCount,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    lastAccessedAt: doc.lastAccessedAt ? doc.lastAccessedAt.toISOString() : null,
    collaboratorCount: doc._count.collaborators,
    owner: {
      id: doc.owner.id,
      name: doc.owner.name,
      avatarUrl: doc.owner.avatarUrl,
    },
  }));

  return <DashboardClient initialDocuments={serializedDocs} total={total} />;
}
