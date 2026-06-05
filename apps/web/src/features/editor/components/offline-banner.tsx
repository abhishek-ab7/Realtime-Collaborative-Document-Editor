'use client';

import { useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { useCollaborationContext } from '@/features/collaboration/providers/collaboration-provider';

export function OfflineBanner() {
  const { connectionStatus } = useCollaborationContext();
  const [dismissed, setDismissed] = useState(false);

  const isOffline = connectionStatus === 'disconnected';

  if (!isOffline || dismissed) return null;

  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800"
      role="alert"
      aria-live="assertive"
      data-testid="offline-banner"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" />
        <span>
          <strong>You&rsquo;re offline</strong> — your changes are saved locally and will sync when
          reconnected.
        </span>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 transition-colors hover:bg-amber-100"
        aria-label="Dismiss offline banner"
        data-testid="offline-banner-dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
