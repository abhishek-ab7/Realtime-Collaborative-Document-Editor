'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateDocument } from '@/features/documents/actions/document-actions';
import { toast } from 'sonner';

interface EditorHeaderProps {
  documentId: string;
  title: string;
  lastSavedAt?: Date | null;
  isSaving?: boolean;
  wordCount?: number;
  characterCount?: number;
}

export function EditorHeader({
  documentId,
  title: initialTitle,
  lastSavedAt,
  isSaving = false,
  wordCount = 0,
  characterCount = 0,
}: EditorHeaderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const statusLabel = isSaving
    ? 'Saving...'
    : lastSavedAt
      ? `Saved ${new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : '';

  return (
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
              className="min-w-0 flex-1 rounded-md border border-[#4f46e5] bg-white px-2 py-0.5 text-base font-semibold text-[#0f172a] outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
              data-testid="title-input"
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className={cn(
                'min-w-0 flex-1 truncate rounded-md px-2 py-0.5 text-left text-base font-semibold text-[#0f172a]',
                'transition-all hover:bg-[#f8fafc]',
              )}
              title="Click to rename"
              data-testid="document-title"
            >
              {title}
            </button>
          )}

          {statusLabel && (
            <span className="shrink-0 text-xs text-[#94a3b8]" data-testid="save-status">
              {statusLabel}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="hidden gap-1.5 sm:flex"
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
  );
}
