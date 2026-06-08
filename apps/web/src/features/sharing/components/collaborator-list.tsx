'use client';

import { UserAvatar } from '@/components/ui/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { CollaboratorItem } from '../hooks/use-collaborators';

interface CollaboratorListProps {
  owner: CollaboratorItem | null;
  collaborators: CollaboratorItem[];
  isOwner: boolean;
  onUpdateRole: (userId: string, role: 'EDITOR' | 'VIEWER') => void;
  onRemove: (userId: string) => void;
}

export function CollaboratorList({
  owner,
  collaborators,
  isOwner,
  onUpdateRole,
  onRemove,
}: CollaboratorListProps) {
  return (
    <div className="space-y-1" data-testid="collaborator-list">
      <p className="mb-2 text-xs font-medium tracking-wide text-[#94a3b8] uppercase">
        Who has access
      </p>

      {/* Owner row */}
      {owner && (
        <div
          className="flex items-center gap-3 rounded-lg px-2 py-2"
          data-testid="collaborator-owner"
        >
          <UserAvatar
            src={owner.avatarUrl}
            name={owner.name || owner.email}
            size={32}
            color="#4f46e5"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#0f172a]">
              {owner.name || owner.email}
            </p>
            <p className="truncate text-xs text-[#94a3b8]">{owner.email}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Owner
          </Badge>
        </div>
      )}

      {/* Collaborator rows */}
      {collaborators.map((collab) => (
        <div
          key={collab.id}
          className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-[#f8fafc]"
          data-testid={`collaborator-${collab.id}`}
        >
          <UserAvatar
            src={collab.avatarUrl}
            name={collab.name || collab.email}
            size={32}
            color="#d97706"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[#0f172a]">
              {collab.name || collab.email}
            </p>
            <p className="truncate text-xs text-[#94a3b8]">{collab.email}</p>
          </div>

          {isOwner ? (
            <div className="flex items-center gap-1">
              <select
                value={collab.role}
                onChange={(e) => onUpdateRole(collab.id, e.target.value as 'EDITOR' | 'VIEWER')}
                className="h-7 rounded-md border border-[#e2e8f0] bg-white px-2 text-xs text-[#334155] outline-none focus:border-[#4f46e5] focus:ring-1 focus:ring-[#4f46e5]/20"
                data-testid={`role-select-${collab.id}`}
              >
                <option value="EDITOR">Editor</option>
                <option value="VIEWER">Viewer</option>
              </select>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 text-[#94a3b8] opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
                onClick={() => onRemove(collab.id)}
                data-testid={`remove-${collab.id}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Badge variant="outline" className="text-xs">
              {collab.role === 'EDITOR' ? 'Editor' : 'Viewer'}
            </Badge>
          )}
        </div>
      ))}

      {collaborators.length === 0 && (
        <p className="px-2 py-4 text-center text-xs text-[#94a3b8]">
          No collaborators yet. Invite someone above.
        </p>
      )}
    </div>
  );
}
