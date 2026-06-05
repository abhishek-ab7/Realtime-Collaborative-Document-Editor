import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { updateDocument, deleteDocument } from '@/features/documents/actions/document-actions';

// GET /api/documents/[id] — Retrieve a single document
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        collaborators: {
          include: {
            user: { select: { id: true, name: true, avatarUrl: true, email: true } },
          },
        },
      },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Check if the user is the owner or a collaborator
    const isOwner = document.ownerId === userId;
    const isCollaborator = document.collaborators.some((c) => c.userId === userId);

    if (!isOwner && !isCollaborator) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(document);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

// PATCH /api/documents/[id] — Update a document
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const updated = await updateDocument(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    const message = (error as Error).message;
    if (message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (message === 'Document not found') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/documents/[id] — Permanently delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    await deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = (error as Error).message;
    if (message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (message === 'Document not found') {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
