'use client';

import { formatDistanceToNow } from 'date-fns';
import { Star, MoreVertical, FileText, RotateCcw, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DocumentContextMenu } from './document-context-menu';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DocumentCardProps {
  id: string;
  title: string;
  isStarred: boolean;
  updatedAt: string | Date;
  lastAccessedAt: string | Date | null;
  collaboratorCount: number;
  owner: { id?: string; name: string | null; avatarUrl: string | null };
  isTrashedPage?: boolean;
  onStar?: (id: string, starred: boolean) => void;
  onRename?: (id: string, title: string) => void;
  onTrash?: (id: string) => void;
  onDuplicate?: (id: string) => void;
  onRestore?: (id: string) => void;
  onDeletePermanent?: (id: string) => void;
}

export function DocumentCard({
  id,
  title,
  isStarred,
  updatedAt,
  lastAccessedAt,
  collaboratorCount,
  owner,
  isTrashedPage = false,
  onStar,
  onRename,
  onTrash,
  onDuplicate,
  onRestore,
  onDeletePermanent,
}: DocumentCardProps) {
  const router = useRouter();

  const formattedDate = lastAccessedAt ? new Date(lastAccessedAt) : new Date(updatedAt);
  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(formattedDate, { addSuffix: true });
  } catch (e) {
    timeAgo = 'recently';
  }

  const handleCardClick = () => {
    if (!isTrashedPage) {
      router.push(`/d/${id}`);
    }
  };

  const initials =
    owner.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';

  return (
    <DocumentContextMenu
      currentTitle={title}
      isStarred={isStarred}
      isTrashedPage={isTrashedPage}
      onRename={onRename ? (newTitle) => onRename(id, newTitle) : undefined}
      onDuplicate={onDuplicate ? () => onDuplicate(id) : undefined}
      onTrash={onTrash ? () => onTrash(id) : undefined}
      onStar={onStar ? () => onStar(id, !isStarred) : undefined}
      onRestore={onRestore ? () => onRestore(id) : undefined}
      onDeletePermanent={onDeletePermanent ? () => onDeletePermanent(id) : undefined}
    >
      <div
        onClick={handleCardClick}
        className={cn(
          'group relative flex flex-col justify-between rounded-xl border border-[var(--color-border-default)]',
          'bg-[var(--color-bg-primary)] p-5 transition-all duration-[var(--transition-normal)]',
          isTrashedPage
            ? 'cursor-default'
            : 'cursor-pointer hover:-translate-y-[2px] hover:border-[var(--color-border-hover)] hover:shadow-md',
          'active:scale-[0.99]',
        )}
        data-testid={`document-card-${id}`}
      >
        <div>
          {/* Card Header (Icon, Star, Menu Actions) */}
          <div className="mb-3 flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand-primary)]/5 text-[var(--color-brand-primary)]">
              <FileText className="h-5 w-5" />
            </div>

            {/* Quick Actions (only visible on hover unless on Trashed page) */}
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              {isTrashedPage ? (
                <>
                  {onRestore && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(id);
                      }}
                      className="rounded-md p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                      title="Restore"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  )}
                  {onDeletePermanent && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Delegate to context menu confirmation via click or trigger directly
                        onDeletePermanent(id);
                      }}
                      className="rounded-md p-1.5 text-[var(--color-error)] hover:bg-red-50"
                      title="Delete permanently"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                <>
                  {onStar && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStar(id, !isStarred);
                      }}
                      className="rounded-md p-1.5 hover:bg-[var(--color-bg-tertiary)]"
                      data-testid={`star-${id}`}
                    >
                      <Star
                        className={cn(
                          'h-4 w-4',
                          isStarred
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-[var(--color-text-tertiary)]',
                        )}
                      />
                    </button>
                  )}
                  <div className="rounded-md p-1.5 text-[var(--color-text-tertiary)]">
                    <MoreVertical className="h-4 w-4" />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Title */}
          <h3
            className="truncate text-base font-semibold text-[var(--color-text-primary)]"
            title={title}
          >
            {title}
          </h3>

          {/* Time Ago */}
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{timeAgo}</p>
        </div>

        {/* Card Footer (Collaborator count & Owner profile) */}
        <div className="mt-5 flex items-center justify-between border-t border-[var(--color-border-default)] pt-3">
          <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
            {collaboratorCount > 0
              ? `${collaboratorCount} collaborator${collaboratorCount > 1 ? 's' : ''}`
              : 'Private'}
          </span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger
                render={
                  <div className="h-6 w-6 cursor-help overflow-hidden rounded-full ring-2 ring-white" />
                }
              >
                <Avatar className="h-full w-full">
                  <AvatarImage src={owner.avatarUrl ?? undefined} alt={owner.name ?? ''} />
                  <AvatarFallback className="flex items-center justify-center bg-[var(--color-brand-primary)] text-[10px] text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Owner: {owner.name || 'Unknown'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </DocumentContextMenu>
  );
}
