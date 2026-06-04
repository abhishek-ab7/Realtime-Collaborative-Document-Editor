# Phase 07 — Persistence & Offline Support

> **Days:** 25–28  
> **Status:** ⬜ Not Started  
> **Dependencies:** Phase 05 (Realtime Collaboration)  
> **Milestone:** M7-PERSISTENCE  
> **PRD Sections:** 5.5 (Persistence), 7 (CRDT & Sync)

---

## 1. Phase Objective

Harden the auto-save system with reliable debounced persistence, implement client-side IndexedDB caching for offline editing, build crash recovery flows, add save status UI, and implement snapshot garbage collection. After this phase, **no data is lost even if the server crashes, the user disconnects, or the browser closes unexpectedly.**

---

## 2. Day-by-Day Breakdown

### Day 25: IndexedDB Client-Side Persistence

| #    | Task                                                | Est. Time | Output                                            |
| ---- | --------------------------------------------------- | --------- | ------------------------------------------------- |
| 25.1 | Install and configure `y-indexeddb`                 | 15 min    | Client-side Yjs persistence                       |
| 25.2 | Build `IndexedDBProvider` wrapper class             | 60 min    | `packages/yjs-utils/src/indexeddb-persistence.ts` |
| 25.3 | Implement LRU eviction for old documents (max 20)   | 30 min    | Storage management                                |
| 25.4 | Integrate IndexedDB with CollaborationProvider      | 30 min    | Load from IDB before server sync                  |
| 25.5 | Test offline editing: disconnect → edit → reconnect | 30 min    | Manual verification                               |
| 25.6 | Track pending unsynced updates count                | 20 min    | `pendingUpdates` counter                          |

**Day 25 Total: ~3 hours**

#### `packages/yjs-utils/src/indexeddb-persistence.ts`

```typescript
import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';

const DB_NAME = 'collabdoc-yjs';
const MAX_CACHED_DOCS = 20;
const LRU_KEY = 'collabdoc-yjs-lru';

export class OfflinePersistence {
  private idbProvider: IndexeddbPersistence | null = null;
  private doc: Y.Doc;
  private documentId: string;

  constructor(documentId: string, doc: Y.Doc) {
    this.documentId = documentId;
    this.doc = doc;
  }

  /** Initialize IndexedDB persistence for this document */
  async init(): Promise<void> {
    // Update LRU list
    await this.updateLRU(this.documentId);

    // Evict old documents if needed
    await this.evictOldDocs();

    // Create IndexedDB persistence
    this.idbProvider = new IndexeddbPersistence(`${DB_NAME}-${this.documentId}`, this.doc);

    // Wait for initial sync from IndexedDB
    await this.idbProvider.whenSynced;
  }

  /** Check if there is stored data for this document */
  get hasStoredData(): boolean {
    return this.idbProvider?.synced ?? false;
  }

  /** Update LRU access list */
  private async updateLRU(documentId: string): Promise<void> {
    try {
      const lruJson = localStorage.getItem(LRU_KEY);
      const lru: { id: string; lastAccessed: number }[] = lruJson ? JSON.parse(lruJson) : [];

      // Remove existing entry for this doc
      const filtered = lru.filter((entry) => entry.id !== documentId);

      // Add to front
      filtered.unshift({ id: documentId, lastAccessed: Date.now() });

      // Store
      localStorage.setItem(LRU_KEY, JSON.stringify(filtered));
    } catch {
      // localStorage not available — graceful degradation
    }
  }

  /** Evict oldest cached documents beyond MAX_CACHED_DOCS */
  private async evictOldDocs(): Promise<void> {
    try {
      const lruJson = localStorage.getItem(LRU_KEY);
      if (!lruJson) return;

      const lru: { id: string; lastAccessed: number }[] = JSON.parse(lruJson);
      if (lru.length <= MAX_CACHED_DOCS) return;

      // Evict oldest entries
      const toEvict = lru.slice(MAX_CACHED_DOCS);
      for (const entry of toEvict) {
        // Delete from IndexedDB
        const dbName = `${DB_NAME}-${entry.id}`;
        await new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(dbName);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      }

      // Update LRU list
      const kept = lru.slice(0, MAX_CACHED_DOCS);
      localStorage.setItem(LRU_KEY, JSON.stringify(kept));
    } catch {
      // Silent failure — non-critical
    }
  }

  /** Clear stored data for this document */
  async clear(): Promise<void> {
    if (this.idbProvider) {
      await this.idbProvider.clearData();
    }
  }

  /** Destroy the provider */
  destroy(): void {
    this.idbProvider?.destroy();
  }
}
```

### Day 26: Server Persistence Hardening

| #    | Task                                                        | Est. Time | Output                           |
| ---- | ----------------------------------------------------------- | --------- | -------------------------------- |
| 26.1 | Implement retry with exponential backoff on DB failure      | 30 min    | 3-retry policy                   |
| 26.2 | Implement snapshot creation triggers (100 updates OR 5 min) | 30 min    | Snapshot timer                   |
| 26.3 | Implement final persist on room teardown (before destroy)   | 20 min    | Guaranteed save                  |
| 26.4 | Add `save-status` event emission to clients                 | 20 min    | 'saving' → 'saved' → 'error'     |
| 26.5 | Handle word count computation from Yjs XML fragment         | 30 min    | Extract plain text → count words |
| 26.6 | Update document `updatedAt` + `wordCount` on save           | 15 min    | Metadata update                  |
| 26.7 | Implement health check with persistence status              | 15 min    | `/health` endpoint               |

**Day 26 Total: ~2.5 hours**

#### Word Count Extraction from Yjs

```typescript
// Extract plain text from Yjs document for word counting
import * as Y from 'yjs';

export function extractPlainText(doc: Y.Doc): string {
  const xmlFragment = doc.getXmlFragment('default');
  return xmlFragmentToPlainText(xmlFragment);
}

function xmlFragmentToPlainText(fragment: Y.XmlFragment): string {
  let text = '';
  for (let i = 0; i < fragment.length; i++) {
    const child = fragment.get(i);
    if (child instanceof Y.XmlText) {
      text += child.toString();
    } else if (child instanceof Y.XmlElement) {
      text += xmlFragmentToPlainText(child as any);
      // Add newline after block elements
      const blockTags = ['paragraph', 'heading', 'listItem', 'blockquote', 'codeBlock'];
      if (blockTags.includes(child.nodeName)) {
        text += '\n';
      }
    }
  }
  return text;
}

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}
```

### Day 27: Save Status UI + Offline Indicators

| #    | Task                                                            | Est. Time | Output                                       |
| ---- | --------------------------------------------------------------- | --------- | -------------------------------------------- |
| 27.1 | Build `SaveStatus` component with 3 states                      | 30 min    | `features/editor/components/save-status.tsx` |
| 27.2 | Build offline banner ("You're offline — changes saved locally") | 20 min    | Dismissible banner                           |
| 27.3 | Build reconnection progress indicator                           | 20 min    | "Reconnecting..." with spinner               |
| 27.4 | Add `beforeunload` handler to warn on unsaved changes           | 15 min    | Browser warning                              |
| 27.5 | Implement sync indicator (shows pending update count)           | 20 min    | "Syncing 3 changes..."                       |

**Day 27 Total: ~2 hours**

#### `apps/web/src/features/editor/components/save-status.tsx`

```tsx
'use client';

import { Cloud, CloudOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { useCollaborationContext } from '@/features/collaboration/providers/collaboration-provider';
import { cn } from '@/lib/utils';

export function SaveStatus() {
  const { saveStatus, connectionStatus } = useCollaborationContext();

  const isOffline = connectionStatus === 'disconnected';

  const config = {
    idle: { icon: Check, text: 'All changes saved', color: 'text-[var(--color-text-tertiary)]' },
    saving: {
      icon: Loader2,
      text: 'Saving...',
      color: 'text-[var(--color-text-secondary)]',
      animate: true,
    },
    saved: { icon: Cloud, text: 'Saved to cloud', color: 'text-[var(--color-success)]' },
    error: { icon: AlertCircle, text: 'Save failed', color: 'text-[var(--color-error)]' },
  };

  if (isOffline) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-[var(--color-warning)]"
        data-testid="save-status"
      >
        <CloudOff className="h-3.5 w-3.5" />
        <span>Offline — saved locally</span>
      </div>
    );
  }

  const { icon: Icon, text, color, animate } = config[saveStatus] || config.idle;

  return (
    <div className={cn('flex items-center gap-1.5 text-xs', color)} data-testid="save-status">
      <Icon className={cn('h-3.5 w-3.5', animate && 'animate-spin')} />
      <span>{text}</span>
    </div>
  );
}
```

### Day 28: Integration Tests + Crash Recovery Validation

| #    | Task                                                           | Est. Time | Output              |
| ---- | -------------------------------------------------------------- | --------- | ------------------- |
| 28.1 | Integration test: offline editing → reconnect → merge          | 60 min    | E2E test            |
| 28.2 | Integration test: server crash → restart → no data loss        | 45 min    | Server restart test |
| 28.3 | Integration test: IndexedDB persistence across browser restart | 30 min    | Storage test        |
| 28.4 | Unit tests for SaveStatus, OfflinePersistence                  | 30 min    | 6 tests             |
| 28.5 | Test snapshot GC (verify old snapshots deleted)                | 20 min    | DB verification     |
| 28.6 | Verify word count updates on save                              | 10 min    | Manual + automated  |
| 28.7 | Git commit: "M7: Persistence & offline support"                | 5 min     | Clean commit        |

**Day 28 Total: ~3.5 hours**

---

## 3. Testing Requirements

| Category    | File                            | Tests                                              |
| ----------- | ------------------------------- | -------------------------------------------------- |
| Unit        | `save-status.test.tsx`          | 4 — idle, saving, saved, offline states            |
| Unit        | `offline-persistence.test.ts`   | 4 — init, LRU eviction, clear, destroy             |
| Integration | `persistence-hardening.test.ts` | 5 — retry, snapshot rotation, final save, GC       |
| Integration | `word-count.test.ts`            | 3 — extraction, counting, edge cases               |
| E2E         | `offline.spec.ts`               | 3 — offline edit, reconnect merge, browser restart |

**Phase 7 Test Total: ~19 tests**

---

## 4. Acceptance Criteria

| #   | Criterion                                                                  |
| --- | -------------------------------------------------------------------------- |
| 1   | Browser refresh → document fully recovered from server                     |
| 2   | Edit offline for 5 min → reconnect → all edits preserved and merged        |
| 3   | Two users edit offline → both reconnect → no conflicts, all content merged |
| 4   | Save status shows correct state (Saving → Saved → Offline)                 |
| 5   | `beforeunload` warns if unsaved changes exist                              |
| 6   | Server crash → restart → clients reconnect → state intact                  |
| 7   | Snapshot GC keeps at most 50 snapshots per document                        |
| 8   | Word count updates in database after debounced save                        |
| 9   | IndexedDB stores max 20 documents, evicts LRU                              |
| 10  | All 19 tests pass                                                          |
