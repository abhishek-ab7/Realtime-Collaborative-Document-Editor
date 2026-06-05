'use client';

import { useConnectionStatus } from '../hooks/use-connection-status';

/**
 * Small badge showing the realtime connection status (connected/syncing/offline).
 * Renders a colored dot + text label.
 */
export function ConnectionStatus() {
  const { label, color, status } = useConnectionStatus();

  return (
    <div
      className="flex items-center gap-1.5 text-xs font-medium"
      data-testid="connection-status"
      data-status={status}
    >
      <span
        className="inline-block h-2 w-2 rounded-full transition-colors duration-300"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="text-[#64748b]">{label}</span>
    </div>
  );
}
