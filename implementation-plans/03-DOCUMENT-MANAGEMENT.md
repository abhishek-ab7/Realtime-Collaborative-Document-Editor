# Phase 03 — Document Management & Dashboard

> **Days:** 8–11  
> **Status:** ⬜ Not Started  
> **Dependencies:** Phase 01 (Foundation), Phase 02 (Auth)  
> **Milestone:** M3-DOCUMENTS  
> **PRD Sections:** 5.2 (Document Management)

---

## 1. Phase Objective

Build the complete document CRUD system with a polished dashboard UI, including: document creation, renaming, soft-delete/restore, permanent delete, duplication, search, starring, recent documents, list/grid view, and a trash page. All designs are generated via Stitch MCP before implementation.

---

## 2. Day-by-Day Breakdown

### Day 8: Dashboard Design (Stitch MCP) + API Routes

| #   | Task                                                                     | Est. Time | Output                                           |
| --- | ------------------------------------------------------------------------ | --------- | ------------------------------------------------ |
| 8.1 | **Stitch MCP**: Generate dashboard page design                           | 30 min    | `.stitch/designs/dashboard.html` + `.png`        |
| 8.2 | **Stitch MCP**: Generate document card component design                  | 20 min    | Reference for card styling                       |
| 8.3 | **Stitch MCP**: Generate trash page design                               | 20 min    | `.stitch/designs/trash.html` + `.png`            |
| 8.4 | Create document Server Actions (create, rename, delete, duplicate, star) | 90 min    | `features/documents/actions/document-actions.ts` |
| 8.5 | Create document API routes (GET list, POST create)                       | 60 min    | `api/documents/route.ts`                         |
| 8.6 | Create document API routes (GET/PATCH/DELETE by id)                      | 60 min    | `api/documents/[id]/route.ts`                    |
| 8.7 | Create document duplicate API route                                      | 20 min    | `api/documents/[id]/duplicate/route.ts`          |

**Day 8 Total: ~5 hours**

#### Stitch MCP Prompts

**Dashboard:**

```
A document dashboard for 'Collabdoc'. White background, Inter font.
Top bar: Logo "Collabdoc" on left, user avatar dropdown on right.
Below top bar: "New Document" button (indigo filled) and search input on same row.
Section "★ Starred" with horizontal scroll of document cards.
Section "Recent" with grid (3 columns) of document cards.
Each card: white background, subtle border, document title (16px semibold),
last edited time (12px gray), 3-dot menu icon top-right.
Cards have hover shadow animation. Clean, spacious layout.
```

**Document Card:**

```
A single document card component. White background with subtle gray border
(#e2e8f0). Rounded corners (12px). Padding 20px.
Top-right: 3-dot context menu icon (gray, hover: dark).
Title: "Q3 Planning" in 16px semibold dark text, single line with ellipsis.
Below title: "Edited 2 hours ago" in 12px gray text.
Bottom-left: small star icon (yellow when active, gray when inactive).
Bottom-right: small avatar stack (2-3 tiny user avatars).
Card has transition: subtle shadow on hover, slight scale (1.01).
```

### Day 9: Dashboard UI Components

| #   | Task                                                         | Est. Time | Output                                                     |
| --- | ------------------------------------------------------------ | --------- | ---------------------------------------------------------- |
| 9.1 | Install required shadcn/ui components                        | 10 min    | Card, Input, Dialog, Tooltip, etc.                         |
| 9.2 | Build `DocumentCard` component                               | 60 min    | `features/documents/components/document-card.tsx`          |
| 9.3 | Build `DocumentContextMenu` (rename, duplicate, star, trash) | 45 min    | `features/documents/components/document-context-menu.tsx`  |
| 9.4 | Build `CreateDocumentButton`                                 | 20 min    | `features/documents/components/create-document-button.tsx` |
| 9.5 | Build `SearchDocuments` input                                | 30 min    | `features/documents/components/search-documents.tsx`       |
| 9.6 | Build `DocumentGrid` (grid/list layout)                      | 45 min    | `features/documents/components/document-grid.tsx`          |
| 9.7 | Create `useDocuments` data fetching hook                     | 30 min    | `features/documents/hooks/use-documents.ts`                |

**Day 9 Total: ~4 hours**

#### shadcn/ui Components Needed

```bash
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add dialog
npx shadcn@latest add tooltip
npx shadcn@latest add context-menu
npx shadcn@latest add toast
npx shadcn@latest add sonner
npx shadcn@latest add tabs
npx shadcn@latest add badge
npx shadcn@latest add scroll-area
```

### Day 10: Dashboard Page + App Shell + Inline Rename

| #    | Task                                                 | Est. Time | Output                              |
| ---- | ---------------------------------------------------- | --------- | ----------------------------------- |
| 10.1 | Build App Shell layout (sidebar + header)            | 60 min    | `src/app/(app)/layout.tsx`          |
| 10.2 | Build Dashboard page (starred, recent, all sections) | 90 min    | `src/app/(app)/dashboard/page.tsx`  |
| 10.3 | Implement inline rename dialog                       | 30 min    | Rename modal in context menu        |
| 10.4 | Implement star/unstar toggle with optimistic updates | 20 min    | Immediate UI feedback               |
| 10.5 | Implement soft-delete with toast notification        | 20 min    | "Document moved to trash" with undo |
| 10.6 | Build empty states (no documents, no search results) | 30 min    | Illustrated empty states            |

**Day 10 Total: ~4 hours**

### Day 11: Trash Page + Tests + Polish

| #    | Task                                                        | Est. Time | Output                            |
| ---- | ----------------------------------------------------------- | --------- | --------------------------------- |
| 11.1 | Build Trash page (restore + permanent delete)               | 60 min    | `src/app/(app)/trash/page.tsx`    |
| 11.2 | Implement permanent delete with confirmation dialog         | 20 min    | Destructive action confirmation   |
| 11.3 | Implement document duplication                              | 20 min    | Creates copy with "— Copy" suffix |
| 11.4 | Write unit tests for DocumentCard, SearchDocuments          | 45 min    | 8–10 tests                        |
| 11.5 | Write integration tests for document API routes             | 60 min    | 12–15 tests                       |
| 11.6 | Polish animations (card hover, transitions, loading states) | 30 min    | CSS transitions                   |
| 11.7 | Git commit: "M3: Document management complete"              | 5 min     | Clean commit                      |

**Day 11 Total: ~4 hours**

---

## 3. Detailed File Specifications

### 3.1 Server Actions

#### `apps/web/src/features/documents/actions/document-actions.ts`

```typescript
'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { createDocumentSchema, updateDocumentSchema } from '@collabdoc/shared';
import * as Y from 'yjs';

// ─── CREATE DOCUMENT ───
export async function createDocument(formData?: { title?: string }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const input = createDocumentSchema.parse(formData ?? {});

  // Create empty Yjs doc snapshot
  const ydoc = new Y.Doc();
  const emptyState = Buffer.from(Y.encodeStateAsUpdate(ydoc));
  const stateVector = Buffer.from(Y.encodeStateVector(ydoc));

  const document = await prisma.document.create({
    data: {
      ownerId: session.user.id,
      title: input.title || 'Untitled Document',
      lastAccessedAt: new Date(),
    },
  });

  // Create initial snapshot
  await prisma.documentSnapshot.create({
    data: {
      documentId: document.id,
      yjsState: emptyState,
      stateVector: stateVector,
      byteSize: emptyState.length,
    },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId: document.id,
      userId: session.user.id,
      action: 'DOCUMENT_CREATED',
    },
  });

  revalidatePath('/dashboard');
  return document;
}

// ─── UPDATE DOCUMENT ───
export async function updateDocument(
  documentId: string,
  data: {
    title?: string;
    isStarred?: boolean;
    status?: 'ACTIVE' | 'TRASHED';
  },
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const input = updateDocumentSchema.parse(data);

  // Verify ownership
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc || doc.ownerId !== session.user.id) throw new Error('Forbidden');

  const updated = await prisma.document.update({
    where: { id: documentId },
    data: {
      ...input,
      ...(input.status === 'TRASHED' ? { deletedAt: new Date() } : {}),
      ...(input.status === 'ACTIVE' ? { deletedAt: null } : {}),
    },
  });

  // Activity log for meaningful actions
  if (input.title) {
    await prisma.activityLog.create({
      data: {
        documentId,
        userId: session.user.id,
        action: 'DOCUMENT_RENAMED',
        metadata: { oldTitle: doc.title, newTitle: input.title },
      },
    });
  }
  if (input.status === 'TRASHED') {
    await prisma.activityLog.create({
      data: { documentId, userId: session.user.id, action: 'DOCUMENT_TRASHED' },
    });
  }
  if (input.status === 'ACTIVE' && doc.status === 'TRASHED') {
    await prisma.activityLog.create({
      data: { documentId, userId: session.user.id, action: 'DOCUMENT_RESTORED' },
    });
  }

  revalidatePath('/dashboard');
  revalidatePath('/trash');
  return updated;
}

// ─── DELETE DOCUMENT (permanent) ───
export async function deleteDocument(documentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc || doc.ownerId !== session.user.id) throw new Error('Forbidden');
  if (doc.status !== 'TRASHED') throw new Error('Document must be trashed first');

  await prisma.document.delete({ where: { id: documentId } });

  revalidatePath('/trash');
}

// ─── DUPLICATE DOCUMENT ───
export async function duplicateDocument(documentId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  const original = await prisma.document.findUnique({ where: { id: documentId } });
  if (!original) throw new Error('Document not found');

  // Check access (owner or collaborator)
  if (original.ownerId !== session.user.id) {
    const collab = await prisma.collaborator.findUnique({
      where: { documentId_userId: { documentId, userId: session.user.id } },
    });
    if (!collab) throw new Error('Forbidden');
  }

  // Get latest snapshot
  const snapshot = await prisma.documentSnapshot.findFirst({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  });

  // Create new document
  const newDoc = await prisma.document.create({
    data: {
      ownerId: session.user.id,
      title: `${original.title} — Copy`,
      wordCount: original.wordCount,
      lastAccessedAt: new Date(),
    },
  });

  // Copy snapshot
  if (snapshot) {
    await prisma.documentSnapshot.create({
      data: {
        documentId: newDoc.id,
        yjsState: snapshot.yjsState,
        stateVector: snapshot.stateVector,
        byteSize: snapshot.byteSize,
      },
    });
  }

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId: newDoc.id,
      userId: session.user.id,
      action: 'DOCUMENT_DUPLICATED',
      metadata: { sourceDocumentId: documentId },
    },
  });

  revalidatePath('/dashboard');
  return newDoc;
}

// ─── SEARCH DOCUMENTS ───
export async function searchDocuments(query: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error('Unauthorized');

  return prisma.document.findMany({
    where: {
      ownerId: session.user.id,
      status: 'ACTIVE',
      title: { contains: query, mode: 'insensitive' },
    },
    orderBy: { updatedAt: 'desc' },
    take: 20,
  });
}
```

### 3.2 API Routes

#### `apps/web/src/app/api/documents/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { listDocumentsSchema } from '@collabdoc/shared';

// GET /api/documents — List user's documents
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const input = listDocumentsSchema.parse(Object.fromEntries(searchParams));

  const where = {
    OR: [{ ownerId: session.user.id }, { collaborators: { some: { userId: session.user.id } } }],
    status: input.status,
    ...(input.starred !== undefined ? { isStarred: input.starred } : {}),
    ...(input.search ? { title: { contains: input.search, mode: 'insensitive' as const } } : {}),
  };

  const sortMap = {
    updated: 'updatedAt',
    created: 'createdAt',
    title: 'title',
    accessed: 'lastAccessedAt',
  } as const;

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      orderBy: { [sortMap[input.sort]]: input.order },
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
}

// POST /api/documents — Create new document (alternative to Server Action)
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  // Delegate to server action logic...
  // (implementation mirrors createDocument server action)

  return NextResponse.json(
    {
      /* new document */
    },
    { status: 201 },
  );
}
```

### 3.3 Dashboard Components (Key Files)

#### `apps/web/src/features/documents/components/document-card.tsx`

```tsx
'use client';

import { formatDistanceToNow } from 'date-fns';
import { Star, MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DocumentContextMenu } from './document-context-menu';
import { cn } from '@/lib/utils';

interface DocumentCardProps {
  id: string;
  title: string;
  isStarred: boolean;
  updatedAt: Date;
  lastAccessedAt: Date | null;
  collaboratorCount: number;
  owner: { name: string | null; avatarUrl: string | null };
  onStar: (id: string, starred: boolean) => void;
  onRename: (id: string, title: string) => void;
  onTrash: (id: string) => void;
  onDuplicate: (id: string) => void;
}

export function DocumentCard({
  id,
  title,
  isStarred,
  updatedAt,
  lastAccessedAt,
  collaboratorCount,
  owner,
  onStar,
  onRename,
  onTrash,
  onDuplicate,
}: DocumentCardProps) {
  const router = useRouter();

  const timeAgo = formatDistanceToNow(lastAccessedAt ?? updatedAt, { addSuffix: true });

  return (
    <DocumentContextMenu
      onRename={(newTitle) => onRename(id, newTitle)}
      onDuplicate={() => onDuplicate(id)}
      onTrash={() => onTrash(id)}
      onStar={() => onStar(id, !isStarred)}
      isStarred={isStarred}
      currentTitle={title}
    >
      <div
        onClick={() => router.push(`/d/${id}`)}
        className={cn(
          'group relative cursor-pointer rounded-xl border border-[var(--color-border-default)]',
          'bg-[var(--color-bg-primary)] p-5 transition-all duration-[var(--transition-normal)]',
          'hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-md)]',
          'active:scale-[0.99]',
        )}
        data-testid={`document-card-${id}`}
      >
        {/* Star indicator */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStar(id, !isStarred);
          }}
          className="absolute top-4 right-12 opacity-0 transition-opacity group-hover:opacity-100"
          data-testid={`star-${id}`}
        >
          <Star
            className={cn(
              'h-4 w-4',
              isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-[var(--color-text-tertiary)]',
            )}
          />
        </button>

        {/* Context menu trigger */}
        <div className="absolute top-4 right-4 opacity-0 transition-opacity group-hover:opacity-100">
          <MoreVertical className="h-4 w-4 text-[var(--color-text-tertiary)]" />
        </div>

        {/* Document icon placeholder */}
        <div className="mb-3 h-24 rounded-lg bg-[var(--color-bg-tertiary)]" />

        {/* Title */}
        <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>

        {/* Metadata */}
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          {timeAgo}
          {collaboratorCount > 0 &&
            ` · ${collaboratorCount} collaborator${collaboratorCount > 1 ? 's' : ''}`}
        </p>
      </div>
    </DocumentContextMenu>
  );
}
```

---

## 4. Testing Requirements

| Category    | File                               | Tests | Description                                                              |
| ----------- | ---------------------------------- | ----- | ------------------------------------------------------------------------ |
| Unit        | `document-card.test.tsx`           | 5     | Renders title, shows star, handles click, shows time, shows context menu |
| Unit        | `search-documents.test.tsx`        | 3     | Renders input, debounces query, shows clear button                       |
| Unit        | `create-document-button.test.tsx`  | 2     | Renders button, calls create action                                      |
| Integration | `api/documents.test.ts`            | 8     | CRUD operations, pagination, search, authorization                       |
| Integration | `api/documents-id.test.ts`         | 6     | Get/patch/delete by id, ownership check, 404                             |
| Integration | `actions/document-actions.test.ts` | 5     | Create, update, delete, duplicate, search                                |

**Phase 3 Test Total: ~29 tests**

---

## 5. Acceptance Criteria

| #   | Criterion                                               | Verification                     |
| --- | ------------------------------------------------------- | -------------------------------- |
| 1   | "New Document" creates doc and opens editor (`/d/{id}`) | Click button, verify redirect    |
| 2   | Dashboard shows Starred, Recent, All Documents sections | Visual inspection                |
| 3   | Document card shows title, time ago, collaborator count | Visual inspection                |
| 4   | Context menu: Rename opens dialog, saves new title      | Right-click → Rename             |
| 5   | Context menu: Star toggles with optimistic update       | Click star icon                  |
| 6   | Context menu: Move to trash shows toast with undo       | Click trash                      |
| 7   | Context menu: Duplicate creates copy                    | Click duplicate                  |
| 8   | Search filters documents by title (debounced)           | Type in search, verify filter    |
| 9   | Trash page shows trashed docs with restore/delete       | Navigate to /trash               |
| 10  | Permanent delete shows confirmation dialog              | Click delete on trashed doc      |
| 11  | Empty states render for no docs / no results            | Clear all docs / search nonsense |
| 12  | All 29 tests pass                                       | `npm run test`                   |
| 13  | Dashboard matches Stitch design reference               | Compare screenshots              |
