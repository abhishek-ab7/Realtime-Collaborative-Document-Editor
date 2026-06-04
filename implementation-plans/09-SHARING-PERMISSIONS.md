# Phase 09 — Sharing & Permissions (RBAC)

> **Days:** 34–39  
> **Status:** ⬜ Not Started  
> **Dependencies:** Phase 05 (Realtime), Phase 08 (Versions)  
> **Milestone:** M9-SHARING  
> **PRD Sections:** 5.7 (Sharing), 11 (Security)

---

## 1. Phase Objective

Implement the complete sharing and permissions system: role-based access control (Owner/Editor/Viewer), collaborator management (add/remove/change role), share link generation and revocation, permission enforcement at API, Socket.io, and UI layers, read-only editor mode for viewers, and activity logging for all sharing actions.

---

## 2. Day-by-Day Breakdown

### Day 34: Permission Enforcement Layer (API + Socket.io)

| #    | Task                                                               | Est. Time | Output                                 |
| ---- | ------------------------------------------------------------------ | --------- | -------------------------------------- |
| 34.1 | Build `getDocumentRole` utility (checks ownership + collaborators) | 45 min    | Central permission resolver            |
| 34.2 | Build API middleware wrapper for permission checks                 | 30 min    | `withPermission` higher-order function |
| 34.3 | Add permission check to all existing document API routes           | 45 min    | Retrofit authorization                 |
| 34.4 | Add permission check to Socket.io `join-room` handler              | 20 min    | Block unauthorized room access         |
| 34.5 | Enforce edit permission in `yjs-update` handler                    | 10 min    | Silently reject viewer edits           |
| 34.6 | Add role to socket metadata for quick checks                       | 10 min    | `socket.__role`                        |

**Day 34 Total: ~2.5 hours**

#### Permission Resolver

```typescript
// apps/web/src/lib/permissions.ts

import { prisma } from '@collabdoc/database';

export type DocumentRole = 'OWNER' | 'EDITOR' | 'VIEWER' | null;

/** Resolve a user's role for a given document */
export async function getDocumentRole(documentId: string, userId: string): Promise<DocumentRole> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    select: { ownerId: true },
  });

  if (!doc) return null;
  if (doc.ownerId === userId) return 'OWNER';

  const collab = await prisma.collaborator.findUnique({
    where: { documentId_userId: { documentId, userId } },
    select: { role: true },
  });

  return (collab?.role as DocumentRole) ?? null;
}

/** API route permission wrapper */
export function withPermission(
  requiredRole: 'VIEWER' | 'EDITOR' | 'OWNER',
  handler: (
    request: Request,
    context: { params: any; userId: string; role: DocumentRole },
  ) => Promise<Response>,
) {
  return async (request: Request, context: { params: Promise<any> }) => {
    const { auth } = await import('@/lib/auth');
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const documentId = params.id;

    const role = await getDocumentRole(documentId, session.user.id);
    if (!role) {
      return Response.json({ error: 'Document not found' }, { status: 404 });
    }

    const { hasMinRole } = await import('@collabdoc/shared');
    if (!hasMinRole(role, requiredRole)) {
      return Response.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return handler(request, { params, userId: session.user.id, role });
  };
}
```

### Day 35: Collaborator Management API

| #    | Task                                                             | Est. Time | Output                                            |
| ---- | ---------------------------------------------------------------- | --------- | ------------------------------------------------- |
| 35.1 | GET `/api/documents/[id]/collaborators` — list collaborators     | 30 min    | With user profiles                                |
| 35.2 | POST `/api/documents/[id]/collaborators` — add collaborator      | 45 min    | By email, check user exists                       |
| 35.3 | PATCH `/api/documents/[id]/collaborators/[userId]` — change role | 20 min    | Role update                                       |
| 35.4 | DELETE `/api/documents/[id]/collaborators/[userId]` — remove     | 20 min    | Remove access                                     |
| 35.5 | Activity logging for all collaborator actions                    | 20 min    | `COLLABORATOR_ADDED`, `_REMOVED`, `_ROLE_CHANGED` |
| 35.6 | Integration tests for collaborator API                           | 45 min    | 8 tests                                           |

**Day 35 Total: ~3 hours**

#### Collaborator API Routes

```typescript
// apps/web/src/app/api/documents/[id]/collaborators/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { getDocumentRole } from '@/lib/permissions';
import { canManageCollaborators } from '@collabdoc/shared';

// GET — List collaborators
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: documentId } = await params;
  const role = await getDocumentRole(documentId, session.user.id);
  if (!role) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const collaborators = await prisma.collaborator.findMany({
    where: { documentId },
    include: {
      user: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Also include owner
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { owner: { select: { id: true, name: true, email: true, avatarUrl: true } } },
  });

  return NextResponse.json({
    owner: { ...doc!.owner, role: 'OWNER' },
    collaborators: collaborators.map((c) => ({
      ...c.user,
      role: c.role,
      addedAt: c.createdAt,
    })),
  });
}

// POST — Add collaborator
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: documentId } = await params;
  const role = await getDocumentRole(documentId, session.user.id);

  if (!canManageCollaborators(role)) {
    return NextResponse.json({ error: 'Only owner can manage collaborators' }, { status: 403 });
  }

  const body = await request.json();
  const { email, role: inviteRole } = body;

  if (!email || !['EDITOR', 'VIEWER'].includes(inviteRole)) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: 'User not found. They must sign up first.' },
      { status: 404 },
    );
  }

  // Cannot add owner as collaborator
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (user.id === doc?.ownerId) {
    return NextResponse.json(
      { error: 'Cannot add document owner as collaborator' },
      { status: 400 },
    );
  }

  // Upsert collaborator
  const collaborator = await prisma.collaborator.upsert({
    where: { documentId_userId: { documentId, userId: user.id } },
    update: { role: inviteRole },
    create: {
      documentId,
      userId: user.id,
      role: inviteRole,
      invitedBy: session.user.id,
    },
  });

  // Activity log
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.user.id,
      action: 'COLLABORATOR_ADDED',
      metadata: { collaboratorEmail: email, role: inviteRole },
    },
  });

  return NextResponse.json(collaborator, { status: 201 });
}
```

### Day 36: Share Link System

| #    | Task                                                          | Est. Time | Output                     |
| ---- | ------------------------------------------------------------- | --------- | -------------------------- |
| 36.1 | POST `/api/documents/[id]/share/link` — generate share link   | 45 min    | Crypto-secure token        |
| 36.2 | GET `/api/documents/[id]/share/link` — get active share links | 15 min    | List links                 |
| 36.3 | DELETE `/api/documents/[id]/share/link` — revoke link         | 15 min    | Deactivate link            |
| 36.4 | GET `/share/[token]` page — validate and grant access         | 60 min    | Token validation + session |
| 36.5 | Handle share link expiration                                  | 15 min    | `expires_at` check         |
| 36.6 | Integration tests for share link API                          | 30 min    | 6 tests                    |

**Day 36 Total: ~3 hours**

#### Share Link Token Generation

```typescript
import { randomBytes, createHash } from 'crypto';
import { SHARE_TOKEN_BYTES } from '@collabdoc/shared';

/** Generate a share link token pair (raw + hash) */
export function generateShareToken(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(SHARE_TOKEN_BYTES).toString('base64url');
  const tokenHash = createHash('sha256').update(rawToken).digest('hex');
  return { rawToken, tokenHash };
}

/** Hash a raw token for lookup */
export function hashShareToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}
```

### Day 37: Share Dialog UI (Stitch MCP)

| #    | Task                                                     | Est. Time | Output                                         |
| ---- | -------------------------------------------------------- | --------- | ---------------------------------------------- |
| 37.1 | **Stitch MCP**: Generate share dialog design             | 30 min    | `.stitch/designs/share-dialog.png`             |
| 37.2 | Build `ShareDialog` component (tabs: People, Link)       | 60 min    | `features/sharing/components/share-dialog.tsx` |
| 37.3 | Build `CollaboratorList` (avatar + name + role dropdown) | 45 min    | List with role change                          |
| 37.4 | Build `InviteForm` (email input + role selector)         | 30 min    | Add collaborator form                          |
| 37.5 | Build `ShareLinkManager` (generate/copy/revoke link)     | 30 min    | Link management                                |
| 37.6 | Install required shadcn/ui components                    | 10 min    | Select, Switch, Tabs                           |

**Day 37 Total: ~3.5 hours**

#### Stitch MCP Prompt

```
A share dialog modal for a document editor. White background, 480px wide.
Tabbed interface: "People" tab (active) and "Link" tab.

PEOPLE TAB:
- Top: email input field with "Add people" placeholder + role dropdown (Editor/Viewer) + "Invite" button.
- Below: "Who has access" heading.
- List of users: each row has avatar (32px), name + email (left), role dropdown (right), remove X button.
  - First row: "Alice (Owner)" with "Owner" badge (not changeable).
  - Second row: "Bob" with "Editor" dropdown.
- Clean spacing between rows.

LINK TAB:
- "Anyone with the link" toggle switch.
- When enabled: link input (read-only) with "Copy link" button (indigo).
- Permission dropdown: "Can view" / "Can edit".
- "Link expires in" dropdown: Never / 1 day / 7 days / 30 days.

Bottom: "Done" button. Inter font. Indigo accent.
```

### Day 38: Read-Only Mode + UI Enforcement

| #    | Task                                                               | Est. Time | Output                   |
| ---- | ------------------------------------------------------------------ | --------- | ------------------------ |
| 38.1 | Modify editor to support read-only mode (TipTap `editable: false`) | 20 min    | Viewer mode              |
| 38.2 | Hide toolbar for viewers                                           | 10 min    | Conditional rendering    |
| 38.3 | Show "View only" badge for viewers                                 | 10 min    | Badge in editor header   |
| 38.4 | Show "Request edit access" button for viewers                      | 20 min    | Call-to-action           |
| 38.5 | Handle share link access flow end-to-end                           | 45 min    | Token → session → editor |
| 38.6 | Prevent viewers from joining editor room in write mode             | 15 min    | Socket enforcement       |

**Day 38 Total: ~2 hours**

### Day 39: Full Permission Matrix Tests + Polish

| #    | Task                                                     | Est. Time | Output              |
| ---- | -------------------------------------------------------- | --------- | ------------------- |
| 39.1 | Unit tests for ShareDialog, CollaboratorList, InviteForm | 45 min    | 8 tests             |
| 39.2 | Integration tests for full permission matrix             | 60 min    | 12 tests            |
| 39.3 | E2E test: share link access flow                         | 45 min    | Playwright test     |
| 39.4 | E2E test: viewer sees read-only editor                   | 30 min    | Playwright test     |
| 39.5 | Verify all permission combinations                       | 20 min    | Manual matrix check |
| 39.6 | Git commit: "M9: Sharing & permissions"                  | 5 min     | Clean commit        |

**Day 39 Total: ~3.5 hours**

---

## 3. Permission Matrix

| Action                    | OWNER | EDITOR | VIEWER         | No Access |
| ------------------------- | ----- | ------ | -------------- | --------- |
| View document             | ✅    | ✅     | ✅             | ❌        |
| Edit document content     | ✅    | ✅     | ❌ (read-only) | ❌        |
| Rename document           | ✅    | ❌     | ❌             | ❌        |
| Delete document           | ✅    | ❌     | ❌             | ❌        |
| Duplicate document        | ✅    | ✅     | ✅             | ❌        |
| Star document             | ✅    | ✅     | ✅             | ❌        |
| View version history      | ✅    | ✅     | ✅             | ❌        |
| Restore version           | ✅    | ✅     | ❌             | ❌        |
| Add collaborators         | ✅    | ❌     | ❌             | ❌        |
| Remove collaborators      | ✅    | ❌     | ❌             | ❌        |
| Change collaborator roles | ✅    | ❌     | ❌             | ❌        |
| Generate share link       | ✅    | ❌     | ❌             | ❌        |
| Revoke share link         | ✅    | ❌     | ❌             | ❌        |
| Join Socket.io room       | ✅    | ✅     | ✅             | ❌        |
| Send yjs-update           | ✅    | ✅     | ❌             | ❌        |

---

## 4. Testing Requirements

| Category    | File                          | Tests                                          |
| ----------- | ----------------------------- | ---------------------------------------------- |
| Unit        | `share-dialog.test.tsx`       | 3 — renders tabs, switches between People/Link |
| Unit        | `collaborator-list.test.tsx`  | 3 — renders users, role change, remove         |
| Unit        | `invite-form.test.tsx`        | 2 — validates email, submits                   |
| Unit        | `share-link-manager.test.tsx` | 3 — generate, copy, revoke                     |
| Integration | `collaborators-api.test.ts`   | 5 — list, add, change role, remove, 403        |
| Integration | `share-link-api.test.ts`      | 4 — generate, validate, expire, revoke         |
| Integration | `permission-matrix.test.ts`   | 8 — all combinations from matrix               |
| E2E         | `sharing.spec.ts`             | 3 — share link, viewer mode, edit access       |

**Phase 9 Test Total: ~31 tests**

---

## 5. Acceptance Criteria

| #   | Criterion                                                               |
| --- | ----------------------------------------------------------------------- |
| 1   | Owner can add/remove collaborators via share dialog                     |
| 2   | Owner can change collaborator roles (Editor ↔ Viewer)                   |
| 3   | Owner can generate share links with view/edit permission                |
| 4   | Share links can have expiration (1d, 7d, 30d, never)                    |
| 5   | Owner can revoke share links (existing links become invalid)            |
| 6   | Share link grants correct access level (view = read-only, edit = full)  |
| 7   | Viewer sees read-only editor (no toolbar, no typing, "View only" badge) |
| 8   | API returns 403 for insufficient permissions on all routes              |
| 9   | Socket.io rejects `yjs-update` from viewers                             |
| 10  | Socket.io rejects `join-room` for unauthorized users                    |
| 11  | Activity log records all sharing actions                                |
| 12  | Full permission matrix from table above is enforced                     |
| 13  | All 31 tests pass                                                       |
