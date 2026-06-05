import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';

export interface VersionItem {
  id: string;
  versionNum: number;
  titleAtTime: string;
  wordCount: number;
  trigger: string;
  createdAt: string;
  creator: {
    name: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  });

export function useVersions(documentId: string) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    data: versions,
    error,
    mutate,
    isLoading,
  } = useSWR<VersionItem[]>(isOpen ? `/api/documents/${documentId}/versions` : null, fetcher);

  const togglePanel = useCallback(() => setIsOpen((prev) => !prev), []);

  const createManualVersion = async () => {
    try {
      const res = await fetch(`/api/documents/${documentId}/versions`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create version');
      }
      toast.success('Version created successfully');
      mutate();
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('An unknown error occurred');
      }
    }
  };

  const restoreVersion = async (versionId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/versions/${versionId}/restore`, {
        method: 'POST',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to restore version');
      }
      toast.success('Version restored. Reloading...');

      // Full page reload to pull the new Yjs snapshot
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error('An unknown error occurred');
      }
    }
  };

  return {
    isOpen,
    setIsOpen,
    togglePanel,
    versions: versions || [],
    isLoading,
    error,
    createManualVersion,
    restoreVersion,
  };
}
