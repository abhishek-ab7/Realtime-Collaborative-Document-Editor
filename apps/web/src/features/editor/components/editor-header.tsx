'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, MoreHorizontal, History, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateDocument } from '@/features/documents/actions/document-actions';
import { toast } from 'sonner';
import { PresenceAvatars } from '@/features/collaboration/components/presence-avatars';
import { TypingIndicator } from '@/features/collaboration/components/typing-indicator';
import { SaveStatus } from '@/features/editor/components/save-status';
import { ConnectionStatus } from '@/features/collaboration/components/connection-status';
import { ShareDialog } from '@/features/sharing/components/share-dialog';
import { useConnectionStatus } from '@/features/collaboration/hooks/use-connection-status';
import { useCollaborationContext } from '@/features/collaboration/providers/collaboration-provider';
import { canRenameDocument } from '@collabdoc/shared';
import type { DocumentRole } from '@/lib/permissions';
import type { Editor } from '@tiptap/react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface EditorHeaderProps {
  documentId: string;
  title: string;
  commentCount?: number;
  onOpenHistory?: () => void;
  onOpenComments?: () => void;
  onOpenAI?: () => void;
  role?: DocumentRole;
  editor?: Editor | null;
  onTitleSave?: (title: string) => void;
}

export function EditorHeader({
  documentId,
  title: initialTitle,
  commentCount,
  onOpenHistory,
  onOpenComments,
  onOpenAI,
  role = 'OWNER',
  editor,
  onTitleSave,
}: EditorHeaderProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showAutoSave, setShowAutoSave] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const { label: connectionLabel } = useConnectionStatus();
  const { saveStatus, connectionStatus } = useCollaborationContext();

  const getSaveStatusLabel = (status: string) => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved to cloud';
      case 'error':
        return 'Save failed';
      case 'idle':
      default:
        return 'All changes saved';
    }
  };
  const isOffline = connectionStatus === 'disconnected';
  const saveStatusLabel = isOffline ? 'Offline — saved locally' : getSaveStatusLabel(saveStatus);

  const canRename = canRenameDocument(role);

  const exportAsText = () => {
    if (!editor) return;
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document exported as Plain Text');
  };

  const exportAsMarkdown = () => {
    if (!editor) return;
    const text = editor.getText();
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document exported as Markdown');
  };

  const exportAsHTML = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'document'}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Document exported as HTML');
  };

  const exportAsPDF = () => {
    window.print();
    toast.success('Print dialog opened — save as PDF');
  };

  const trashDocument = async () => {
    if (confirm('Are you sure you want to move this document to Trash?')) {
      try {
        await updateDocument(documentId, { status: 'TRASHED' });
        toast.success('Document moved to trash');
        window.location.href = '/dashboard';
      } catch {
        toast.error('Failed to trash document');
      }
    }
  };

  const showDetails = () => {
    if (!editor) return;
    const words = editor.storage.characterCount?.words?.() ?? 0;
    const chars = editor.storage.characterCount?.characters?.() ?? 0;
    toast(`Document Info: "${title}"`, {
      description: `Access Role: ${role || 'VIEWER'} | Words: ${words} | Characters: ${chars}`,
    });
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    Promise.resolve().then(() => setTitle(initialTitle));
  }, [initialTitle]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const val = localStorage.getItem('collabdoc-auto-save') !== 'false';
      Promise.resolve().then(() => setShowAutoSave(val));
    }
  }, []);

  useEffect(() => {
    document.title = `${title} — Collabdoc`;
  }, [title]);

  useEffect(() => {
    const handleOpenShare = () => {
      setIsShareOpen(true);
    };
    window.addEventListener('open-share-dialog', handleOpenShare);
    return () => window.removeEventListener('open-share-dialog', handleOpenShare);
  }, []);

  useEffect(() => {
    const handleUpdateTitle = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newTitle = customEvent.detail?.title;
      if (newTitle) {
        const trimmed = newTitle.trim() || 'Untitled Document';
        setTitle(trimmed);
        onTitleSave?.(trimmed);
        updateDocument(documentId, { title: trimmed }).catch((err) => {
          console.error('Failed to update title via event:', err);
        });
      }
    };
    window.addEventListener('update-document-title', handleUpdateTitle);
    return () => window.removeEventListener('update-document-title', handleUpdateTitle);
  }, [documentId, onTitleSave]);

  const saveTitle = async (newTitle: string) => {
    const trimmed = newTitle.trim() || 'Untitled Document';
    if (trimmed === initialTitle) return;
    setTitle(trimmed);
    try {
      await updateDocument(documentId, { title: trimmed });
      onTitleSave?.(trimmed);
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
      <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b border-[#e2e8f0] bg-white px-4 md:px-10">
        {/* Left Section: Back, Brand Logo, Title & Menus */}
        <div className="flex min-w-0 flex-1 items-center gap-3 md:gap-6">
          <Link
            href="/dashboard"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#94a3b8] transition-all hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            title="Back to Dashboard"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          {/* Logo */}
          <div className="flex shrink-0 items-center gap-2">
            <svg
              className="h-6 w-6 text-[#3525cd]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
              <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            </svg>
            <span className="hidden text-lg font-bold text-[#3525cd] sm:inline-block">
              Collabdoc
            </span>
          </div>

          {/* Title & Document Menu */}
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-2">
              {isEditing ? (
                <input
                  ref={inputRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  placeholder="Untitled Document"
                  aria-label="Rename Document"
                  className="min-w-0 rounded-md border border-[#4f46e5] bg-white px-2 py-0.5 text-sm font-semibold text-[#0f172a] outline-none focus:ring-2 focus:ring-[#4f46e5]/20"
                  data-testid="title-input"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleTitleClick}
                  disabled={!canRename}
                  className={cn(
                    'min-w-0 truncate rounded-md px-2 py-0.5 text-left text-sm font-bold text-[#191c1e]',
                    canRename
                      ? 'cursor-pointer transition-all hover:bg-[#f8fafc]'
                      : 'cursor-default',
                  )}
                  title={canRename ? 'Click to rename' : 'View only — cannot rename'}
                  data-testid="document-title"
                >
                  {title}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Section: Statuses, Avatars, History, Share, User Profile */}
        <div className="flex shrink-0 items-center gap-2 md:gap-4">
          <div className="mr-1.5 hidden shrink-0 items-center gap-2 md:flex">
            <ConnectionStatus />
            {showAutoSave && <SaveStatus />}
            <TypingIndicator />
          </div>
          <div className="hidden md:flex">
            <PresenceAvatars />
          </div>

          {onOpenHistory && (
            <button
              type="button"
              onClick={onOpenHistory}
              className="hidden cursor-pointer rounded-full p-2 text-[#464555] transition-colors hover:bg-[#eceef0] active:opacity-80 md:block"
              title="Version History"
            >
              <History className="h-5 w-5" />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenComments}
            className="relative hidden cursor-pointer rounded-full p-2 text-[#464555] transition-colors hover:bg-[#eceef0] active:opacity-80 md:block"
            title="Comments"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            {commentCount !== undefined && commentCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 scale-90 items-center justify-center rounded-full bg-[#ef4444] text-[8px] leading-none font-bold text-white ring-1 ring-white">
                {commentCount}
              </span>
            )}
          </button>

          {onOpenAI && (
            <button
              type="button"
              onClick={onOpenAI}
              className="hidden cursor-pointer rounded-full p-2 text-[#464555] transition-colors hover:bg-[#eceef0] active:opacity-80 md:block"
              title="AI Assistant"
            >
              <Sparkles className="h-5 w-5 fill-indigo-50 text-indigo-500" />
            </button>
          )}

          <Button
            variant="default"
            size="sm"
            onClick={() => setIsShareOpen(true)}
            className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#4f46e5] px-4 py-2 font-medium text-white transition-colors hover:bg-[#4f46e5]/90"
            data-testid="share-button"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Share
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              className="cursor-pointer rounded-full p-1.5 text-[#464555] transition-colors outline-none hover:bg-[#eceef0] active:opacity-80"
              data-testid="more-button"
            >
              <MoreHorizontal className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={showDetails} disabled={!editor} className="cursor-pointer">
                Document Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={exportAsPDF} disabled={!editor} className="cursor-pointer">
                Export as PDF (.pdf)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportAsMarkdown}
                disabled={!editor}
                className="cursor-pointer"
              >
                Export as Markdown (.md)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportAsHTML}
                disabled={!editor}
                className="cursor-pointer"
              >
                Export as HTML (.html)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={exportAsText}
                disabled={!editor}
                className="cursor-pointer"
              >
                Export as Plain Text (.txt)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.print()} className="cursor-pointer">
                Print Document
              </DropdownMenuItem>

              <div className="md:hidden">
                <DropdownMenuSeparator />
                {onOpenHistory && (
                  <DropdownMenuItem onClick={onOpenHistory} className="cursor-pointer">
                    Version History
                  </DropdownMenuItem>
                )}
                {onOpenComments && (
                  <DropdownMenuItem onClick={onOpenComments} className="cursor-pointer">
                    Comments ({commentCount ?? 0})
                  </DropdownMenuItem>
                )}
                {onOpenAI && (
                  <DropdownMenuItem onClick={onOpenAI} className="cursor-pointer">
                    AI Assistant
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="text-xs font-medium text-slate-500">
                  Connection: {connectionLabel}
                </DropdownMenuItem>
                {showAutoSave && (
                  <DropdownMenuItem disabled className="text-xs font-medium text-slate-500">
                    Save Status: {saveStatusLabel}
                  </DropdownMenuItem>
                )}
              </div>
              {role === 'OWNER' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={trashDocument}
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    Move to Trash
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
