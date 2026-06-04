'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialUrl?: string;
  onConfirm: (url: string) => void;
}

export function LinkDialog({ open, onOpenChange, initialUrl = '', onConfirm }: LinkDialogProps) {
  const [url, setUrl] = useState(initialUrl);

  useEffect(() => {
    if (open) setUrl(initialUrl);
  }, [open, initialUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(url.trim());
    onOpenChange(false);
  };

  const handleRemove = () => {
    onConfirm('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialUrl ? 'Edit Link' : 'Insert Link'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
              autoFocus
              className="w-full"
              data-testid="link-url-input"
            />
          </div>
          <DialogFooter className="flex items-center gap-2">
            {initialUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                className="mr-auto text-red-500 hover:text-red-600"
              >
                Remove Link
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!url.trim()}>
              {initialUrl ? 'Update' : 'Insert'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
