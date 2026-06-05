'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Share2, History, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { updateDocument } from '@/features/documents/actions/document-actions';
import { toast } from 'sonner';
import { PresenceAvatars } from '@/features/collaboration/components/presence-avatars';
import { TypingIndicator } from '@/features/collaboration/components/typing-indicator';
import { SaveStatus } from '@/features/editor/components/save-status';
import { ConnectionStatus } from '@/features/collaboration/components/connection-status';
import { ShareDialog } from '@/features/sharing/components/share-dialog';
import { canRenameDocument } from '@collabdoc/shared';
import type { DocumentRole } from '@/lib/permissions';

interface EditorHeaderProps {
  documentId: string;
  title: string;
  wordCount?: number;
  characterCount?: number;
  onOpenHistory?: () => void;
  role?: DocumentRole;
}

export function EditorHeader({
  documentId,
  title: initialTitle,
  onOpenHistory,
  role = 'OWNER',
}: EditorHeaderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canRename = canRenameDocument(role);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const saveTitle = async (newTitle: string) => {
    const trimmed = newTitle.trim() || 'Untitled Document';
    if (trimmed === initialTitle) return;
    setTitle(trimmed);
    try {
      await updateDocument(documentId, { title: trimmed });
    } catch {
      toast.error('Failed to save title');
      setTitle(initialTitle);
    }
  };

  const handleBlur = async () => {
    setIsEditing(false);
    await saveTitle(title);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
    if (e.key === 'Escape') {
      setTitle(initialTitle);
      setIsEditing(false);
    }
  };

  const handleTitleClick = () => {
    if (canRename) {
      setIsEditing(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
          {/* Left: Back + Title */}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Link
              href="/dashboard"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#94a3b8] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              title="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            {isEditing ? (
              <input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                placeholder="Untitled Document"
                aria-label="Rename Document"
                className="min-w-0 flex-1 rounded-md border border-[#4f46e5] bg-white px-2 py-0.5 text-base font-semibold text-[#0f172a] outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                data-testid="title-input"
              />
            ) : (
              <button
                type="button"
                onClick={handleTitleClick}
                disabled={!canRename}
                className={cn(
                  'min-w-0 flex-1 truncate rounded-md px-2 py-0.5 text-left text-base font-semibold text-[#0f172a]',
                  canRename ? 'cursor-pointer transition-all hover:bg-[#f8fafc]' : 'cursor-default',
                )}
                title={canRename ? 'Click to rename' : 'View only — cannot rename'}
                data-testid="document-title"
              >
                {title}
              </button>
            )}

            {/* View-only badge for non-editors */}
            {role === 'VIEWER' && (
              <Badge
                variant="secondary"
                className="shrink-0 gap-1 text-xs text-[#d97706]"
                data-testid="view-only-badge"
              >
                <Eye className="h-3 w-3" />
                View only
              </Badge>
            )}

            <ConnectionStatus />
            <SaveStatus />
            <TypingIndicator />
          </div>

          {/* Right: Actions */}
          <div className="flex shrink-0 items-center gap-4">
            <PresenceAvatars />
            {onOpenHistory && (
              <Button
                variant="ghost"
                size="sm"
                className="hidden gap-1.5 text-slate-500 hover:text-slate-900 sm:flex"
                onClick={onOpenHistory}
              >
                <History className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="hidden gap-1.5 sm:flex"
              onClick={() => setIsShareOpen(true)}
              data-testid="share-button"
            >
              <Share2 className="h-3.5 w-3.5" />
              Share
            </Button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94a3b8] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a]"
              data-testid="more-button"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <ShareDialog
        documentId={documentId}
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        currentUserRole={role || 'VIEWER'}
      />
    </>
  );
}
