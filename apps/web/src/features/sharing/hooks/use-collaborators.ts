'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface CollaboratorItem {
  id: string;
  name: string | null;
  email: string;
  avatarUrl: string | null;
  role: 'OWNER' | 'EDITOR' | 'VIEWER';
  addedAt?: string;
}

interface CollaboratorResponse {
  owner: CollaboratorItem;
  collaborators: CollaboratorItem[];
}

export function useCollaborators(documentId: string) {
  const [owner, setOwner] = useState<CollaboratorItem | null>(null);
  const [collaborators, setCollaborators] = useState<CollaboratorItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCollaborators = useCallback(async () => {
    try {
      await Promise.resolve();
      setIsLoading(true);
      const res = await fetch(`/api/documents/${documentId}/collaborators`);
      if (!res.ok) throw new Error('Failed to fetch collaborators');
      const data: CollaboratorResponse = await res.json();
      setOwner(data.owner);
      setCollaborators(data.collaborators);
    } catch {
      toast.error('Failed to load collaborators');
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const addCollaborator = useCallback(
    async (email: string, role: 'EDITOR' | 'VIEWER') => {
      try {
        const res = await fetch(`/api/documents/${documentId}/collaborators`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, role }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to add collaborator');
          return false;
        }

        const newCollab = await res.json();
        setCollaborators((prev) => [
          ...prev,
          {
            id: newCollab.userId,
            name: newCollab.name,
            email: newCollab.email,
            avatarUrl: newCollab.avatarUrl,
            role: newCollab.role,
            addedAt: newCollab.addedAt,
          },
        ]);
        toast.success(`Added ${email} as ${role.toLowerCase()}`);
        return true;
      } catch {
        toast.error('Failed to add collaborator');
        return false;
      }
    },
    [documentId],
  );

  const updateRole = useCallback(
    async (userId: string, newRole: 'EDITOR' | 'VIEWER') => {
      try {
        const res = await fetch(`/api/documents/${documentId}/collaborators/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: newRole }),
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to update role');
          return;
        }

        setCollaborators((prev) =>
          prev.map((c) => (c.id === userId ? { ...c, role: newRole } : c)),
        );
        toast.success('Role updated');
      } catch {
        toast.error('Failed to update role');
      }
    },
    [documentId],
  );

  const removeCollaborator = useCallback(
    async (userId: string) => {
      try {
        const res = await fetch(`/api/documents/${documentId}/collaborators/${userId}`, {
          method: 'DELETE',
        });

        if (!res.ok) {
          const data = await res.json();
          toast.error(data.error || 'Failed to remove collaborator');
          return;
        }

        setCollaborators((prev) => prev.filter((c) => c.id !== userId));
        toast.success('Collaborator removed');
      } catch {
        toast.error('Failed to remove collaborator');
      }
    },
    [documentId],
  );

  return {
    owner,
    collaborators,
    isLoading,
    addCollaborator,
    updateRole,
    removeCollaborator,
    refresh: fetchCollaborators,
  };
}
