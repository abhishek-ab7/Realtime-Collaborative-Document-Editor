'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import { createDocument } from '../actions/document-actions';
import { cn } from '@/lib/utils';

interface CreateDocumentButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function CreateDocumentButton({
  className,
  variant = 'default',
  size = 'default',
}: CreateDocumentButtonProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleCreate = async () => {
    setIsPending(true);
    try {
      const doc = await createDocument();
      if (doc?.id) {
        router.push(`/d/${doc.id}`);
      }
    } catch (error) {
      console.error('Failed to create document:', error);
      setIsPending(false);
    }
  };

  return (
    <Button
      onClick={handleCreate}
      disabled={isPending}
      variant={variant}
      size={size}
      className={cn('gap-2 font-medium shadow-sm transition-all', className)}
      data-testid="create-document-button"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          New Document
        </>
      )}
    </Button>
  );
}
