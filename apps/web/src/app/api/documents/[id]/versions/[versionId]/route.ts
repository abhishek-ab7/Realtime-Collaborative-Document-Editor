import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@collabdoc/database';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId, versionId } = await params;

    // Verify access
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

    const version = await prisma.documentVersion.findUnique({
      where: { id: versionId },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!version || version.documentId !== documentId) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json(version);
  } catch (error) {
    console.error('[VERSION_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
