import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@collabdoc/database';
import { auth } from '@/lib/auth';
import * as Y from 'yjs';
import { extractPlainText, countWords } from '@collabdoc/shared';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = (await params).id;

    // Verify user has access to this document
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

    if (document.ownerId !== session.user.id && document.collaborators.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        versionNum: true,
        titleAtTime: true,
        wordCount: true,
        trigger: true,
        createdAt: true,
        creator: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json(versions);
  } catch (error) {
    console.error('[VERSIONS_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST for creating a manual version is handled via the socket server or HTTP?
// We can do it via HTTP by fetching current snapshot and creating a version.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const documentId = (await params).id;

    // Verify user has EDITOR access (only editors can create manual versions)
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

    // Call the socket-server internal API or do it directly if we have access to Yjs
    // Wait, the API server doesn't have the active Yjs doc, but it has the DB snapshot.
    // However, if the room is active, the snapshot in DB might be up to 5 min old.
    // It's better to trigger version creation via Socket.io event from the client, or via an internal API.
    // For now, let's just create it from the latest DB snapshot.
    const snapshot = await prisma.documentSnapshot.findFirst({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
    });

    if (!snapshot) {
      return NextResponse.json({ error: 'No snapshot available to version' }, { status: 400 });
    }

    const doc = new Y.Doc();
    Y.applyUpdate(doc, new Uint8Array(snapshot.yjsState));
    const plainText = extractPlainText(doc);
    const wordCount = countWords(plainText);

    // Get the next version number
    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNum: 'desc' },
      select: { versionNum: true },
    });
    const nextVersionNum = (lastVersion?.versionNum ?? 0) + 1;

    const newVersion = await prisma.documentVersion.create({
      data: {
        documentId,
        createdBy: session.user.id,
        versionNum: nextVersionNum,
        yjsSnapshot: snapshot.yjsState,
        plainText,
        titleAtTime: document.title,
        byteSize: snapshot.byteSize,
        trigger: 'MANUAL',
        wordCount,
      },
    });

    return NextResponse.json(newVersion, { status: 201 });
  } catch (error) {
    console.error('[VERSIONS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
