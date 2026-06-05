'use client';

import { Cloud, CloudOff, Loader2, CheckCheck, AlertCircle } from 'lucide-react';
import { useCollaborationContext } from '@/features/collaboration/providers/collaboration-provider';
import { cn } from '@/lib/utils';

export function SaveStatus() {
  const { saveStatus, connectionStatus } = useCollaborationContext();

  const isOffline = connectionStatus === 'disconnected';

  if (isOffline) {
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-amber-500"
        data-testid="save-status"
        role="status"
        aria-live="polite"
      >
        <CloudOff className="h-3.5 w-3.5" />
        <span>Offline — saved locally</span>
      </div>
    );
  }

  const config = {
    idle: {
      icon: CheckCheck,
      text: 'All changes saved',
      color: 'text-slate-400',
      animate: false,
    },
    saving: {
      icon: Loader2,
      text: 'Saving...',
      color: 'text-slate-500',
      animate: true,
    },
    saved: {
      icon: Cloud,
      text: 'Saved to cloud',
      color: 'text-emerald-500',
      animate: false,
    },
    error: {
      icon: AlertCircle,
      text: 'Save failed',
      color: 'text-red-500',
      animate: false,
    },
  } as const;

  const { icon: Icon, text, color, animate } = config[saveStatus] ?? config.idle;

  return (
    <div
      className={cn('flex items-center gap-1.5 text-xs transition-colors', color)}
      data-testid="save-status"
      role="status"
      aria-live="polite"
    >
      <Icon className={cn('h-3.5 w-3.5', animate && 'animate-spin')} />
      <span>{text}</span>
    </div>
  );
}
