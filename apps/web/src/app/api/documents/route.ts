import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { listDocumentsSchema } from '@collabdoc/shared';
import { createDocument } from '@/features/documents/actions/document-actions';

// GET /api/documents — List user's documents
export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;

    // Parse params from query string
    const paramsObj: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      paramsObj[key] = value;
    });

    const input = listDocumentsSchema.parse(paramsObj);

    const where: any = {
      OR: [{ ownerId: userId }, { collaborators: { some: { userId } } }],
      status: input.status,
    };

    if (input.starred !== undefined) {
      where.isStarred = input.starred;
    }

    if (input.search) {
      where.title = { contains: input.search, mode: 'insensitive' };
    }

    const sortMap = {
      updated: 'updatedAt',
      created: 'createdAt',
      title: 'title',
      accessed: 'lastAccessedAt',
    } as const;

    const sortField = sortMap[input.sort] || 'lastAccessedAt';

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        orderBy: { [sortField]: input.order },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
        include: {
          owner: { select: { id: true, name: true, avatarUrl: true } },
          _count: { select: { collaborators: true } },
        },
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      documents: documents.map((doc) => ({
        ...doc,
        collaboratorCount: doc._count.collaborators,
        _count: undefined,
      })),
      pagination: {
        page: input.page,
        limit: input.limit,
        total,
        totalPages: Math.ceil(total / input.limit),
      },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

// POST /api/documents — Create new document
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const document = await createDocument(body);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
