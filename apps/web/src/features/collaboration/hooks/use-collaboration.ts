'use client';

import { useCollaborationContext } from '../providers/collaboration-provider';

/**
 * Hook to access the collaboration Y.Doc, provider, and awareness instances.
 * Must be used within a <CollaborationProvider>.
 */
export function useCollaboration() {
  const { doc, provider, awareness, connectionStatus, isSynced, saveStatus, connectedUsers } =
    useCollaborationContext();

  return {
    doc,
    provider,
    awareness,
    connectionStatus,
    isSynced,
    saveStatus,
    connectedUsers,
    isConnected:
      connectionStatus === 'connected' ||
      connectionStatus === 'synced' ||
      connectionStatus === 'syncing',
    isOffline: connectionStatus === 'disconnected',
  };
}
