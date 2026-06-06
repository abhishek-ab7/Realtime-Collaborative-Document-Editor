'use client';

import { Editor } from '@tiptap/react';
import { FileText, Users, CheckCircle2 } from 'lucide-react';
import { useCollaborationContext } from '@/features/collaboration/providers/collaboration-provider';

interface EditorStatusBarProps {
  editor: Editor | null;
}

export function EditorStatusBar({ editor }: EditorStatusBarProps) {
  const { connectionStatus, connectedUsers } = useCollaborationContext();

  if (!editor) return null;

  const characterCount = editor.storage?.characterCount?.characters?.() ?? 0;
  const wordCount = editor.storage?.characterCount?.words?.() ?? 0;

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Synced';
      case 'connecting':
        return 'Syncing...';
      case 'disconnected':
        return 'Offline';
      default:
        return 'Saved';
    }
  };

  return (
    <div
      className="flex h-7 shrink-0 items-center justify-between border-t border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-4 text-xs text-[#94a3b8]"
      data-testid="editor-status-bar"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5" />
          <span>
            {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
          </span>
        </div>
        <span>·</span>
        <span>
          {characterCount.toLocaleString()} {characterCount === 1 ? 'character' : 'characters'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <CheckCircle2
            className={`h-3.5 w-3.5 ${
              connectionStatus === 'connected' ? 'text-green-500' : 'text-[#94a3b8]'
            }`}
          />
          <span>{getStatusText()}</span>
        </div>
        {connectedUsers.length > 1 && (
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-indigo-500" />
            <span>{connectedUsers.length} editing</span>
          </div>
        )}
      </div>
    </div>
  );
}
