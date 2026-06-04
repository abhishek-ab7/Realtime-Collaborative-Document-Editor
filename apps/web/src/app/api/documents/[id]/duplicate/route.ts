import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { duplicateDocument } from '@/features/documents/actions/document-actions';

// POST /api/documents/[id]/duplicate — Duplicate a document
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const duplicated = await duplicateDocument(id);
    return NextResponse.json(duplicated, { status: 201 });
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
