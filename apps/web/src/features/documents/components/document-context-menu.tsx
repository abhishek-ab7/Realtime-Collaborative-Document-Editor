'use client';

import { useState } from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Star, Pencil, Copy, Trash2, RotateCcw } from 'lucide-react';

interface DocumentContextMenuProps {
  children: React.ReactNode;
  currentTitle: string;
  isStarred: boolean;
  isTrashedPage?: boolean;
  onRename?: (newTitle: string) => void;
  onDuplicate?: () => void;
  onTrash?: () => void;
  onStar?: () => void;
  onRestore?: () => void;
  onDeletePermanent?: () => void;
}

export function DocumentContextMenu({
  children,
  currentTitle,
  isStarred,
  isTrashedPage = false,
  onRename,
  onDuplicate,
  onTrash,
  onStar,
  onRestore,
  onDeletePermanent,
}: DocumentContextMenuProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(currentTitle);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim() && onRename) {
      onRename(renameValue.trim());
      setIsRenameOpen(false);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {isTrashedPage ? (
            <>
              {onRestore && (
                <ContextMenuItem onClick={onRestore}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </ContextMenuItem>
              )}
              {onDeletePermanent && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    variant="destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete permanently
                  </ContextMenuItem>
                </>
              )}
            </>
          ) : (
            <>
              {onStar && (
                <ContextMenuItem onClick={onStar}>
                  <Star className="mr-2 h-4 w-4" />
                  {isStarred ? 'Unstar' : 'Star'}
                </ContextMenuItem>
              )}
              {onRename && (
                <ContextMenuItem
                  onClick={() => {
                    setRenameValue(currentTitle);
                    setIsRenameOpen(true);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Rename
                </ContextMenuItem>
              )}
              {onDuplicate && (
                <ContextMenuItem onClick={onDuplicate}>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate
                </ContextMenuItem>
              )}
              {onTrash && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem onClick={onTrash} variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to trash
                  </ContextMenuItem>
                </>
              )}
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>

      {/* Rename Dialog */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleRenameSubmit}>
            <DialogHeader>
              <DialogTitle>Rename document</DialogTitle>
              <DialogDescription>Enter a new name for your document.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Document title"
                className="w-full"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRenameOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!renameValue.trim()}>
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Permanent Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete permanently</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete &quot;{currentTitle}&quot;? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (onDeletePermanent) {
                  onDeletePermanent();
                }
                setIsDeleteConfirmOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
