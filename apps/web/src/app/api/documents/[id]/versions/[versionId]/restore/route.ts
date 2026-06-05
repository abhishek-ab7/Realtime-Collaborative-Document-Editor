import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@collabdoc/database';
import { auth } from '@/features/auth/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = params.id;

    // Verify access (must be editor)
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        collaborators: {
          where: { userId: session.user.id },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const isOwner = document.ownerId === session.user.id;
    const isEditor = document.collaborators.some((c) => c.role === 'EDITOR');

    if (!isOwner && !isEditor) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const version = await prisma.documentVersion.findUnique({
      where: { id: params.versionId },
    });

    if (!version || version.documentId !== documentId) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    // 1. Fetch current snapshot
    const currentSnapshot = await prisma.documentSnapshot.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });

    if (currentSnapshot) {
      // 2. Create backup version
      const lastVersion = await prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { versionNum: 'desc' },
        select: { versionNum: true },
      });
      const nextVersionNum = (lastVersion?.versionNum ?? 0) + 1;

      await prisma.documentVersion.create({
        data: {
          documentId,
          createdBy: session.user.id,
          versionNum: nextVersionNum,
          yjsSnapshot: currentSnapshot.yjsState,
          plainText: '', // It's fine to leave empty for automatic backups
          titleAtTime: document.title,
          byteSize: currentSnapshot.byteSize,
          trigger: 'RESTORE_BACKUP',
          wordCount: document.wordCount,
        },
      });
    }

    // 3. Create a new snapshot with the restored state
    // We update the document and insert a new snapshot.
    // The active clients will need to reload or re-sync.
    // In our implementation, we'll return success and the client will trigger a full page reload.
    await prisma.$transaction([
      prisma.documentSnapshot.create({
        data: {
          documentId,
          yjsState: version.yjsSnapshot,
          stateVector: Buffer.from([]), // We can just provide an empty vector, or we can try to extract it
          byteSize: version.byteSize,
        },
      }),
      prisma.document.update({
        where: { id: documentId },
        data: {
          updatedAt: new Date(),
          wordCount: version.wordCount,
        },
      }),
    ]);

    // 4. Tell the socket server to evict the room and notify clients to reload
    const socketServerUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    try {
      await fetch(`${socketServerUrl}/internal/rooms/${documentId}/force-reload`, {
        method: 'POST',
      });
    } catch (err) {
      console.warn('[VERSION_RESTORE_POST] Failed to notify socket server:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[VERSION_RESTORE_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
