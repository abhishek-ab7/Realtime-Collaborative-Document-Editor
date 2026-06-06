'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface ShareLinkItem {
  id: string;
  shareUrl?: string;
  permission: 'VIEW' | 'EDIT';
  expiresAt: string | null;
  createdAt: string;
}

export function useShareLink(documentId: string) {
  const [links, setLinks] = useState<ShareLinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchLinks = useCallback(async () => {
    try {
      await Promise.resolve();
      setIsLoading(true);
      const res = await fetch(`/api/documents/${documentId}/share/link`);
      if (!res.ok) {
        // Non-owner will get 403 — that's fine, just show empty
        setLinks([]);
        return;
      }
      const data = await res.json();
      setLinks(data.links || []);
    } catch {
      setLinks([]);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchLinks();
    });
  }, [fetchLinks]);

  const generateLink = useCallback(
    async (permission: 'VIEW' | 'EDIT', expiresIn: string = 'never') => {
      try {
        setIsGenerating(true);
        const res = await fetch(`/api/documents/${documentId}/share/link`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ permission, expiresIn }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to generate share link');
          return null;
        }

        const link = await res.json();
        setLinks((prev) => [link, ...prev]);
        toast.success('Share link created');
        return link as ShareLinkItem;
      } catch {
        toast.error('Failed to generate share link');
        return null;
      } finally {
        setIsGenerating(false);
      }
    },
    [documentId],
  );

  const revokeAll = useCallback(async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/share/link`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || 'Failed to revoke share links');
        return;
      }

      setLinks([]);
      toast.success('All share links revoked');
    } catch {
      toast.error('Failed to revoke share links');
    }
  }, [documentId]);

  const copyToClipboard = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  }, []);

  return {
    links,
    isLoading,
    isGenerating,
    generateLink,
    revokeAll,
    copyToClipboard,
    refresh: fetchLinks,
  };
}
