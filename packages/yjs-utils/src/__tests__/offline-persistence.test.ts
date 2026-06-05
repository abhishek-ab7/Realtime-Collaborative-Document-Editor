import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as Y from 'yjs';
import { OfflinePersistence } from '../indexeddb-persistence';

// Mock y-indexeddb so we don't need a real IndexedDB in node test environment
vi.mock('y-indexeddb', () => ({
  IndexeddbPersistence: class {
    synced = true;
    whenSynced = Promise.resolve();
    clearData = vi.fn().mockResolvedValue(undefined);
    destroy = vi.fn();
    constructor(name: string, doc: Y.Doc) {}
  },
}));

// Mock localStorage and indexedDB globals
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const indexedDBMock = {
  deleteDatabase: vi.fn().mockImplementation((name) => {
    return {
      onsuccess: null,
      onerror: null,
      // Auto-trigger success asynchronously
      __triggerSuccess() {
        if (this.onsuccess) this.onsuccess();
      },
    };
  }),
};
Object.defineProperty(global, 'indexedDB', { value: indexedDBMock });

describe('OfflinePersistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  it('initializes and updates LRU correctly', async () => {
    const doc = new Y.Doc();
    const persistence = new OfflinePersistence('doc-1', doc);

    await persistence.init();

    expect(persistence.hasStoredData).toBe(true);

    const lru = JSON.parse(localStorageMock.getItem('collabdoc-yjs-lru')!);
    expect(lru.length).toBe(1);
    expect(lru[0].id).toBe('doc-1');
  });

  it('evicts oldest documents when exceeding MAX_CACHED_DOCS', async () => {
    // Fill up to max (20)
    const initialLru = Array.from({ length: 20 }, (_, i) => ({
      id: `doc-old-${i}`,
      lastAccessed: Date.now() - i * 1000,
    }));
    localStorageMock.setItem('collabdoc-yjs-lru', JSON.stringify(initialLru));

    const doc = new Y.Doc();
    const persistence = new OfflinePersistence('doc-new', doc);

    // Hack: mock indexedDB to immediately resolve
    indexedDBMock.deleteDatabase.mockImplementationOnce(() => {
      setTimeout(() => {
        const req = indexedDBMock.deleteDatabase.mock.results[0].value;
        if (req.onsuccess) req.onsuccess();
      }, 0);
      return {}; // Will be filled with onsuccess by the implementation
    });

    await persistence.init();

    const lru = JSON.parse(localStorageMock.getItem('collabdoc-yjs-lru')!);
    // Length should remain 20, but with the new doc at the front
    expect(lru.length).toBe(20);
    expect(lru[0].id).toBe('doc-new');
    expect(lru.find((e: any) => e.id === 'doc-old-19')).toBeUndefined();

    // Wait a tick for indexedDB deletion to be requested
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(indexedDBMock.deleteDatabase).toHaveBeenCalledWith('collabdoc-yjs-doc-old-19');
  });

  it('clears data correctly', async () => {
    const doc = new Y.Doc();
    const persistence = new OfflinePersistence('doc-1', doc);
    await persistence.init();

    await persistence.clear();

    // Testing the mock was called
    const instance = (persistence as any).idbProvider;
    expect(instance.clearData).toHaveBeenCalled();
  });

  it('destroys correctly', async () => {
    const doc = new Y.Doc();
    const persistence = new OfflinePersistence('doc-1', doc);
    await persistence.init();

    const instance = (persistence as any).idbProvider;
    persistence.destroy();

    expect(instance.destroy).toHaveBeenCalled();
    expect((persistence as any).idbProvider).toBeNull();
  });
});
