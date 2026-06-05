'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import * as Y from 'yjs';
import type { Awareness } from 'y-protocols/awareness';
import { SocketIOProvider, type ConnectionStatus } from '@collabdoc/yjs-utils';
import { generateSocketToken } from '@/features/auth/actions/generate-socket-token';

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

  const docRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<SocketIOProvider | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);

  // Use a ref to force re-render when doc is ready
  const [, setReady] = useState(0);

  useEffect(() => {
    let mounted = true;
    let provider: SocketIOProvider | null = null;

    async function init() {
      // 1. Generate auth token
      const token = await generateSocketToken();
      if (!token || !mounted) return;

      // 2. Create Y.Doc
      const doc = new Y.Doc();
      docRef.current = doc;

      // 3. Create provider
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      provider = new SocketIOProvider(socketUrl, documentId, doc, {
        authToken: token,
        autoConnect: true,
      });

      providerRef.current = provider;
      awarenessRef.current = provider.awareness;

      // 4. Listen for events
      provider.on('status', ([status]: [ConnectionStatus]) => {
        if (mounted) setConnectionStatus(status);
      });

      provider.on('sync', ([synced]: [boolean]) => {
        if (mounted) setIsSynced(synced);
      });

      provider.on('save-status', ([status]: [string]) => {
        if (mounted) setSaveStatus(status as 'saving' | 'saved' | 'error');
      });

      provider.on(
        'users',
        ([users]: [Array<{ userId: string; name: string; avatarUrl: string | null }>]) => {
          if (mounted) setConnectedUsers(users);
        },
      );

      provider.on(
        'user-joined',
        ([user]: [{ userId: string; name: string; avatarUrl: string | null }]) => {
          if (mounted) {
            setConnectedUsers((prev) => {
              // Avoid duplicates
              if (prev.some((u) => u.userId === user.userId)) return prev;
              return [...prev, user];
            });
          }
        },
      );

      provider.on('user-left', ([user]: [{ userId: string; name: string }]) => {
        if (mounted) {
          setConnectedUsers((prev) => prev.filter((u) => u.userId !== user.userId));
        }
      });

      // Trigger re-render so context consumers get the doc
      if (mounted) setReady((r) => r + 1);
    }

    init();

    return () => {
      mounted = false;
      provider?.destroy();
      docRef.current?.destroy();
      docRef.current = null;
      providerRef.current = null;
      awarenessRef.current = null;
    };
  }, [documentId]);

  return (
    <CollaborationContext.Provider
      value={{
        doc: docRef.current,
        provider: providerRef.current,
        awareness: awarenessRef.current,
        connectionStatus,
        isSynced,
        saveStatus,
        connectedUsers,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}
