# Phase 08 — Version History

> **Days:** 29–33  
> **Status:** ⬜ Not Started  
> **Dependencies:** Phase 06 (Presence), Phase 07 (Persistence)  
> **Milestone:** M8-VERSIONS  
> **PRD Sections:** 5.6 (Version History)

---

## 1. Phase Objective

Implement user-facing version history with automatic version creation at 30-minute editing intervals and on room teardown, a timeline panel, read-only version preview, side-by-side diff view (Myers algorithm), version restore with automatic backup, and named versions. After this phase, users can **browse, compare, and restore any past version of their document.**

---

## 2. Day-by-Day Breakdown

### Day 29: Automatic Version Creation (Server)

| #    | Task                                                          | Est. Time | Output                          |
| ---- | ------------------------------------------------------------- | --------- | ------------------------------- |
| 29.1 | Implement version creation triggers on socket server          | 60 min    | 30-min interval + room teardown |
| 29.2 | Extract plain text from Yjs for diff/search                   | 30 min    | Text extraction utility         |
| 29.3 | Compute version number (auto-increment per document)          | 20 min    | Sequential versioning           |
| 29.4 | Store Yjs binary snapshot + plain text in `document_versions` | 30 min    | DB write logic                  |
| 29.5 | Version creation before restore (backup original)             | 20 min    | Pre-restore backup              |
| 29.6 | Version limit (max 100 per document, GC oldest)               | 20 min    | Garbage collection              |

**Day 29 Total: ~3 hours**

#### Server-Side Version Creation

```typescript
// apps/socket-server/src/rooms/version-manager.ts

import { prisma } from '@collabdoc/database';
import { extractPlainText } from './text-extraction';
import * as Y from 'yjs';
import { VERSION_INTERVAL_MS } from '@collabdoc/shared';
import { logger } from '../lib/logger';

const MAX_VERSIONS_PER_DOCUMENT = 100;

export class VersionManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  /** Start version creation timer for a room */
  startVersionTimer(documentId: string, doc: Y.Doc, userId: string): void {
    // Clear existing timer
    this.stopVersionTimer(documentId);

    const timer = setInterval(async () => {
      await this.createVersion(documentId, doc, userId, 'AUTO');
    }, VERSION_INTERVAL_MS);

    this.timers.set(documentId, timer);
  }

  /** Stop version timer for a room */
  stopVersionTimer(documentId: string): void {
    const timer = this.timers.get(documentId);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(documentId);
    }
  }

  /** Create a new version */
  async createVersion(
    documentId: string,
    doc: Y.Doc,
    createdByUserId: string,
    trigger: 'AUTO' | 'MANUAL' | 'RESTORE_BACKUP' | 'ROOM_TEARDOWN',
  ): Promise<string | null> {
    try {
      // Get next version number
      const lastVersion = await prisma.documentVersion.findFirst({
        where: { documentId },
        orderBy: { versionNumber: 'desc' },
        select: { versionNumber: true },
      });
      const nextVersionNum = (lastVersion?.versionNumber ?? 0) + 1;

      // Get Yjs state
      const yjsState = Buffer.from(Y.encodeStateAsUpdate(doc));
      const plainText = extractPlainText(doc);

      // Create version
      const version = await prisma.documentVersion.create({
        data: {
          documentId,
          createdBy: createdByUserId,
          versionNumber: nextVersionNum,
          yjsSnapshot: yjsState,
          plainText,
          byteSize: yjsState.length,
          wordCount: plainText.trim().split(/\s+/).filter(Boolean).length,
          trigger,
        },
      });

      // Garbage collect old versions
      await this.gcOldVersions(documentId);

      logger.info(
        {
          documentId,
          versionNumber: nextVersionNum,
          trigger,
          bytes: yjsState.length,
        },
        'Version created',
      );

      return version.id;
    } catch (error) {
      logger.error({ documentId, error }, 'Failed to create version');
      return null;
    }
  }

  /** Delete oldest versions beyond limit */
  private async gcOldVersions(documentId: string): Promise<void> {
    const toDelete = await prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      skip: MAX_VERSIONS_PER_DOCUMENT,
      select: { id: true },
    });

    if (toDelete.length > 0) {
      await prisma.documentVersion.deleteMany({
        where: { id: { in: toDelete.map((v) => v.id) } },
      });
    }
  }

  /** Clean up all timers */
  destroy(): void {
    for (const timer of this.timers.values()) {
      clearInterval(timer);
    }
    this.timers.clear();
  }
}

export const versionManager = new VersionManager();
```

### Day 30: Version API Routes

| #    | Task                                                               | Est. Time | Output                       |
| ---- | ------------------------------------------------------------------ | --------- | ---------------------------- |
| 30.1 | GET `/api/documents/[id]/versions` — list versions                 | 45 min    | Paginated list with metadata |
| 30.2 | GET `/api/documents/[id]/versions/[versionId]` — version detail    | 30 min    | Includes plain text          |
| 30.3 | GET `/api/documents/[id]/versions/[versionId]/diff` — compute diff | 60 min    | Myers diff algorithm         |
| 30.4 | POST `/api/documents/[id]/versions/[versionId]/restore` — restore  | 45 min    | Apply Yjs state + backup     |
| 30.5 | POST `/api/documents/[id]/versions` — create named version         | 20 min    | Manual snapshot              |

**Day 30 Total: ~3.5 hours**

#### Diff Computation

```typescript
// packages/shared/src/diff.ts
import { diffLines, diffWords, Change } from 'diff';

export interface DiffResult {
  changes: DiffChange[];
  stats: {
    added: number;
    removed: number;
    unchanged: number;
  };
}

export interface DiffChange {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
  lineNumber?: number;
}

/** Compute line-level diff between two texts */
export function computeDiff(oldText: string, newText: string): DiffResult {
  const changes = diffLines(oldText, newText);

  let addedCount = 0;
  let removedCount = 0;
  let unchangedCount = 0;

  const result: DiffChange[] = changes.map((change) => {
    const lines = change.value.split('\n').filter(Boolean).length;

    if (change.added) {
      addedCount += lines;
      return { type: 'added' as const, value: change.value };
    } else if (change.removed) {
      removedCount += lines;
      return { type: 'removed' as const, value: change.value };
    } else {
      unchangedCount += lines;
      return { type: 'unchanged' as const, value: change.value };
    }
  });

  return {
    changes: result,
    stats: { added: addedCount, removed: removedCount, unchanged: unchangedCount },
  };
}

/** Compute word-level diff for inline highlighting */
export function computeWordDiff(oldText: string, newText: string): Change[] {
  return diffWords(oldText, newText);
}
```

#### Restore API Route

```typescript
// apps/web/src/app/api/documents/[id]/versions/[versionId]/restore/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@collabdoc/database';
import { canRestoreVersion } from '@collabdoc/shared';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: documentId, versionId } = await params;

  // Check permissions
  const doc = await prisma.document.findUnique({ where: { id: documentId } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  let role = doc.ownerId === session.user.id ? 'OWNER' : null;
  if (!role) {
    const collab = await prisma.collaborator.findUnique({
      where: { documentId_userId: { documentId, userId: session.user.id } },
    });
    role = collab?.role ?? null;
  }
  if (!canRestoreVersion(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Get the version to restore
  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    select: { yjsSnapshot: true, versionNumber: true },
  });
  if (!version) return NextResponse.json({ error: 'Version not found' }, { status: 404 });

  // Create backup version of current state BEFORE restoring
  const currentSnapshot = await prisma.documentSnapshot.findFirst({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
  });

  if (currentSnapshot) {
    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId },
      orderBy: { versionNumber: 'desc' },
      select: { versionNumber: true },
    });

    await prisma.documentVersion.create({
      data: {
        documentId,
        createdBy: session.user.id,
        versionNumber: (lastVersion?.versionNumber ?? 0) + 1,
        yjsSnapshot: currentSnapshot.yjsState,
        plainText: `[Backup before restoring to v${version.versionNumber}]`,
        byteSize: currentSnapshot.byteSize,
        trigger: 'RESTORE_BACKUP',
      },
    });
  }

  // Overwrite the current snapshot with the restored version
  await prisma.documentSnapshot.create({
    data: {
      documentId,
      yjsState: version.yjsSnapshot,
      stateVector: Buffer.alloc(0), // Will be recomputed on load
      byteSize: version.yjsSnapshot.length,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      documentId,
      userId: session.user.id,
      action: 'VERSION_RESTORED',
      metadata: { versionNumber: version.versionNumber, versionId },
    },
  });

  return NextResponse.json({
    success: true,
    message: `Restored to version ${version.versionNumber}`,
  });
}
```

### Day 31: Version History Panel UI (Stitch MCP)

| #    | Task                                                    | Est. Time | Output                                |
| ---- | ------------------------------------------------------- | --------- | ------------------------------------- |
| 31.1 | **Stitch MCP**: Generate version history panel design   | 30 min    | `.stitch/designs/version-history.png` |
| 31.2 | Build `VersionHistoryPanel` sidebar component           | 60 min    | Slide-in panel                        |
| 31.3 | Build `VersionItem` component (timestamp, author, size) | 30 min    | List item                             |
| 31.4 | Build `useVersions` hook (fetch + manage versions)      | 30 min    | SWR-based fetching                    |
| 31.5 | Add "Version history" button to editor header           | 10 min    | Button + state toggle                 |

**Day 31 Total: ~2.5 hours**

#### Stitch MCP Prompt

```
A version history panel for a collaborative document editor. It slides in
from the right side (360px wide). White background with subtle left border.
Header: "Version History" in 16px semibold, close X button on the right.
Below: a vertical timeline list. Each entry shows:
- A small colored dot on the left (indigo for auto-save, green for manual)
- "Version 12" in 14px semibold
- "2 hours ago · Alice" in 12px gray
- "1,234 words · 5.2 KB" in 11px gray
Each entry is clickable with hover state. Selected entry has light indigo background.
Bottom: "Create named version" button. Inter font. Clean, minimal.
```

### Day 32: Diff View + Read-Only Preview

| #    | Task                                                       | Est. Time | Output                         |
| ---- | ---------------------------------------------------------- | --------- | ------------------------------ |
| 32.1 | Build `VersionDiff` component (side-by-side diff view)     | 90 min    | Green/red diff highlighting    |
| 32.2 | Build read-only version preview (TipTap in read-only mode) | 30 min    | Preview with version data      |
| 32.3 | Build `RestoreDialog` (confirmation before restore)        | 30 min    | Destructive action dialog      |
| 32.4 | Implement "Compare with current" diff view                 | 30 min    | Current vs selected version    |
| 32.5 | Install diff package                                       | 5 min     | `npm install diff @types/diff` |

**Day 32 Total: ~3 hours**

### Day 33: Tests + Polish

| #    | Task                                                         | Est. Time | Output              |
| ---- | ------------------------------------------------------------ | --------- | ------------------- |
| 33.1 | Unit tests for VersionHistoryPanel, VersionItem, VersionDiff | 45 min    | 8 tests             |
| 33.2 | Integration tests for version API routes                     | 60 min    | 10 tests            |
| 33.3 | Unit tests for diff computation                              | 20 min    | 4 tests             |
| 33.4 | E2E test: create → edit → view version → restore → verify    | 45 min    | Full lifecycle test |
| 33.5 | Polish panel animations (slide-in/out, transitions)          | 15 min    | CSS transitions     |
| 33.6 | Git commit: "M8: Version history complete"                   | 5 min     | Clean commit        |

**Day 33 Total: ~3 hours**

---

## 3. Testing Requirements

| Category    | File                             | Tests                                                 |
| ----------- | -------------------------------- | ----------------------------------------------------- |
| Unit        | `version-history-panel.test.tsx` | 3 — renders, loads versions, opens/closes             |
| Unit        | `version-item.test.tsx`          | 3 — renders metadata, selected state, click handler   |
| Unit        | `version-diff.test.tsx`          | 2 — renders diff, highlights changes                  |
| Unit        | `diff.test.ts`                   | 4 — added/removed/unchanged, empty inputs, word-level |
| Integration | `versions-api.test.ts`           | 6 — list, detail, diff, restore, create, GC           |
| Integration | `version-manager.test.ts`        | 4 — auto-create, timer, backup before restore         |
| E2E         | `versions.spec.ts`               | 2 — view history, restore version                     |

**Phase 8 Test Total: ~24 tests**

---

## 4. Acceptance Criteria

| #   | Criterion                                                                |
| --- | ------------------------------------------------------------------------ |
| 1   | Automatic versions created every 30 min of editing                       |
| 2   | Version created when last editor leaves the room                         |
| 3   | Version history panel slides in from right, shows chronological list     |
| 4   | Each version shows: number, timestamp, author, word count, size          |
| 5   | Clicking version shows read-only preview                                 |
| 6   | "Compare with current" shows side-by-side diff (green adds, red removes) |
| 7   | "Restore this version" reverts document and creates backup of current    |
| 8   | Users can create named manual versions                                   |
| 9   | Max 100 versions per document, oldest auto-deleted                       |
| 10  | Diff stats show lines added/removed/unchanged                            |
| 11  | All 24 tests pass                                                        |
