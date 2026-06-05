import { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { History, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VersionItem } from '../../hooks/use-versions';

interface VersionPanelProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  versions: VersionItem[];
  isLoading: boolean;
  onCreateManualVersion: () => void;
  onRestoreVersion: (versionId: string) => void;
}

export function VersionPanel({
  isOpen,
  onClose,
  versions,
  isLoading,
  onCreateManualVersion,
  onRestoreVersion,
}: VersionPanelProps) {
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-[400px] flex-col border-l border-slate-200 bg-white shadow-2xl transition-transform duration-300">
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-slate-500" />
          <h2 className="text-lg font-semibold text-slate-900">Version History</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
          <X className="h-5 w-5 text-slate-500" />
        </Button>
      </div>

      <div className="border-b border-slate-100 bg-slate-50 p-4">
        <Button
          onClick={onCreateManualVersion}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          Save Current Version
        </Button>
        <p className="mt-2 text-center text-xs text-slate-500">
          Versions are auto-saved every 30 minutes.
        </p>
      </div>

      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-slate-400">Loading...</div>
        ) : versions.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 rounded-full bg-slate-100 p-4">
              <History className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-900">No versions yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Keep typing! We&apos;ll auto-save versions over time.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {versions.map((v, index) => (
              <div
                key={v.id}
                className={`flex cursor-pointer flex-col p-4 transition-colors hover:bg-slate-50 ${
                  selectedVersionId === v.id
                    ? 'border-l-2 border-indigo-500 bg-indigo-50 hover:bg-indigo-50'
                    : 'border-l-2 border-transparent'
                }`}
                onClick={() => setSelectedVersionId(selectedVersionId === v.id ? null : v.id)}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900">
                    {index === 0 && v.trigger !== 'MANUAL'
                      ? 'Current Version'
                      : `Version ${v.versionNum}`}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {v.trigger === 'MANUAL'
                      ? 'Manual'
                      : v.trigger === 'RESTORE_BACKUP'
                        ? 'Restore'
                        : 'Auto'}
                  </span>
                </div>

                <div className="mb-3 flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={v.creator.avatarUrl || ''} />
                    <AvatarFallback className="bg-slate-200 text-[10px]">
                      {v.creator.name?.charAt(0) || v.creator.email.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-slate-700">
                      {v.creator.name || v.creator.email}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="h-3 w-3" />
                      {format(new Date(v.createdAt), 'MMM d, h:mm a')}
                    </span>
                  </div>
                </div>

                {selectedVersionId === v.id && (
                  <div className="animate-in fade-in slide-in-from-top-2 mt-2 flex flex-col gap-2 border-t border-slate-200/60 pt-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
                      <span>{v.wordCount} words</span>
                      <span>{formatDistanceToNow(new Date(v.createdAt))} ago</span>
                    </div>
                    {/* Diff button could open a modal */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Open Diff Modal (TODO)
                          window.dispatchEvent(new CustomEvent('open-diff-viewer', { detail: v }));
                        }}
                      >
                        Preview & Diff
                      </Button>
                      {index !== 0 && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full bg-slate-900 text-xs text-white hover:bg-slate-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (
                              confirm(
                                'Are you sure you want to restore this version? Your current document state will be overwritten.',
                              )
                            ) {
                              onRestoreVersion(v.id);
                            }
                          }}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
