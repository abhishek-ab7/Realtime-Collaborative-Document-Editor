'use client';

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import { SocketIOProvider, OfflinePersistence, type ConnectionStatus } from '@collabdoc/yjs-utils';
import { generateSocketToken } from '@/features/auth/actions/generate-socket-token';
import { toast } from 'sonner';

interface CollaborationContextValue {
  doc: Y.Doc | null;
  provider: SocketIOProvider | null;
  awareness: Awareness | null;
  connectionStatus: ConnectionStatus;
  isSynced: boolean;
  saveStatus: 'saving' | 'saved' | 'error' | 'idle';
  connectedUsers: Array<{ userId: string; name: string; avatarUrl: string | null }>;
}

const CollaborationContext = createContext<CollaborationContextValue>({
  doc: null,
  provider: null,
  awareness: null,
  connectionStatus: 'disconnected',
  isSynced: false,
  saveStatus: 'idle',
  connectedUsers: [],
});

export function useCollaborationContext() {
  return useContext(CollaborationContext);
}

interface CollaborationProviderProps {
  documentId: string;
  children: ReactNode;
}

export function CollaborationProvider({ documentId, children }: CollaborationProviderProps) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isSynced, setIsSynced] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | 'error' | 'idle'>('idle');
  const [connectedUsers, setConnectedUsers] = useState<
    Array<{ userId: string; name: string; avatarUrl: string | null }>
  >([]);

  const [doc, setDoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<SocketIOProvider | null>(null);
  const [awareness, setAwareness] = useState<Awareness | null>(null);

  // Refs for cleanup only (avoid stale closures in effects)
  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SocketIOProvider | null>(null);
  const offlineRef = useRef<OfflinePersistence | null>(null);

  useEffect(() => {
    let mounted = true;
    let localProvider: SocketIOProvider | null = null;

    async function init() {
      // 1. Generate auth token
      const token = await generateSocketToken();
      if (!token || !mounted) return;

      // 2. Create Y.Doc
      const newDoc = new Y.Doc();
      docRef.current = newDoc;

      // 3. Initialize IndexedDB offline persistence (load local state before network sync)
      const offlinePersistence = new OfflinePersistence(documentId, newDoc);
      offlineRef.current = offlinePersistence;
      try {
        await offlinePersistence.init();
      } catch {
        // Non-fatal — fall back to server-only sync
      }

      // 4. Create socket provider
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      localProvider = new SocketIOProvider(socketUrl, documentId, newDoc, {
        authToken: token,
        autoConnect: true,
      });
      providerRef.current = localProvider;

      // 5. Listen for events
      localProvider.on('status', (status: ConnectionStatus) => {
        if (mounted) setConnectionStatus(status);
      });

      localProvider.on('sync', (synced: boolean) => {
        if (mounted) setIsSynced(synced);
      });

      localProvider.on('save-status', (status: string) => {
        if (mounted) setSaveStatus(status as 'saving' | 'saved' | 'error');
      });

      localProvider.on(
        'users',
        (users: Array<{ userId: string; name: string; avatarUrl: string | null }>) => {
          if (mounted) setConnectedUsers(users);
        },
      );

      localProvider.on(
        'user-joined',
        (user: { userId: string; name: string; avatarUrl: string | null }) => {
          if (mounted) {
            setConnectedUsers((prev) => {
              if (prev.some((u) => u.userId === user.userId)) return prev;
              toast.info(`${user.name} joined`);
              return [...prev, user];
            });
          }
        },
      );

      localProvider.on('user-left', (user: { userId: string; name: string }) => {
        if (mounted) {
          toast.info(`${user.name} left`);
          setConnectedUsers((prev) => prev.filter((u) => u.userId !== user.userId));
        }
      });

      // Update render state
      if (mounted) {
        setDoc(newDoc);
        setProvider(localProvider);
        setAwareness(localProvider.awareness);
      }
    }

    init();

    return () => {
      mounted = false;
      providerRef.current?.destroy();
      offlineRef.current?.destroy();
      docRef.current?.destroy();
      setDoc(null);
      setProvider(null);
      setAwareness(null);
      docRef.current = null;
      providerRef.current = null;
      offlineRef.current = null;
    };
  }, [documentId]);

  const contextValue = useCallback(
    () => ({
      doc,
      provider,
      awareness,
      connectionStatus,
      isSynced,
      saveStatus,
      connectedUsers,
    }),
    [doc, provider, awareness, connectionStatus, isSynced, saveStatus, connectedUsers],
  );

  return (
    <CollaborationContext.Provider value={contextValue()}>{children}</CollaborationContext.Provider>
  );
}
