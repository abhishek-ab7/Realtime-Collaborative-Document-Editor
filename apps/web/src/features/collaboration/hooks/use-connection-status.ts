'use client';

import { useCollaboration } from './use-collaboration';
import type { ConnectionStatus } from '@collabdoc/yjs-utils';

/**
 * Hook that provides a human-readable label and styling info for the connection state.
 */
export function useConnectionStatus() {
  const { connectionStatus, isSynced, saveStatus } = useCollaboration();

  const label = getStatusLabel(connectionStatus);
  const color = getStatusColor(connectionStatus);

  return {
    status: connectionStatus,
    isSynced,
    saveStatus,
    label,
    color,
  };
}

function getStatusLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'disconnected':
      return 'Offline';
    case 'connecting':
      return 'Connecting...';
    case 'connected':
      return 'Connected';
    case 'syncing':
      return 'Syncing...';
    case 'synced':
      return 'Connected';
    default:
      return 'Unknown';
  }
}

function getStatusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'disconnected':
      return '#ef4444'; // red
    case 'connecting':
    case 'syncing':
      return '#f59e0b'; // amber
    case 'connected':
    case 'synced':
      return '#22c55e'; // green
    default:
      return '#94a3b8'; // slate
  }
}
