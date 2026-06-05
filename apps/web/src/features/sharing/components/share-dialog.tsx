'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Users, Link2 } from 'lucide-react';
import { useCollaborators } from '../hooks/use-collaborators';
import { useShareLink } from '../hooks/use-share-link';
import { CollaboratorList } from './collaborator-list';
import { InviteForm } from './invite-form';
import { ShareLinkManager } from './share-link-manager';

interface ShareDialogProps {
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: 'OWNER' | 'EDITOR' | 'VIEWER';
}

export function ShareDialog({ documentId, isOpen, onClose, currentUserRole }: ShareDialogProps) {
  const {
    owner,
    collaborators,
    isLoading: collabLoading,
    addCollaborator,
    updateRole,
    removeCollaborator,
  } = useCollaborators(documentId);

  const { links, isGenerating, generateLink, revokeAll, copyToClipboard } =
    useShareLink(documentId);

  const isOwner = currentUserRole === 'OWNER';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]" data-testid="share-dialog">
        <DialogHeader>
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>
            Manage access and generate share links for this document.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="people">
          <TabsList variant="line" className="w-full">
            <TabsTrigger value="people" className="flex-1 gap-1.5">
              <Users className="h-3.5 w-3.5" />
              People
            </TabsTrigger>
            <TabsTrigger value="link" className="flex-1 gap-1.5">
              <Link2 className="h-3.5 w-3.5" />
              Link
            </TabsTrigger>
          </TabsList>

          {/* People Tab */}
          <TabsContent value="people" className="mt-4 space-y-4">
            {isOwner && <InviteForm onInvite={addCollaborator} disabled={collabLoading} />}

            {collabLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#e2e8f0] border-t-[#4f46e5]" />
              </div>
            ) : (
              <CollaboratorList
                owner={owner}
                collaborators={collaborators}
                isOwner={isOwner}
                onUpdateRole={updateRole}
                onRemove={removeCollaborator}
              />
            )}
          </TabsContent>

          {/* Link Tab */}
          <TabsContent value="link" className="mt-4">
            <ShareLinkManager
              links={links}
              isGenerating={isGenerating}
              onGenerate={generateLink}
              onRevokeAll={revokeAll}
              onCopy={copyToClipboard}
              isOwner={isOwner}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
