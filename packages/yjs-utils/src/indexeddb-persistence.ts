import { IndexeddbPersistence } from 'y-indexeddb';
import * as Y from 'yjs';

const DB_NAME = 'collabdoc-yjs';
const MAX_CACHED_DOCS = 20;
const LRU_KEY = 'collabdoc-yjs-lru';

interface LRUEntry {
  id: string;
  lastAccessed: number;
}

export class OfflinePersistence {
  private idbProvider: IndexeddbPersistence | null = null;
  private readonly doc: Y.Doc;
  private readonly documentId: string;

  constructor(documentId: string, doc: Y.Doc) {
    this.documentId = documentId;
    this.doc = doc;
  }

  /** Initialize IndexedDB persistence for this document */
  async init(): Promise<void> {
    // Update LRU list and evict old docs first
    await this.updateLRU(this.documentId);
    await this.evictOldDocs();

    // Create IndexedDB persistence for this document
    this.idbProvider = new IndexeddbPersistence(`${DB_NAME}-${this.documentId}`, this.doc);

    // Wait for initial sync from IndexedDB before returning
    await this.idbProvider.whenSynced;
  }

  /** Whether IndexedDB has synced local data for this document */
  get hasStoredData(): boolean {
    return this.idbProvider?.synced ?? false;
  }

  /** Update LRU access list in localStorage */
  private async updateLRU(documentId: string): Promise<void> {
    try {
      const lruJson = localStorage.getItem(LRU_KEY);
      const lru: LRUEntry[] = lruJson ? (JSON.parse(lruJson) as LRUEntry[]) : [];

      // Remove any existing entry for this doc then add to front
      const filtered = lru.filter((entry) => entry.id !== documentId);
      filtered.unshift({ id: documentId, lastAccessed: Date.now() });

      localStorage.setItem(LRU_KEY, JSON.stringify(filtered));
    } catch {
      // localStorage not available (SSR or private mode) — degrade gracefully
    }
  }

  /** Evict the oldest cached documents when over the limit */
  private async evictOldDocs(): Promise<void> {
    try {
      const lruJson = localStorage.getItem(LRU_KEY);
      if (!lruJson) return;

      const lru: LRUEntry[] = JSON.parse(lruJson) as LRUEntry[];
      if (lru.length <= MAX_CACHED_DOCS) return;

      // Delete IndexedDB databases for evicted entries
      const toEvict = lru.slice(MAX_CACHED_DOCS);
      for (const entry of toEvict) {
        const dbName = `${DB_NAME}-${entry.id}`;
        await new Promise<void>((resolve) => {
          const req = indexedDB.deleteDatabase(dbName);
          req.onsuccess = () => resolve();
          req.onerror = () => resolve();
        });
      }

      // Persist the trimmed LRU list
      localStorage.setItem(LRU_KEY, JSON.stringify(lru.slice(0, MAX_CACHED_DOCS)));
    } catch {
      // Non-critical — silent failure is acceptable here
    }
  }

  /** Clear all stored data for this document from IndexedDB */
  async clear(): Promise<void> {
    if (this.idbProvider) {
      await this.idbProvider.clearData();
    }
  }

  /** Tear down the provider and release resources */
  destroy(): void {
    this.idbProvider?.destroy();
    this.idbProvider = null;
  }
}
